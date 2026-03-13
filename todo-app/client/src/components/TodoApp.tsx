import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { client } from '../lib/api'
import type { InferResponseType, InferRequestType } from 'hono/client'

// 從 Hono RPC 推導型別
type Todo = InferResponseType<typeof client.api.todos.$get>[number]
type CreateBody = InferRequestType<typeof client.api.todos.$post>['json']

const QUERY_KEY = [client.api.todos.$path()]

export function TodoApp() {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')

  // ── Queries ──────────────────────────────────────────
  const { data: todos = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await client.api.todos.$get()
      if (!res.ok) throw new Error('Failed to fetch todos')
      return res.json()
    },
  })

  // ── Mutations ─────────────────────────────────────────
  const createMutation = useMutation<Todo, Error, CreateBody>({
    mutationFn: async (body) => {
      const res = await client.api.todos.$post({ json: body })
      if (!res.ok) throw new Error('Failed to create todo')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const doneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await client.api.todos[':id'].done.$patch({ param: { id: String(id) } })
      if (!res.ok) throw new Error('Failed to update todo')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await client.api.todos[':id'].$delete({ param: { id: String(id) } })
      if (!res.ok) throw new Error('Failed to delete todo')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  // ── Handlers ──────────────────────────────────────────
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    createMutation.mutate({ title })
    setInput('')
  }

  // ── Render ────────────────────────────────────────────
  return (
    <div>
      {/* 新增表單 */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="新增 todo..."
          disabled={createMutation.isPending}
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            fontSize: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.5rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !input.trim()}
          style={{
            padding: '0.625rem 1.25rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            opacity: createMutation.isPending || !input.trim() ? 0.5 : 1,
          }}
        >
          {createMutation.isPending ? '新增中...' : '新增'}
        </button>
      </form>

      {/* Todo 列表 */}
      {isLoading ? (
        <p style={{ color: '#6b7280', textAlign: 'center' }}>載入中...</p>
      ) : todos.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center' }}>尚無 todo，新增一個吧！</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onDone={() => doneMutation.mutate(todo.id)}
              onDelete={() => deleteMutation.mutate(todo.id)}
              isDoneLoading={doneMutation.isPending}
              isDeleteLoading={deleteMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

// ── TodoItem ──────────────────────────────────────────────
function TodoItem({
  todo,
  onDone,
  onDelete,
  isDoneLoading,
  isDeleteLoading,
}: {
  todo: Todo
  onDone: () => void
  onDelete: () => void
  isDoneLoading: boolean
  isDeleteLoading: boolean
}) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: '#fff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* 完成按鈕 */}
      <button
        onClick={onDone}
        disabled={todo.done || isDoneLoading}
        title={todo.done ? '已完成' : '標記完成'}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${todo.done ? '#22c55e' : '#d1d5db'}`,
          background: todo.done ? '#22c55e' : 'transparent',
          cursor: todo.done ? 'default' : 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '0.75rem',
        }}
      >
        {todo.done ? '✓' : ''}
      </button>

      {/* 標題 */}
      <span
        style={{
          flex: 1,
          fontSize: '1rem',
          color: todo.done ? '#9ca3af' : '#111827',
          textDecoration: todo.done ? 'line-through' : 'none',
        }}
      >
        {todo.title}
      </span>

      {/* 刪除按鈕 */}
      <button
        onClick={onDelete}
        disabled={isDeleteLoading}
        title="刪除"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af',
          fontSize: '1.125rem',
          lineHeight: 1,
          padding: '0 0.25rem',
        }}
      >
        ✕
      </button>
    </li>
  )
}
