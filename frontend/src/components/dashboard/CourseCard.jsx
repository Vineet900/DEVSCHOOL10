import { ArrowRight } from 'lucide-react'
import GlassCard from './GlassCard'
import ProgressBar from './ProgressBar'

export default function CourseCard({
  title,
  progress,
  gradient,
  description = 'Open the next lesson in this path.',
  actionLabel = 'Open course',
  onOpen,
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h4>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        <span className="rounded-full border border-slate-300/80 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-slate-600 dark:border-white/20 dark:text-slate-200">
          Active
        </span>
      </div>
      <ProgressBar value={progress} gradient={gradient} />
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-300">
        <span>{actionLabel}</span>
        <ArrowRight size={14} />
      </div>
    </>
  )

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="glass-card interactive-card h-full w-full rounded-2xl p-4 text-left"
      >
        {body}
      </button>
    )
  }

  return <GlassCard>{body}</GlassCard>
}
