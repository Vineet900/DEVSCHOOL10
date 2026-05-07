import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { getLegalDocBySlug } from '../data/legalDocs'

export default function LegalDocumentPage() {
  const location = useLocation()
  const slug = location.pathname.split('/').filter(Boolean).at(-1) || 'privacy-policy'
  const document = getLegalDocBySlug(slug)

  return (
    <section className="space-y-6">
      <Link
        to="/settings"
        className="interactive-chip inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
      >
        <ArrowLeft size={16} />
        <span>Back to Settings</span>
      </Link>

      <article className="glass-card rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-100">
              {document.slug === 'privacy-policy' ? <ShieldCheck size={20} /> : <FileText size={20} />}
            </span>
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{document.title}</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{document.summary}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {document.sections.map((section) => (
            <div
              key={section.heading}
              className="rounded-3xl border border-slate-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{section.heading}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.body}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}
