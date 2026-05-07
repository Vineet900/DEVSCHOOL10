import { useState } from 'react'

const starter = `<!doctype html>
<html>
  <head>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      h1 { color: #2563eb; }
    </style>
  </head>
  <body>
    <h1>DevGuru Practice Lab</h1>
    <p>Edit this code and test output live.</p>
    <script>
      console.log('Happy coding!')
    </script>
  </body>
</html>`

export default function PracticePage() {
  const [code, setCode] = useState(starter)

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Built-in Code Practice Lab</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Practice HTML, CSS, and JavaScript with instant preview.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="min-h-[360px] rounded-2xl border border-slate-300 bg-slate-50 p-3 font-mono text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
        />
        <iframe
          title="preview"
          srcDoc={code}
          className="min-h-[360px] w-full rounded-2xl border border-slate-300 bg-white dark:border-slate-700"
        />
      </div>
    </section>
  )
}
