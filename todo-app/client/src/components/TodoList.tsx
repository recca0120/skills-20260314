import { TodoItem } from './TodoItem'

interface Todo {
  id: number
  title: string
  completed: boolean
  createdAt: Date | null
}

interface TodoListProps {
  todos: Todo[]
  loading: boolean
  onToggle: (id: number, completed: boolean) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function TodoList({ todos, loading, onToggle, onDelete }: TodoListProps) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#a0aec0', fontSize: '16px' }}>
        Loading todos...
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
          color: '#a0aec0',
          fontSize: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        No todos yet. Add one above!
      </div>
    )
  }

  const remaining = todos.filter((t) => !t.completed).length

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          fontSize: '14px',
          color: '#718096',
        }}
      >
        <span>{todos.length} total</span>
        <span>{remaining} remaining</span>
      </div>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  )
}
