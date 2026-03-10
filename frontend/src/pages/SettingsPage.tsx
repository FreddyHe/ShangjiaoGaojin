import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'

type Settings = {
  system_name: string
  logo_url?: string
  copyright_text: string
  openai_api_key?: string
  openai_base_url?: string
  openai_model: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    system_name: '',
    copyright_text: '',
    openai_model: 'gpt-4o-mini'
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => {
        if (r.ok) return r.json()
        throw new Error('Failed to load settings')
      })
      .then(data => setSettings(prev => ({ ...prev, ...data })))
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('保存失败')
      const data = await res.json()
      setSettings(data)
      alert('保存成功，部分设置可能需要刷新页面生效')
      window.location.reload()
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">基础设置</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">系统名称</label>
              <input 
                className="input w-full" 
                value={settings.system_name || ''}
                onChange={e => setSettings({...settings, system_name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (可选)</label>
              <input 
                className="input w-full" 
                value={settings.logo_url || ''}
                onChange={e => setSettings({...settings, logo_url: e.target.value})}
                placeholder="http://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">版权信息</label>
              <input 
                className="input w-full" 
                value={settings.copyright_text || ''}
                onChange={e => setSettings({...settings, copyright_text: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">模型设置 (OpenAI Compatible)</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
              <input 
                type="password"
                className="input w-full" 
                value={settings.openai_api_key || ''}
                onChange={e => setSettings({...settings, openai_api_key: e.target.value})}
                placeholder="sk-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL (可选)</label>
              <input 
                className="input w-full" 
                value={settings.openai_base_url || ''}
                onChange={e => setSettings({...settings, openai_base_url: e.target.value})}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
              <input 
                className="input w-full" 
                value={settings.openai_model || ''}
                onChange={e => setSettings({...settings, openai_model: e.target.value})}
                placeholder="gpt-4o-mini"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
