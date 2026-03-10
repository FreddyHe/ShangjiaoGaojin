import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, PenTool, History, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

type SettingsType = {
  system_name: string
  logo_url?: string
  copyright_text: string
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [settings, setSettings] = useState<SettingsType>({
    system_name: '新闻稿智能体',
    copyright_text: '© 2024 Press Release Assistant'
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => {
        if (r.ok) return r.json()
        throw new Error('Failed to load settings')
      })
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .catch(console.error)
  }, [])

  const navs = [
    { path: '/templates', label: '模板管理', icon: LayoutDashboard },
    { path: '/extract', label: '大纲提取', icon: FileText },
    { path: '/generate', label: '稿件生成', icon: PenTool },
    { path: '/history', label: '历史记录', icon: History },
    { path: '/settings', label: '系统设置', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b h-16 flex items-center px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="h-8 w-8 object-contain" />
          ) : (
            <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              {(settings.system_name || 'A')[0]}
            </div>
          )}
          <span className="font-bold text-xl text-gray-900 tracking-tight">{settings.system_name || '新闻稿智能体'}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col overflow-y-auto">
            <nav className="p-4 space-y-1">
                {navs.map(n => {
                    const active = location.pathname === n.path
                    return (
                        <Link 
                            key={n.path} 
                            to={n.path} 
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                                active 
                                ? 'bg-brand-50 text-brand-700 font-medium shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <n.icon size={18} className={`transition-colors ${active ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                            <span>{n.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
            <div className="max-w-6xl mx-auto min-h-[calc(100vh-12rem)]">
                {children}
            </div>
            
            {/* Footer */}
            <footer className="mt-12 py-6 border-t text-center text-sm text-gray-400">
                {settings.copyright_text}
            </footer>
        </main>
      </div>
    </div>
  )
}
