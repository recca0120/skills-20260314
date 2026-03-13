import { useEffect, useState } from 'react'
import { client } from './client'
import { AddTodo } from './components/AddTodo'
import { TodoList } from './components/TodoList'

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: Date | null
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = async () => {
    try {
      const res = await client.api.todos.$get()
      if (!res.ok) throw new Error('Failed to fetch todos')
      const data = await res.json()
      setTodos(data as Todo[])
      setError(null)
    } catch (err) {
      setError('Failed to load todos. Is the server running?')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const handleAdd = async (title: string) => {
    try {
      const res = await client.api.todos.$post({ json: { title } })
      if (!res.ok) throw new Error('Failed to add todo')
      const newTodo = await res.json()
      setTodos((prev) => [...prev, newTodo as Todo])
      setError(null)
    } catch (err) {
      setError('Failed to add todo.')
      console.error(err)
    }
  }

  const handleToggle = async (id: number, completed: boolean) => {
    try {
      const res = await client.api.todos[':id'].$patch({
        param: { id: String(id) },
        json: { completed },
      })
      if (!res.ok) throw new Error('Failed to update todo')
      const updated = await res.json()
      setTodos((prev) => prev.map((t) => (t.id === id ? (updated as Todo) : t)))
      setError(null)
    } catch (err) {
      setError('Failed to update todo.')
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await client.api.todos[':id'].$delete({
        param: { id: String(id) },
      })
      if (!res.ok) throw new Error('Failed to delete todo')
      setTodos((prev) => prev.filter((t) => t.id !== id))
      setError(null)
    } catch (err) {
      setError('Failed to delete todo.')
      console.error(err)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f7fafc',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: '36px',
              fontWeight: '700',
              color: '#2d3748',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Todo App
          </h1>
          <p style={{ color: '#718096', margin: 0, fontSize: '16px' }}>
            Stay organized and productive
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#c53030',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            backgroundColor: '#f7fafc',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <AddTodo onAdd={handleAdd} />
          <TodoList
            todos={todos}
            loading={loading}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  )
}

export default App
