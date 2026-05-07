export default function ProgressBar({ value, gradient = 'from-blue-500 to-violet-500' }) {
  return (
    <div className="mt-3">
      <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800/80">
        <div
          className={`h-2.5 rounded-full bg-linear-to-r ${gradient} transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{value}% complete</p>
    </div>
  )
}
