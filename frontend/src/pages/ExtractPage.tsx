import { useState } from 'react'

type OutlineSection = { title: string; bullets?: string[]; children?: OutlineSection[] }
type Outline = { type_id: string; type_name: string; template_id?: string; sections: OutlineSection[] }

export default function ExtractPage() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [outline, setOutline] = useState<Outline | null>(null)
  const [templateId, setTemplateId] = useState('default')
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setFiles(e.target.files)

  const onSubmit = async () => {
    if (!files || files.length < 1) return alert('请至少上传1篇稿件')
    const form = new FormData()
    Array.from(files).forEach(f => form.append('files', f))
    form.append('template_id', templateId || 'default')
    setLoading(true)
    setOutline(null)
    try {
      const res = await fetch('/api/extract', { method: 'POST', body: form })
      if (!res.ok) throw new Error('提取失败')
      
      // 直接解析完整的JSON响应
      const outlineData: Outline = await res.json()
      setOutline(outlineData)
      localStorage.setItem('currentOutline', JSON.stringify(outlineData))

    } catch (e) { alert((e as Error).message) } finally { setLoading(false) }
  }

  return (
    <div className="grid gap-6">
      <div className="card p-6">
        <div className="text-lg font-semibold mb-2">上传新闻稿文件（任意数量，至少1篇）</div>
        <input className="input" type="file" multiple accept=".txt,.docx,.pdf" onChange={onChange} />
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <input className="input" value={templateId} onChange={e => setTemplateId(e.target.value)} placeholder="模板ID（默认default，可自定义）" />
          <div className="text-sm text-gray-600 flex items-center">将保存到该类型的此模板下</div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary" onClick={onSubmit} disabled={loading}>{loading ? '提取中…' : '开始提取大纲'}</button>
        </div>
      </div>
      {outline && (
        <div className="card p-6">
          <div className="font-bold text-brand-600">类型：{outline.type_name}</div>
          <div className="mt-4 grid gap-4">
            {outline.sections.map((s, i) => (
              <SectionView key={i} section={s} depth={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SectionView({ section, depth }: { section: OutlineSection; depth: number }) {
  return (
    <div className={`border rounded-md p-4 ${depth>0?'ml-6':''}`}>
      <div className="font-semibold">{section.title}</div>
      {!!(section.bullets||[]).length && (
        <ul className="list-disc ml-6 mt-2">
          {(section.bullets||[]).map((b, j) => (<li key={j}>{b}</li>))}
        </ul>
      )}
      {!!(section.children||[]).length && (
        <div className="mt-3 grid gap-3">
          {(section.children||[]).map((c, k) => (
            <SectionView key={k} section={c} depth={depth+1} />
          ))}
        </div>
      )}
    </div>
  )
}
