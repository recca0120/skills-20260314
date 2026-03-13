import { TodoApp } from './components/TodoApp'

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          📝 Todo App
        </h1>
        <TodoApp />
      </div>
    </div>
  )
}
