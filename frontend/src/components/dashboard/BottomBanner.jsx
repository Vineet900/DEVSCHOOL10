import GlassCard from './GlassCard'

export default function BottomBanner({ onAction, actionLabel = 'Explore rewards' }) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-wide text-orange-500 dark:text-orange-300">Growth Zone</p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Learn More, Earn More</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Complete strict sessions and assessments to unlock premium rewards and future INR redemption.
          </p>
          {onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="interactive-strong mt-4 rounded-xl bg-linear-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-black"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
        <div className="h-24 w-full rounded-2xl border border-dashed border-slate-300/80 bg-linear-to-br from-violet-500/20 via-blue-500/20 to-orange-500/20 md:w-60">
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-slate-600 dark:text-slate-300">
            Rewards, streaks, and project unlocks update as you learn.
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
