import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Settings, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  Palette, 
  Mail, 
  Database,
  Cloud,
  LayoutDashboard
} from 'lucide-react'
import { settingsService } from '../services/services'

export default function AdminSettings() {
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const { data: response, isLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: settingsService.getSettings
  })

  const saveMutation = useMutation({
    mutationFn: (data) => settingsService.updateSettings(data),
    onSuccess: () => {
      setSuccessMsg('Settings configuration updated successfully.')
      setTimeout(() => setSuccessMsg(''), 5000)
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to sync settings.')
      setTimeout(() => setErrorMsg(''), 5000)
    }
  })

  const settings = response?.data || {
    siteName: 'DevSchool Pro',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    supportEmail: 'support@devschool.com',
    aiTutorModel: 'gemini-3.5-flash',
    geminiApiKey: ''
  }

  // Toggles state local
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenanceMode)
  const [registrationEnabled, setRegistrationEnabled] = useState(settings.registrationEnabled)
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications)

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    saveMutation.mutate({
      ...settings,
      siteName: data.siteName,
      supportEmail: data.supportEmail,
      aiTutorModel: data.aiTutorModel,
      geminiApiKey: data.geminiApiKey,
      maintenanceMode,
      registrationEnabled,
      emailNotifications
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-lg"></div>
        <div className="cyber-panel p-6 rounded-2xl h-80"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="border-b border-cyan-500/10 pb-5">
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Settings className="text-[#00f0ff]" size={24} /> Configuration Control
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Alter platform meta configs, toggle maintenance lockdown, and review API registries</p>
      </header>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core settings & Branding */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main settings panel */}
          <div className="cyber-panel p-6 rounded-2xl relative">
            <div className="absolute top-0 left-6 h-1 w-20 bg-cyan-500"></div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <LayoutDashboard size={14} className="text-cyan-500" /> Platform Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Site Branding Name</label>
                <input 
                  type="text" 
                  name="siteName" 
                  defaultValue={settings.siteName} 
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">AI Tutor Model Select</label>
                <select 
                  name="aiTutorModel" 
                  defaultValue={settings.aiTutorModel} 
                  className="w-full px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-bold uppercase rounded-lg text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-3-flash">Gemini 3.0 Flash</option>
                  <option value="gemini-3.1-flash-live-preview">Gemini 3.1 Flash Live</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recommended)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Support Contact Email</label>
                <input 
                  type="email" 
                  name="supportEmail" 
                  defaultValue={settings.supportEmail} 
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Gemini API Key</label>
                <input 
                  type="text" 
                  name="geminiApiKey" 
                  defaultValue={settings.geminiApiKey || ''} 
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>
            </div>

            {/* Toggle options */}
            <div className="space-y-4 border-t border-cyan-500/10 pt-5 mt-5">
              
              {/* Maintenance Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">System Maintenance Mode</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">Locks down client interface to visitors during updates</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`flex items-center gap-1 text-xs font-black uppercase ${maintenanceMode ? 'text-rose-500' : 'text-slate-500'}`}
                >
                  {maintenanceMode ? <ToggleRight size={28} className="text-rose-500" /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {/* Registration Toggle */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">User Registrations</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">Toggles user creation capabilities on auth registry</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setRegistrationEnabled(!registrationEnabled)}
                  className={`flex items-center gap-1 text-xs font-black uppercase ${registrationEnabled ? 'text-cyan-500' : 'text-slate-500'}`}
                >
                  {registrationEnabled ? <ToggleRight size={28} className="text-[#00f0ff]" /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {/* Email Notifications Toggle */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">SMTP Notification Dispatches</h4>
                  <p className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">Toggles transactional automated SMTP emails</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`flex items-center gap-1 text-xs font-black uppercase ${emailNotifications ? 'text-cyan-500' : 'text-slate-500'}`}
                >
                  {emailNotifications ? <ToggleRight size={28} className="text-[#00f0ff]" /> : <ToggleLeft size={28} />}
                </button>
              </div>

            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={saveMutation.isPending}
              className="py-3 px-8 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Save Configuration Settings
            </button>
          </div>
        </div>

        {/* Right side: Integrations & usage indicators */}
        <div className="space-y-6">
          
          {/* Databases & Storage */}
          <div className="cyber-panel p-6 rounded-2xl relative">
            <div className="absolute top-0 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/20"></div>
            
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <Database size={16} className="text-[#00f0ff]" /> Integration Registries
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Supabase DB Status</span>
                <span className="text-[10px] font-bold text-slate-200 mt-1 block flex items-center gap-1.5 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
                  Connected (buuqxaialfecfwynnexp)
                </span>
              </div>

              <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Assets Storage Usage</span>
                <span className="text-[10px] font-bold text-slate-200 mt-1 block flex items-center gap-1.5 uppercase">
                  <Cloud size={12} className="text-cyan-400" />
                  Cloudinary status: ACTIVE (12.4 GB / 25 GB)
                </span>
                <div className="h-1 bg-[#111322] rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-cyan-400" style={{ width: '49.6%' }}></div>
                </div>
              </div>

              <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Mail Gateway</span>
                <span className="text-[10px] font-bold text-slate-200 mt-1 block flex items-center gap-1.5 uppercase">
                  <Mail size={12} className="text-cyan-400" />
                  SMTP Server: smtp.gmail.com (SSL)
                </span>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  )
}
