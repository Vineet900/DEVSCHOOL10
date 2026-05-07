import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sparkles, Save, ShieldAlert, Bot, Settings2, Loader2 } from 'lucide-react'
import { aiService } from '../services/services'

export default function AdminAiSettings() {
  const queryClient = useQueryClient()
  const [localSettings, setLocalSettings] = useState(null)

  const { data: response, isLoading } = useQuery({
    queryKey: ['aiSettings'],
    queryFn: aiService.getSettings
  })

  useEffect(() => {
    if (response?.data) {
      setLocalSettings(response.data)
    }
  }, [response])

  const mutation = useMutation({
    mutationFn: (newSettings) => aiService.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiSettings'] })
      alert('Settings saved successfully!')
    },
    onError: (error) => {
      alert('Failed to save settings: ' + error.message)
    }
  })

  const handleSave = () => {
    mutation.mutate(localSettings)
  }

  if (isLoading || !localSettings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure AI tutor limits, models, and toggle features.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center dark:bg-blue-500/10 dark:text-blue-400">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Tutor Configuration</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage how the AI behaves for learners.</p>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Toggle AI */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable AI Features</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Turn off all AI functionality globally.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={localSettings.aiEnabled} onChange={(e) => setLocalSettings({...localSettings, aiEnabled: e.target.checked})} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Model Selection */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Language Model</h4>
            <select 
              value={localSettings.modelSelect}
              onChange={(e) => setLocalSettings({...localSettings, modelSelect: e.target.value})}
              className="w-full md:max-w-md bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:placeholder-slate-400 dark:text-white transition-all"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
              <option value="gpt-4o">GPT-4o (Smart & Expensive)</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
            </select>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Daily Message Limit per User</h4>
              <input 
                type="number" 
                value={localSettings.dailyLimit}
                onChange={(e) => setLocalSettings({...localSettings, dailyLimit: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" 
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Max Tokens per Response</h4>
              <input 
                type="number" 
                value={localSettings.maxTokens}
                onChange={(e) => setLocalSettings({...localSettings, maxTokens: parseInt(e.target.value)})}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" 
              />
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Strict Mode */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Socratic Teaching Mode</h4>
                <ShieldAlert size={16} className="text-amber-500" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Force AI to give hints instead of direct answers.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={localSettings.strictMode} onChange={(e) => setLocalSettings({...localSettings, strictMode: e.target.checked})} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 dark:border-slate-800 dark:bg-slate-800/50">
          <button 
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

