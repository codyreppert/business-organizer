import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── Business Assets ───────────────────────────────────────────────────────

  const hydraulicPress = await prisma.businessAsset.create({
    data: {
      name: 'Hydraulic Press',
      category: 'equipment',
      subcategory: 'machinery',
      brand: 'Baileigh',
      model: 'HP-50F',
      serialNumber: 'BAI2021-0310-H',
      purchaseDate: new Date('2021-03-10'),
      purchasePrice: 4200,
      warrantyStart: new Date('2021-03-10'),
      warrantyEnd: new Date('2023-03-10'),
      depreciationMethod: 'straight-line',
      usefulLifeYears: 7,
      salvageValue: 200,
      status: 'active',
    },
  })

  const macbook = await prisma.businessAsset.create({
    data: {
      name: 'MacBook Pro 16"',
      category: 'technology',
      subcategory: 'computer',
      brand: 'Apple',
      model: 'MK1H3LL/A',
      serialNumber: 'APL2022-1115-M',
      purchaseDate: new Date('2022-11-15'),
      purchasePrice: 2499,
      warrantyStart: new Date('2022-11-15'),
      warrantyEnd: new Date('2023-11-15'),
      depreciationMethod: 'double-declining',
      usefulLifeYears: 5,
      salvageValue: 100,
      status: 'active',
    },
  })

  await prisma.document.createMany({
    data: [
      {
        assetId: hydraulicPress.id,
        name: 'Baileigh Hydraulic Press Receipt',
        type: 'receipt',
        filePath: `/uploads/${hydraulicPress.id}/receipt.pdf`,
        mimeType: 'application/pdf',
      },
      {
        assetId: macbook.id,
        name: 'MacBook Pro Receipt',
        type: 'receipt',
        filePath: `/uploads/${macbook.id}/receipt.pdf`,
        mimeType: 'application/pdf',
      },
    ],
  })

  // ── Business Trips ────────────────────────────────────────────────────────

  const clientVisit = await prisma.businessTrip.create({
    data: {
      clientOrProject: 'Acme Corp Q1 Review',
      destination: 'Chicago, IL',
      startDate: new Date('2024-02-12'),
      endDate: new Date('2024-02-14'),
      miles: 240,
      mileageRate: 0.67,
      perDiemDays: 3,
      perDiemRate: 200,
    },
  })

  const conference = await prisma.businessTrip.create({
    data: {
      clientOrProject: 'React Summit 2024',
      destination: 'New York, NY',
      startDate: new Date('2024-05-15'),
      endDate: new Date('2024-05-17'),
      miles: 0,
      mileageRate: 0.67,
      perDiemDays: 3,
      perDiemRate: 200,
    },
  })

  // Trip expenses — client visit
  const [lodging1, lodging2] = await Promise.all([
    prisma.tripExpense.create({
      data: {
        tripId: clientVisit.id,
        category: 'meals',
        amount: 45.5,
        date: new Date('2024-02-12'),
        merchant: 'Giordano\'s Pizza',
        description: 'Team dinner',
      },
    }),
    prisma.tripExpense.create({
      data: {
        tripId: clientVisit.id,
        category: 'lodging',
        amount: 189,
        date: new Date('2024-02-12'),
        merchant: 'Marriott Chicago',
        description: 'Hotel night 1',
      },
    }),
  ])

  await prisma.tripExpense.create({
    data: {
      tripId: clientVisit.id,
      category: 'lodging',
      amount: 189,
      date: new Date('2024-02-13'),
      merchant: 'Marriott Chicago',
      description: 'Hotel night 2',
    },
  })

  // Trip expenses — conference
  await Promise.all([
    prisma.tripExpense.create({
      data: {
        tripId: conference.id,
        category: 'transport',
        amount: 699,
        date: new Date('2024-05-15'),
        merchant: 'React Summit',
        description: 'Conference ticket',
      },
    }),
    prisma.tripExpense.create({
      data: {
        tripId: conference.id,
        category: 'meals',
        amount: 87.25,
        date: new Date('2024-05-16'),
        merchant: 'Nobu NYC',
        description: 'Speaker dinner',
      },
    }),
    prisma.tripExpense.create({
      data: {
        tripId: conference.id,
        category: 'transport',
        amount: 32,
        date: new Date('2024-05-17'),
        merchant: 'Uber',
        description: 'Airport taxi',
      },
    }),
  ])

  // Trip documents
  await prisma.document.createMany({
    data: [
      {
        tripId: clientVisit.id,
        name: 'Marriott Hotel Receipt',
        type: 'receipt',
        filePath: `/uploads/trips/${clientVisit.id}/hotel-receipt.pdf`,
        mimeType: 'application/pdf',
      },
      {
        tripId: conference.id,
        name: 'React Summit Invoice',
        type: 'invoice',
        filePath: `/uploads/trips/${conference.id}/conference-invoice.pdf`,
        mimeType: 'application/pdf',
      },
    ],
  })

  // ── Standalone Expenses ───────────────────────────────────────────────────

  await Promise.all([
    prisma.standaloneExpense.create({
      data: {
        category: 'software',
        amount: 29.99,
        date: new Date('2024-01-05'),
        merchant: 'Figma',
        description: 'Monthly subscription',
        reimbursable: false,
      },
    }),
    prisma.standaloneExpense.create({
      data: {
        category: 'supplies',
        amount: 124.5,
        date: new Date('2024-01-18'),
        merchant: 'Staples',
        description: 'Printer paper and ink cartridges',
        businessPurpose: 'Office supplies',
        reimbursable: true,
      },
    }),
    prisma.standaloneExpense.create({
      data: {
        category: 'meals',
        amount: 62,
        date: new Date('2024-03-22'),
        merchant: 'The Capital Grille',
        description: 'Client lunch — Q2 proposal',
        businessPurpose: 'Client entertainment',
        reimbursable: false,
      },
    }),
  ])

  const assetCount = await prisma.businessAsset.count()
  const tripCount = await prisma.businessTrip.count()
  const tripExpenseCount = await prisma.tripExpense.count()
  const standaloneCount = await prisma.standaloneExpense.count()
  const documentCount = await prisma.document.count()

  console.log('Seeded:')
  console.log(`  ${assetCount} business assets`)
  console.log(`  ${tripCount} business trips (with ${tripExpenseCount} trip expenses)`)
  console.log(`  ${standaloneCount} standalone expenses`)
  console.log(`  ${documentCount} documents`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
