import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { getLegalDocBySlug } from '../data/legalDocs'

export default function LegalDocumentPage() {
  const location = useLocation()
  const slug = location.pathname.split('/').filter(Boolean).at(-1) || 'privacy-policy'
  const document = getLegalDocBySlug(slug)

  return (
    <div className="min-h-screen bg-bg-page text-slate-900 dark:text-white selection:bg-brand-cyan/30 transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-cyan/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/settings?tab=legal"
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white">{document.title}</h2>
            <p className="text-sm text-white/40 font-semibold uppercase tracking-widest mt-1">Legal Document</p>
          </div>
        </div>

        <article className="glass-card rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-8 sm:p-10">
          <div className="flex flex-col gap-4 border-b border-white/5 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-brand-cyan/10 p-3.5 text-brand-cyan flex-shrink-0">
                {document.slug === 'privacy-policy' ? <ShieldCheck size={24} /> : <FileText size={24} />}
              </span>
              <div>
                <h3 className="text-2xl font-black text-white">{document.title}</h3>
                <p className="mt-2 text-sm text-white/40 font-medium leading-relaxed">{document.summary}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {document.sections.map((section) => (
              <div
                key={section.heading}
                className="rounded-3xl border border-white/5 bg-white/[0.02] p-6"
              >
                <h4 className="text-lg font-black text-white">{section.heading}</h4>
                <p className="mt-3 text-sm leading-relaxed text-white/60 font-medium">{section.body}</p>
              </div>
            ))}
          </div>
        </article>
      </main>
    </div>
  )
}
