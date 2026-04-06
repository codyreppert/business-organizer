import { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { anthropic } from '@/lib/ai'
import Anthropic from '@anthropic-ai/sdk'
import type { Prisma } from '@prisma/client'
import { IRS_MILEAGE_RATE_2024 } from '@/lib/utils/mileage'

// ── Tool definitions ───────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_asset',
    description:
      'Create a new business asset (equipment or technology) in the database. Call this once you have at minimum: name and category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Asset name, e.g. "MacBook Pro 16-inch"' },
        category: { type: 'string', enum: ['equipment', 'technology'] },
        subcategory: {
          type: 'string',
          enum: ['machinery', 'tools', 'office', 'computer', 'phone', 'software', 'other'],
        },
        brand: { type: 'string' },
        model: { type: 'string' },
        serialNumber: { type: 'string' },
        purchaseDate: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        purchasePrice: { type: 'number', description: 'Amount in USD' },
        warrantyStart: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        warrantyEnd: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        depreciationMethod: { type: 'string', enum: ['straight-line', 'double-declining', 'none'] },
        usefulLifeYears: { type: 'number' },
        salvageValue: { type: 'number', description: 'Estimated salvage/residual value in USD' },
        status: { type: 'string', enum: ['active', 'retired', 'disposed'] },
        notes: { type: 'string' },
      },
      required: ['name', 'category'],
    },
  },
  {
    name: 'create_trip',
    description:
      'Create a new business trip. Call this once you have at minimum: startDate, endDate. Gather client/project, destination, mileage, and per diem if the user mentions them.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientOrProject: { type: 'string', description: 'Client name or project name' },
        description: { type: 'string', description: 'Brief description of trip purpose' },
        destination: { type: 'string', description: 'City, State or location' },
        startDate: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        endDate: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        miles: { type: 'number', description: 'Total miles driven' },
        mileageRate: {
          type: 'number',
          description: `IRS mileage rate per mile. Default to ${IRS_MILEAGE_RATE_2024} (2024 rate) if not specified.`,
        },
        perDiemDays: { type: 'number', description: 'Number of days for per diem' },
        perDiemRate: { type: 'number', description: 'Per diem rate per day in USD' },
        notes: { type: 'string' },
      },
      required: ['startDate', 'endDate'],
    },
  },
  {
    name: 'add_trip_expense',
    description:
      'Add an expense to an existing business trip. Use this when the user mentions a meal, hotel, Uber, etc. that was part of a specific trip.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tripId: { type: 'string', description: 'ID of the trip to add the expense to' },
        category: { type: 'string', enum: ['meals', 'lodging', 'transport', 'supplies', 'software', 'other'] },
        amount: { type: 'number', description: 'Amount in USD' },
        date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        merchant: { type: 'string', description: 'Merchant or vendor name' },
        description: { type: 'string', description: 'What was purchased' },
      },
      required: ['tripId', 'category', 'amount', 'date'],
    },
  },
  {
    name: 'create_expense',
    description:
      'Create a standalone business expense (not tied to a trip). The businessPurpose field MUST map to an IRS Schedule C recognized expense category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', enum: ['meals', 'lodging', 'transport', 'supplies', 'software', 'other'] },
        amount: { type: 'number', description: 'Amount in USD' },
        date: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        merchant: { type: 'string', description: 'Merchant or vendor name' },
        description: { type: 'string', description: 'What was purchased' },
        businessPurpose: {
          type: 'string',
          description:
            'IRS Schedule C business purpose. Must be one of the recognized IRS deductible categories listed in the system prompt.',
        },
        reimbursable: { type: 'boolean', description: 'Whether this will be reimbursed by a client or employer' },
      },
      required: ['category', 'amount', 'date'],
    },
  },
  {
    name: 'search_trips',
    description: 'Search existing business trips. Use to find a trip ID before adding expenses to it.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Client/project name or destination to search for' },
        year: { type: 'number', description: 'Filter by year (e.g. 2024)' },
      },
      required: [],
    },
  },
  {
    name: 'search_assets',
    description: 'Search existing business assets.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Name, brand, or keyword' },
        category: { type: 'string', enum: ['equipment', 'technology'] },
      },
      required: [],
    },
  },
  {
    name: 'search_expenses',
    description: 'Search standalone expenses.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string' },
        year: { type: 'number' },
      },
      required: [],
    },
  },
  {
    name: 'get_trip_details',
    description: 'Get full details of a trip including all expenses and totals.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tripId: { type: 'string' },
      },
      required: ['tripId'],
    },
  },
  {
    name: 'get_summary',
    description: 'Get year-to-date financial summary: total trip deductions and standalone expenses.',
    input_schema: {
      type: 'object' as const,
      properties: {
        year: { type: 'number', description: 'Tax year, defaults to current year' },
      },
      required: [],
    },
  },
]

