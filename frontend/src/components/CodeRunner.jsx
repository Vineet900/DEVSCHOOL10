import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  RotateCcw, 
  Terminal, 
  Layout, 
  Code2, 
  Eye, 
  Sliders, 
  Layers, 
  Trash2,
  Maximize2
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CodeRunner({ initialCode, onRun }) {
  const [code, setCode] = useState(initialCode || `<!DOCTYPE html>
<html>
  <head>
    <style>
      body { 
        background: #050816; 
        color: #fff; 
        font-family: sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
      }
      h1 { 
        color: #22d3ee;
        text-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
      }
    </style>
  </head>
  <body>
    <h1>Hello DevSchool!</h1>
    <script>
      console.log("Welcome to DevSchool coding workspace!");
      console.warn("Try adding some interactive logic!");
    </script>
  </body>
</html>`)

  // Helper to inject override script
  const getRunnableDoc = (sourceCode) => {
    if (!sourceCode) return '';
    const overrideScript = `
      <script>
        (function() {
          const _log = console.log;
          const _error = console.error;
          const _warn = console.warn;
          
          console.log = function(...args) {
            _log.apply(console, args);
            window.parent.postMessage({
              type: 'CONSOLE_LOG',
              level: 'info',
              content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          };
          
          console.error = function(...args) {
            _error.apply(console, args);
            window.parent.postMessage({
              type: 'CONSOLE_LOG',
              level: 'error',
              content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          };
          
          console.warn = function(...args) {
            _warn.apply(console, args);
            window.parent.postMessage({
              type: 'CONSOLE_LOG',
              level: 'warn',
              content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
            }, '*');
          };

          window.onerror = function(message, source, lineno, colno, error) {
            window.parent.postMessage({
              type: 'CONSOLE_LOG',
              level: 'error',
              content: message + ' (line ' + lineno + ')'
            }, '*');
          };
        })();
      </script>
    `;
    return sourceCode.includes('<head>') 
      ? sourceCode.replace('<head>', `<head>${overrideScript}`)
      : overrideScript + sourceCode;
  };

  const [output, setOutput] = useState(() => getRunnableDoc(initialCode || ''))
  const [isRunning, setIsRunning] = useState(false)
  const [layoutMode, setLayoutMode] = useState('split') // 'split', 'editor', 'preview'
  const [activePreviewTab, setActivePreviewTab] = useState('preview') // 'preview', 'console'
  const [consoleLogs, setConsoleLogs] = useState([])

  // Watch for message events from iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, {
          level: e.data.level,
          content: e.data.content,
          time: new Date().toLocaleTimeString()
        }])
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Update output preview automatically when code changes (live reload like a browser)
  useEffect(() => {
    const timer = setTimeout(() => {
      setOutput(getRunnableDoc(code))
    }, 450)
    return () => clearTimeout(timer)
  }, [code])

  const handleRun = () => {
    setIsRunning(true)
    setConsoleLogs([]) // clear logs
    
    setTimeout(() => {
      setOutput(getRunnableDoc(code))
      setIsRunning(false)
      toast.success('Code executed successfully!')
      if (onRun) onRun(code)
    }, 600)
  }

  const handleReset = () => {
    setCode(initialCode || '')
    setOutput(getRunnableDoc(initialCode || ''))
    setConsoleLogs([])
    toast.success('Workspace reset complete')
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] rounded-3xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/80 bg-[#0d1322]">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Code2 size={14} />
            index.html
          </div>
        </div>

        {/* View Mode & Toggles */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          {/* Segmented Layout Selector */}
          <div className="flex bg-[#080912] border border-slate-800/80 rounded-xl p-0.5">
            {[
              { id: 'editor', label: 'Editor' },
              { id: 'split', label: 'Split' },
              { id: 'preview', label: 'Preview' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setLayoutMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  layoutMode === mode.id 
                    ? 'bg-brand-cyan text-bg-deep shadow-md font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all border border-slate-800"
              title="Reset Code"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              onClick={handleRun}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-cyan text-bg-deep font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)]"
            >
              {isRunning ? (
                <div className="w-3.5 h-3.5 border-2 border-bg-deep border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play size={13} fill="currentColor" />
              )}
              RUN
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {/* Editor Column */}
        <div className={`flex flex-col border-r border-slate-800/80 relative bg-[#070a13] ${
          layoutMode === 'editor' 
            ? 'lg:col-span-12' 
            : layoutMode === 'preview' 
              ? 'hidden' 
              : 'lg:col-span-6'
        }`}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-transparent p-6 font-mono text-xs md:text-sm text-cyan-100/90 outline-none resize-none leading-relaxed no-scrollbar"
            placeholder="Write your HTML, CSS, or JS code here..."
            spellCheck="false"
          />
          
          {/* Editor Status */}
          <div className="absolute bottom-4 left-6 flex items-center gap-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest pointer-events-none">
            <span>UTF-8</span>
            <span>Line {code.split('\n').length}</span>
          </div>
        </div>

        {/* Preview / Console Column */}
        <div className={`flex flex-col bg-[#02040a] ${
          layoutMode === 'preview' 
            ? 'lg:col-span-12' 
            : layoutMode === 'editor' 
              ? 'hidden' 
              : 'lg:col-span-6'
        }`}>
          {/* Output Control Tabs */}
          <div className="px-6 py-2 border-b border-slate-800 bg-[#090d16] flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePreviewTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  activePreviewTab === 'preview' 
                    ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye size={12} />
                Live Preview
              </button>
              <button
                onClick={() => setActivePreviewTab('console')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                  activePreviewTab === 'console' 
                    ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal size={12} />
                Console {consoleLogs.length > 0 && (
                  <span className="bg-brand-cyan text-bg-deep text-[7px] font-black px-1.5 py-0.25 rounded-full">{consoleLogs.length}</span>
                )}
              </button>
            </div>
            {activePreviewTab === 'console' && consoleLogs.length > 0 && (
              <button
                onClick={() => setConsoleLogs([])}
                className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title="Clear Logs"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
          
          {/* Content Pane */}
          <div className="flex-1 relative overflow-hidden bg-[#070913]">
            {activePreviewTab === 'preview' ? (
              output ? (
                <iframe
                  title="preview"
                  srcDoc={output}
                  className="w-full h-full border-none bg-white"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-900 flex items-center justify-center border border-dashed border-slate-800 animate-pulse">
                    <Play size={20} className="text-brand-cyan" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider">Press RUN to see live preview</p>
                </div>
              )
            ) : (
              /* Console Panel */
              <div className="w-full h-full overflow-y-auto p-5 font-mono text-[11px] leading-relaxed space-y-2 bg-[#020408]">
                {consoleLogs.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Terminal size={24} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Console is empty</p>
                  </div>
                ) : (
                  consoleLogs.map((log, index) => (
                    <div key={index} className={`flex items-start gap-2 border-b border-slate-900 pb-1.5 ${
                      log.level === 'error' 
                        ? 'text-red-400' 
                        : log.level === 'warn' 
                          ? 'text-amber-400' 
                          : 'text-cyan-300/80'
                    }`}>
                      <span className="text-slate-600 font-bold select-none text-[9px] mt-0.5">{log.time}</span>
                      <span className="font-bold select-none text-[9px]">
                        {log.level === 'error' ? '✖' : log.level === 'warn' ? '⚠' : 'ℹ'}
                      </span>
                      <pre className="whitespace-pre-wrap break-all flex-1 font-mono">{log.content}</pre>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
