import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

type Article = {
  id: string
  type_id: string
  type_name: string
  title: string
  created_at: number
  content: string
  materials: string
  template_id: string
}

export default function HistoryPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const selectedArticle = articles.find(a => a.id === selectedId)

  const loadArticles = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/articles')
      if (res.ok) {
        const data = await res.json()
        // Sort by created_at desc
        data.sort((a: Article, b: Article) => b.created_at - a.created_at)
        setArticles(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [])

  // Reset editing state when selection changes
  useEffect(() => {
    setEditing(false)
    setEditContent('')
  }, [selectedId])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return
    const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setArticles(articles.filter(a => a.id !== id))
      if (selectedId === id) setSelectedId(null)
    } else {
      alert('删除失败')
    }
  }

  const handleEdit = () => {
    if (selectedArticle) {
        setEditContent(selectedArticle.content)
        setEditing(true)
    }
  }

  const handleSave = async () => {
    if (!selectedArticle) return
    const newArticle = { ...selectedArticle, content: editContent }
    try {
        const res = await fetch(`/api/articles/${selectedArticle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newArticle)
        })
        if (res.ok) {
            setArticles(articles.map(a => a.id === selectedArticle.id ? newArticle : a))
            setEditing(false)
        } else {
            alert('保存失败')
        }
    } catch (e) {
        alert('保存失败: ' + (e as Error).message)
    }
  }

  const formatDate = (ts: number) => {
    return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false })
  }

  return (
    <div className="h-[calc(100vh-4rem)] grid grid-cols-[300px_1fr] gap-6">
      {/* Left List */}
      <div className="flex flex-col bg-white rounded shadow h-full overflow-hidden">
        <div className="p-4 border-b font-bold text-lg flex justify-between items-center">
          <span>历史记录</span>
          <button className="text-sm text-brand-600 hover:underline" onClick={loadArticles}>刷新</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading && <div className="text-center p-4 text-gray-500">加载中...</div>}
          {!loading && articles.length === 0 && (
            <div className="text-center p-4 text-gray-500">暂无记录</div>
          )}
          {articles.map(a => (
            <div
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={`p-3 rounded cursor-pointer border hover:border-brand-300 transition-colors ${
                selectedId === a.id ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-100'
              }`}
            >
              <div className="font-medium text-gray-900 truncate">{a.title || '未命名'}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-white bg-gray-400 px-1.5 py-0.5 rounded">{a.type_name}</span>
                <span className="text-xs text-gray-400">{formatDate(a.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Detail */}
      <div className="bg-white rounded shadow h-full overflow-hidden flex flex-col">
        {selectedArticle ? (
          <>
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <div className="font-bold text-lg">{selectedArticle.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  生成时间: {formatDate(selectedArticle.created_at)} | 类型: {selectedArticle.type_name}
                </div>
              </div>
              <div className="flex gap-2">
                <a 
                    href={`/api/articles/${selectedArticle.id}/download/docx`} 
                    target="_blank"
                    className="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200 flex items-center gap-1"
                >
                    Word
                </a>
                <a 
                    href={`/api/articles/${selectedArticle.id}/download/pdf`} 
                    target="_blank"
                    className="btn bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200 flex items-center gap-1"
                >
                    PDF
                </a>
                {!editing && (
                    <button 
                        onClick={handleEdit}
                        className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                    >
                        修改内容
                    </button>
                )}
                {editing && (
                    <>
                        <button 
                            onClick={handleSave}
                            className="btn bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                        >
                            保存
                        </button>
                        <button 
                            onClick={() => setEditing(false)}
                            className="btn bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
                        >
                            取消
                        </button>
                    </>
                )}
                <button 
                    onClick={() => handleDelete(selectedArticle.id)}
                    className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                >
                    删除
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {editing ? (
                  <textarea 
                    className="w-full h-full p-4 border rounded font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                  />
              ) : (
                  <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                    <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
                  </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            请选择左侧记录查看详情
          </div>
        )}
      </div>
    </div>
  )
}
