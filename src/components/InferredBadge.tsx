/**
 * Visually marks a value as AI-inferred and not yet confirmed by the user.
 */
export default function InferredBadge({ label }: { label?: string }) {
  return (
    <span
      title={label ?? 'This value was inferred by AI and has not been confirmed'}
      aria-label={label ?? 'Unconfirmed AI inference'}
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 ml-1"
    >
      AI
    </span>
  )
}
