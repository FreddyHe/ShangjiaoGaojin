import { useState } from 'react'

export default function UploadPage() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [texts, setTexts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!files || files.length < 1) return alert('请至少选择1个文件')
    const form = new FormData()
    Array.from(files).forEach(f => form.append('files', f))
    setLoading(true)
    try {
      const res = await fetch('/api/files/parse', { method: 'POST', body: form })
      if (!res.ok) throw new Error('解析失败')
      const data = await res.json()
      setTexts(data.texts || [])
    } catch (e) { alert((e as Error).message) } finally { setLoading(false) }
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="text-lg font-semibold mb-2">上传并解析文件</div>
        <input className="input" type="file" multiple accept=".txt,.docx,.pdf" onChange={e => setFiles(e.target.files)} />
        <div className="mt-4">
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? '解析中…' : '开始解析'}</button>
        </div>
      </div>
      {!!texts.length && (
        <div className="card p-6 grid gap-4">
          {texts.map((t, i) => (
            <div key={i} className="border rounded-md p-4">
              <div className="font-semibold">文件 {i+1}</div>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{t.slice(0, 2000)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