// ── Tool execution ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'create_asset': {
      const userFields = ['name', 'category', 'status']
      const inferredFields = Object.keys(input).filter((k) => !userFields.includes(k))
      const asset = await db.businessAsset.create({
        data: {
          name: input.name as string,
          category: input.category as string,
          subcategory: (input.subcategory as string | undefined) ?? null,
          brand: (input.brand as string | undefined) ?? null,
          model: (input.model as string | undefined) ?? null,
          serialNumber: (input.serialNumber as string | undefined) ?? null,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate as string) : null,
          purchasePrice: (input.purchasePrice as number | undefined) ?? null,
          warrantyStart: input.warrantyStart ? new Date(input.warrantyStart as string) : null,
          warrantyEnd: input.warrantyEnd ? new Date(input.warrantyEnd as string) : null,
          depreciationMethod: (input.depreciationMethod as string | undefined) ?? null,
          usefulLifeYears: (input.usefulLifeYears as number | undefined) ?? null,
          salvageValue: (input.salvageValue as number | undefined) ?? null,
          status: (input.status as string | undefined) ?? 'active',
          notes: (input.notes as string | undefined) ?? null,
          inferredFields,
        },
      })
      return { success: true, asset }
    }

    case 'create_trip': {
      const userFields = ['startDate', 'endDate']
      const inferredFields = Object.keys(input).filter((k) => !userFields.includes(k))
      const trip = await db.businessTrip.create({
        data: {
          clientOrProject: (input.clientOrProject as string | undefined) ?? null,
          description: (input.description as string | undefined) ?? null,
          destination: (input.destination as string | undefined) ?? null,
          startDate: new Date(input.startDate as string),
          endDate: new Date(input.endDate as string),
          miles: (input.miles as number | undefined) ?? null,
          mileageRate: (input.mileageRate as number | undefined) ?? null,
          perDiemDays: (input.perDiemDays as number | undefined) ?? null,
          perDiemRate: (input.perDiemRate as number | undefined) ?? null,
          notes: (input.notes as string | undefined) ?? null,
          inferredFields,
        },
      })
      return { success: true, trip }
    }

    case 'add_trip_expense': {
      const trip = await db.businessTrip.findUnique({ where: { id: input.tripId as string } })
      if (!trip) return { error: 'Trip not found' }

      const expense = await db.tripExpense.create({
        data: {
          tripId: input.tripId as string,
          category: input.category as string,
          amount: input.amount as number,
          date: new Date(input.date as string),
          merchant: (input.merchant as string | undefined) ?? null,
          description: (input.description as string | undefined) ?? null,
          inferredFields: ['category', 'amount', 'date', 'merchant', 'description'].filter(
            (k) => input[k] != null
          ),
        },
      })
      return { success: true, expense, tripId: trip.id, tripName: trip.clientOrProject }
    }

    case 'create_expense': {
      const expense = await db.standaloneExpense.create({
        data: {
          category: input.category as string,
          amount: input.amount as number,
          date: new Date(input.date as string),
          merchant: (input.merchant as string | undefined) ?? null,
          description: (input.description as string | undefined) ?? null,
          businessPurpose: (input.businessPurpose as string | undefined) ?? null,
          reimbursable: (input.reimbursable as boolean | undefined) ?? false,
          inferredFields: ['category', 'amount', 'date', 'merchant', 'description', 'businessPurpose'].filter(
            (k) => input[k] != null
          ),
        },
      })
      return { success: true, expense }
    }

    case 'search_trips': {
      const year = input.year as number | undefined
      const trips = await db.businessTrip.findMany({
        where: {
          ...(input.query
            ? {
                OR: [
                  { clientOrProject: { contains: input.query as string, mode: 'insensitive' } },
                  { destination: { contains: input.query as string, mode: 'insensitive' } },
                  { description: { contains: input.query as string, mode: 'insensitive' } },
                ],
              }
            : {}),
          ...(year
            ? {
                startDate: {
                  gte: new Date(`${year}-01-01`),
                  lt: new Date(`${year + 1}-01-01`),
                },
              }
            : {}),
        },
        include: { expenses: { select: { amount: true } } },
        orderBy: { startDate: 'desc' },
        take: 10,
      })
      return {
        trips: trips.map((t) => ({
          id: t.id,
          clientOrProject: t.clientOrProject,
          destination: t.destination,
          startDate: t.startDate.toISOString().slice(0, 10),
          endDate: t.endDate.toISOString().slice(0, 10),
          miles: t.miles ? Number(t.miles) : null,
          expenseCount: t.expenses.length,
          expenseTotal: t.expenses.reduce((s, e) => s + Number(e.amount), 0),
        })),
      }
    }

    case 'search_assets': {
      const assets = await db.businessAsset.findMany({
        where: {
          ...(input.query
            ? {
                OR: [
                  { name: { contains: input.query as string, mode: 'insensitive' } },
                  { brand: { contains: input.query as string, mode: 'insensitive' } },
                ],
              }
            : {}),
          ...(input.category ? { category: input.category as string } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
      return {
        assets: assets.map((a) => ({
          id: a.id,
          name: a.name,
          category: a.category,
          subcategory: a.subcategory,
          brand: a.brand,
          status: a.status,
          purchasePrice: a.purchasePrice ? Number(a.purchasePrice) : null,
          purchaseDate: a.purchaseDate?.toISOString().slice(0, 10) ?? null,
        })),
      }
    }

    case 'search_expenses': {
      const year = input.year as number | undefined
      const expenses = await db.standaloneExpense.findMany({
        where: {
          ...(input.category ? { category: input.category as string } : {}),
          ...(year
            ? {
                date: {
                  gte: new Date(`${year}-01-01`),
                  lt: new Date(`${year + 1}-01-01`),
                },
              }
            : {}),
        },
        orderBy: { date: 'desc' },
        take: 20,
      })
      return {
        expenses: expenses.map((e) => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount),
          date: e.date.toISOString().slice(0, 10),
          merchant: e.merchant,
          businessPurpose: e.businessPurpose,
          reimbursable: e.reimbursable,
        })),
        total: expenses.reduce((s, e) => s + Number(e.amount), 0),
      }
    }

    case 'get_trip_details': {
      const trip = await db.businessTrip.findUnique({
        where: { id: input.tripId as string },
        include: { expenses: { orderBy: { date: 'asc' } } },
      })
      if (!trip) return { error: 'Trip not found' }

      const miles = trip.miles ? Number(trip.miles) : null
      const mileageRate = trip.mileageRate ? Number(trip.mileageRate) : null
      const mileageDeduction = miles != null && mileageRate != null ? miles * mileageRate : null
      const perDiem =
        trip.perDiemDays != null && trip.perDiemRate != null
          ? trip.perDiemDays * Number(trip.perDiemRate)
          : null
      const expenseTotal = trip.expenses.reduce((s, e) => s + Number(e.amount), 0)
      const total = (mileageDeduction ?? 0) + (perDiem ?? 0) + expenseTotal

      return {
        trip: {
          id: trip.id,
          clientOrProject: trip.clientOrProject,
          destination: trip.destination,
          startDate: trip.startDate.toISOString().slice(0, 10),
          endDate: trip.endDate.toISOString().slice(0, 10),
          miles,
          mileageRate,
          mileageDeduction,
          perDiemDays: trip.perDiemDays,
          perDiemRate: trip.perDiemRate ? Number(trip.perDiemRate) : null,
          perDiem,
          expenses: trip.expenses.map((e) => ({
            id: e.id,
            category: e.category,
            amount: Number(e.amount),
            date: e.date.toISOString().slice(0, 10),
            merchant: e.merchant,
            description: e.description,
          })),
          expenseTotal,
          total,
        },
      }
    }

    case 'get_summary': {
      const year = (input.year as number | undefined) ?? new Date().getFullYear()
      const yearStart = new Date(`${year}-01-01`)
      const yearEnd = new Date(`${year + 1}-01-01`)

      const [trips, expenses, assetCount] = await Promise.all([
        db.businessTrip.findMany({
          where: { startDate: { gte: yearStart, lt: yearEnd } },
          include: { expenses: { select: { amount: true } } },
        }),
        db.standaloneExpense.findMany({
          where: { date: { gte: yearStart, lt: yearEnd } },
          select: { amount: true, reimbursable: true },
        }),
        db.businessAsset.count({ where: { status: 'active' } }),
      ])

      const tripTotal = trips.reduce((sum, t) => {
        const miles = t.miles ? Number(t.miles) : 0
        const rate = t.mileageRate ? Number(t.mileageRate) : 0
        const perDiem = (t.perDiemDays ?? 0) * (t.perDiemRate ? Number(t.perDiemRate) : 0)
        const expTotal = t.expenses.reduce((s, e) => s + Number(e.amount), 0)
        return sum + miles * rate + perDiem + expTotal
      }, 0)

      const expenseTotal = expenses.reduce((s, e) => s + Number(e.amount), 0)
      const reimbursableTotal = expenses.filter((e) => e.reimbursable).reduce((s, e) => s + Number(e.amount), 0)

      return {
        year,
        trips: trips.length,
        tripTotal,
        expenses: expenses.length,
        expenseTotal,
        reimbursableTotal,
        grandTotal: tripTotal + expenseTotal,
        activeAssets: assetCount,
      }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ── System prompt ──────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return `You are a business finance assistant for the Business Organizer app. You help users record business assets, trips, and expenses through natural conversation — then structure and save them to their database.

Today's date is ${today}. The current IRS mileage rate is $${IRS_MILEAGE_RATE_2024}/mile (2024 rate). Apply this automatically when the user mentions driving.

## What you can do
- **Log assets**: equipment and technology the business owns (computers, machinery, phones, etc.)
- **Log trips**: business travel with mileage deductions, per diem, and trip expenses
- **Log expenses**: standalone business purchases not tied to a trip
- **Answer questions**: about what's been recorded, totals, trip details, etc.

## IRS-recognized business purposes (Schedule C)
When setting businessPurpose for any expense, ALWAYS use one of these IRS Schedule C categories:
- "Advertising" — ads, marketing, promotions
- "Car and truck expenses" — mileage, vehicle-related (prefer trip mileage tracking instead)
- "Commissions and fees" — payments to agents or third parties
- "Contract labor" — payments to independent contractors
- "Depreciation" — asset depreciation (use assets instead)
- "Employee benefit programs" — benefits for employees
- "Insurance" — business insurance premiums
- "Interest" — business loan interest
- "Legal and professional services" — lawyers, accountants, consultants
- "Office expenses" — office supplies, postage, small equipment
- "Pension and profit-sharing plans" — retirement contributions
- "Rent or lease — vehicles/equipment" — leased equipment
- "Rent or lease — business property" — office, warehouse space
- "Repairs and maintenance" — fixing business assets
- "Supplies" — raw materials, consumables
- "Taxes and licenses" — business licenses, permits, taxes
- "Travel" — airfare, hotel, transportation away from home
- "Meals (50% deductible)" — business meals with clients/colleagues
- "Utilities" — phone, internet, electricity for business
- "Wages" — salaries paid to employees
- "Software and subscriptions" — SaaS tools, software licenses
- "Education and training" — courses, books, conferences
- "Other expenses" — anything else (describe specifically)

When a user mentions an expense, ALWAYS ask for or infer the business purpose and map it to one of these categories. If it's ambiguous, ask.

## Conversation style
- Be concise and direct — this is a data-entry tool, not a general chatbot
- Confirm what you saved after each tool call
- After creating a trip, ask if they want to add expenses to it
- Ask follow-up questions one at a time — don't fire a list of questions
- All fields you populate (except required identifiers) are marked AI-inferred so the user can confirm them in the UI
- When the user gives you a date like "last Tuesday" or "yesterday", calculate the actual date from today's date
- If the user says "I drove to a client meeting", create a trip — don't just log an expense

## Receipt and document attachments
When the user attaches an image or PDF:
1. Extract every field you can see: amount, date, merchant, category, description, businessPurpose
2. Map the expense to the closest IRS Schedule C category above
3. Immediately call create_expense (or add_trip_expense if there's an active trip in context) — do not ask for confirmation unless the amount or date is completely illegible
4. Tell the user what you extracted and saved
5. All extracted fields are AI-inferred and will show InferredBadge in the UI for the user to confirm`
}

// ── SSE helpers ────────────────────────────────────────────────────────────────

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
}

