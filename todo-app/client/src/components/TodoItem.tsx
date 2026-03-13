import { useState } from 'react'

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: Date | null
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: number, completed: boolean) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle(todo.id, !todo.completed)
    } finally {
      setToggling(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(todo.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '8px',
        opacity: deleting ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
        disabled={toggling || deleting}
        style={{
          width: '18px',
          height: '18px',
          cursor: toggling || deleting ? 'not-allowed' : 'pointer',
          accentColor: '#667eea',
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: '16px',
          color: todo.completed ? '#a0aec0' : '#2d3748',
          textDecoration: todo.completed ? 'line-through' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {todo.title}
      </span>
      <button
        onClick={handleDelete}
        disabled={deleting || toggling}
        style={{
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: '500',
          backgroundColor: deleting ? '#fed7d7' : '#fff5f5',
          color: deleting ? '#c53030' : '#e53e3e',
          border: '1px solid #fed7d7',
          borderRadius: '6px',
          cursor: deleting || toggling ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!deleting && !toggling) {
            e.currentTarget.style.backgroundColor = '#fed7d7'
          }
        }}
        onMouseLeave={(e) => {
          if (!deleting && !toggling) {
            e.currentTarget.style.backgroundColor = '#fff5f5'
          }
        }}
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  )
}
