import { useState } from 'react'

interface AddTodoProps {
  onAdd: (title: string) => Promise<void>
}

export function AddTodo({ onAdd }: AddTodoProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      await onAdd(trimmed)
      setTitle('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        disabled={loading}
        style={{
          flex: 1,
          padding: '10px 14px',
          fontSize: '16px',
          border: '2px solid #e2e8f0',
          borderRadius: '8px',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#667eea')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
      />
      <button
        type="submit"
        disabled={loading || !title.trim()}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: loading || !title.trim() ? '#a0aec0' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}
