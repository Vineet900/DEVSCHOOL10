import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Save, Image as ImageIcon, Globe, Shield, Bell, Loader2 } from 'lucide-react'
import { settingsService } from '../services/services'

export default function AdminSettings() {
  const queryClient = useQueryClient()
  const [localSettings, setLocalSettings] = useState(null)
  const [activeTab, setActiveTab] = useState('General')

  const { data: response, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsService.getSettings
  })

  useEffect(() => {
    if (response?.data) {
      setLocalSettings(response.data)
    }
  }, [response])

  const mutation = useMutation({
    mutationFn: (newSettings) => settingsService.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] })
      alert('Settings updated successfully!')
    },
    onError: (error) => {
      alert('Failed to update settings: ' + error.message)
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
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">App Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Configure global application settings and branding.</p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          {['General', 'Branding', 'Security', 'Notifications'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'General' && <Settings size={16} />}
                {tab === 'Branding' && <ImageIcon size={16} />}
                {tab === 'Security' && <Shield size={16} />}
                {tab === 'Notifications' && <Bell size={16} />}
                {tab}
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-8">
          {activeTab === 'General' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Site Name</label>
                  <input 
                    type="text" 
                    value={localSettings.siteName}
                    onChange={(e) => setLocalSettings({...localSettings, siteName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Support Email</label>
                  <input 
                    type="email" 
                    value={localSettings.supportEmail}
                    onChange={(e) => setLocalSettings({...localSettings, supportEmail: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" 
                  />
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Controls</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Maintenance Mode</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Disables access to the platform for all non-admin users.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={localSettings.maintenanceMode} onChange={(e) => setLocalSettings({...localSettings, maintenanceMode: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Enable New Registrations</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Allow new users to sign up for accounts.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={localSettings.registrationEnabled} onChange={(e) => setLocalSettings({...localSettings, registrationEnabled: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </>
          )}

          {activeTab !== 'General' && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <p>{activeTab} settings coming soon...</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 dark:border-slate-800 dark:bg-slate-800/50">
          <button 
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
          >
            Discard Changes
          </button>
          <button 
            onClick={handleSave}
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

