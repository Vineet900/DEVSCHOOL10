import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'

export default function EditorPage() {
  const { state, actions } = useApp()
  const output = useMemo(() => state.editorCode, [state.editorCode])

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">Live Code Editor</h2>
      <p className="text-base text-slate-600 dark:text-slate-300">Write HTML, CSS, and JavaScript. Run and preview instantly.</p>

      <div className="flex gap-2">
        <button
          onClick={() => actions.saveEditorCode(state.editorCode)}
          className="interactive-strong rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {t(state.language, 'runCode')}
        </button>
        <button
          onClick={actions.resetEditorCode}
          className="interactive-chip rounded-xl border border-transparent bg-slate-200 px-4 py-2 text-sm font-semibold dark:bg-slate-800"
        >
          {t(state.language, 'resetCode')}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={state.editorCode}
          onChange={(event) => actions.saveEditorCode(event.target.value)}
          className="min-h-[360px] rounded-2xl border border-slate-300 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
        />
        <iframe
          title="devschool-preview"
          srcDoc={output}
          className="min-h-[360px] w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-700"
        />
      </div>
    </section>
  )
}
