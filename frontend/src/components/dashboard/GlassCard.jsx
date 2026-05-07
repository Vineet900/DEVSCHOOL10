export default function GlassCard({ children, className = '' }) {
  return (
    <article
      className={`glass-card rounded-2xl p-4 ${className}`}
    >
      {children}
    </article>
  )
}
