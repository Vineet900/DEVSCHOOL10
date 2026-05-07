import { useEffect, useState } from 'react'
import AppLogo from './AppLogo'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setVisible(false)
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-30 rounded-2xl bg-blue-600 p-4 text-white shadow-lg md:left-auto md:right-8 md:w-80">
      <div className="flex items-center gap-2">
        <AppLogo size={20} className="bg-white/10 p-0.5" />
        <p className="text-sm font-semibold">Install DevSchool Pro for faster daily learning.</p>
      </div>
      <button onClick={install} className="interactive-chip mt-3 w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-600">
        Install App
      </button>
    </div>
  )
}
