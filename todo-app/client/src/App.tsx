import { useEffect, useRef, useState } from 'react'
import type { Todo } from './types'

const api = {
  list: (): Promise<Todo[]> => fetch('/api/todos').then((r) => r.json()),
  create: (title: string): Promise<Todo> =>
    fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }).then((r) => r.json()),
  toggle: (id: number, completed: boolean): Promise<Todo> =>
    fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    }).then((r) => r.json()),
  remove: (id: number): Promise<void> =>
    fetch(`/api/todos/${id}`, { method: 'DELETE' }).then(() => {}),
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.list().then((data) => {
      setTodos(data)
      setLoading(false)
    })
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    const todo = await api.create(title)
    setTodos((prev) => [todo, ...prev])
    setInput('')
    inputRef.current?.focus()
  }

  const handleToggle = async (todo: Todo) => {
    const updated = await api.toggle(todo.id, !todo.completed)
    setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  const handleDelete = async (id: number) => {
    await api.remove(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const pending = todos.filter((t) => !t.completed).length
  const done = todos.filter((t) => t.completed).length

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Todo App</h1>

      <form onSubmit={handleAdd} style={styles.form}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="新增待辦事項..."
          style={styles.input}
        />
        <button type="submit" disabled={!input.trim()} style={styles.addBtn}>
          新增
        </button>
      </form>

      {todos.length > 0 && (
        <p style={styles.stats}>
          {pending} 待完成 · {done} 已完成
        </p>
      )}

      {loading ? (
        <p style={styles.empty}>載入中...</p>
      ) : todos.length === 0 ? (
        <p style={styles.empty}>還沒有待辦事項，新增一個吧！</p>
      ) : (
        <ul style={styles.list}>
          {todos.map((todo) => (
            <li key={todo.id} style={styles.item}>
              <label style={styles.label}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                  style={styles.checkbox}
                />
                <span
                  style={{
                    ...styles.text,
                    ...(todo.completed ? styles.textDone : {}),
                  }}
                >
                  {todo.title}
                </span>
              </label>
              <button
                onClick={() => handleDelete(todo.id)}
                style={styles.deleteBtn}
                aria-label="刪除"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#fff',
    borderRadius: 12,
    padding: '32px 28px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
    color: '#1a1a1a',
  },
  form: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: 15,
    border: '1.5px solid #e0e0e0',
    borderRadius: 8,
    outline: 'none',
  },
  addBtn: {
    padding: '10px 20px',
    fontSize: 15,
    fontWeight: 600,
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  stats: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    padding: '32px 0',
    fontSize: 15,
  },
  list: {
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 4px',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: 'pointer',
    accentColor: '#2563eb',
  },
  text: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  textDone: {
    textDecoration: 'line-through',
    color: '#aaa',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: 14,
    padding: '4px 8px',
    borderRadius: 4,
  },
}
