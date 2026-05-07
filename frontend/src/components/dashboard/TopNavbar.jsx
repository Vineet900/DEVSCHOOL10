export default function TopNavbar({ title, menu, onMenuSelect }) {
  return (
    <header className="glass-card sticky top-0 z-20 rounded-2xl px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 md:text-base">{title}</h1>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {menu.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onMenuSelect?.(item)}
              className="interactive-chip shrink-0 rounded-full border border-slate-300/80 px-3 py-1 text-xs text-slate-700 transition hover:border-violet-400/60 hover:bg-white/60 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