// ── Message handler ────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!conversation) {
    return new Response(JSON.stringify({ error: 'Conversation not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in .env' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await request.json()
  const userText: string = body.content ?? ''
  const attachment: { base64: string; mediaType: string; filename: string } | undefined = body.attachment

  // What gets stored in DB — never store raw base64
  const dbContent = attachment
    ? `[Receipt: ${attachment.filename}]${userText ? `\n${userText}` : ''}`
    : userText

  await db.chatMessage.create({
    data: { conversationId: params.id, role: 'user', content: dbContent },
  })

  // Auto-title on first message
  if (!conversation.title && conversation.messages.length === 0) {
    const title = dbContent.slice(0, 60) + (dbContent.length > 60 ? '…' : '')
    await db.conversation.update({ where: { id: params.id }, data: { title } })
  }

  const history: Anthropic.MessageParam[] = conversation.messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // Build the user message content — include the attachment as a vision block if present
  if (attachment) {
    const isImage = attachment.mediaType.startsWith('image/')
    const userMessageContent: Anthropic.MessageParam['content'] = [
      isImage
        ? ({
            type: 'image',
            source: { type: 'base64', media_type: attachment.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: attachment.base64 },
          } as Anthropic.ImageBlockParam)
        : ({
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: attachment.base64 },
          } as Anthropic.DocumentBlockParam),
      { type: 'text', text: userText || 'Please extract the expense details from this receipt and save it.' },
    ]
    history.push({ role: 'user', content: userMessageContent })
  } else {
    history.push({ role: 'user', content: userText })
  }

  const systemPrompt = buildSystemPrompt()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        let fullText = ''
        const toolCallsAccumulated: Array<{ id: string; name: string; input: Record<string, unknown> }> = []
        let messages = [...history]

        while (true) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            tools: TOOLS,
            messages,
            stream: true,
          })

          let assistantText = ''
          const currentToolCalls: typeof toolCallsAccumulated = []
          let currentToolInput = ''
          let currentToolUseId = ''
          let currentToolName = ''
          let stopReason = ''

          for await (const event of response) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'tool_use') {
                currentToolUseId = event.content_block.id
                currentToolName = event.content_block.name
                currentToolInput = ''
                send({ type: 'tool_start', name: currentToolName })
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                assistantText += event.delta.text
                fullText += event.delta.text
                send({ type: 'text_delta', content: event.delta.text })
              } else if (event.delta.type === 'input_json_delta') {
                currentToolInput += event.delta.partial_json
              }
            } else if (event.type === 'content_block_stop') {
              if (currentToolName) {
                let parsedInput: Record<string, unknown> = {}
                try { parsedInput = JSON.parse(currentToolInput) } catch { /* ignore */ }
                currentToolCalls.push({ id: currentToolUseId, name: currentToolName, input: parsedInput })
                currentToolName = ''
                currentToolInput = ''
                currentToolUseId = ''
              }
            } else if (event.type === 'message_delta') {
              stopReason = event.delta.stop_reason ?? ''
            }
          }

          const assistantContentBlocks: Anthropic.MessageParam['content'] = []
          if (assistantText) {
            assistantContentBlocks.push({ type: 'text', text: assistantText })
          }
          for (const tc of currentToolCalls) {
            assistantContentBlocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input })
            toolCallsAccumulated.push(tc)
          }
          messages.push({ role: 'assistant', content: assistantContentBlocks })

          if (currentToolCalls.length === 0 || stopReason === 'end_turn') break

          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const tc of currentToolCalls) {
            const result = await executeTool(tc.name, tc.input)
            send({ type: 'tool_result', name: tc.name, result })
            toolResults.push({
              type: 'tool_result',
              tool_use_id: tc.id,
              content: JSON.stringify(result),
            })
            if (['create_trip', 'add_trip_expense'].includes(tc.name)) revalidatePath('/trips')
            if (['create_expense'].includes(tc.name)) revalidatePath('/expenses')
            if (['create_asset'].includes(tc.name)) revalidatePath('/assets')
          }
          messages.push({ role: 'user', content: toolResults })
        }

        await db.chatMessage.create({
          data: {
            conversationId: params.id,
            role: 'assistant',
            content: fullText,
            toolCalls: toolCallsAccumulated.length > 0
              ? (toolCallsAccumulated as unknown as Prisma.InputJsonValue)
              : undefined,
          },
        })

        send({ type: 'done' })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        send({ type: 'error', message: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
