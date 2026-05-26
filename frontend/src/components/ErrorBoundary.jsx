import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
          <div className="glass-card max-w-md w-full p-10 rounded-[3rem] border-white/10 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">System Error</h2>
              <p className="text-white/40 text-sm">A critical error occurred in the roadmap rendering engine.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              <RefreshCw size={18} /> Reboot System
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
