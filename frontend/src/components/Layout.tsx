import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FileText, PenTool, History, Settings, Sparkles } from 'lucide-react'
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
    <div className="h-screen bg-background-50 flex font-sans overflow-hidden relative">
      {/* Background Image overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.5] mix-blend-multiply bg-center bg-no-repeat bg-cover" style={{ backgroundImage: "url('/background.png')" }}></div>
      {/* Left Dark Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col shadow-xl z-20 flex-shrink-0 text-slate-300 relative">
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-center px-4 border-b border-slate-800">
          <img src="/SAIF_LOGO_White_W_500.png" alt="SAIF Logo" className="h-10 w-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto mt-2">
          {navs.map(n => {
            const active = location.pathname === n.path
            return (
              <Link 
                key={n.path} 
                to={n.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  active 
                  ? 'bg-brand-600 text-white font-medium shadow-md shadow-brand-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>}
                <n.icon size={20} className={`transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <span>{n.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Info Box */}
        <div className="p-5 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="text-slate-300 font-bold text-sm">PR</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">新闻稿智能体</span>
              <span className="text-xs text-slate-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="bg-white/80 backdrop-blur-md h-16 flex items-center px-8 border-b border-gray-200 justify-between gap-6 shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-brand-500 rounded-full mr-1"></div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              {navs.find(n => n.path === location.pathname)?.label || settings.system_name || '新闻稿智能体'}
            </span>
          </div>
          {/* User Menu Placeholder / Or if implemented */}
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative bg-transparent">
            <div className="max-w-6xl mx-auto min-h-[calc(100vh-12rem)]">
                {children}
            </div>
            
            <footer className="mt-12 py-6 border-t text-center text-sm text-gray-400">
                {settings.copyright_text}
            </footer>
        </main>
      </div>
    </div>
  )
}
