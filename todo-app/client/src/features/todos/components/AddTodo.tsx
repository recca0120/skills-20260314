import { useState } from 'react';

type Props = { onAdd: (title: string) => void };

export function AddTodo({ onAdd }: Props) {
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="新增 todo..."
        style={{ flex: 1, padding: '8px 12px', fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <button
        type="submit"
        disabled={!title.trim()}
        style={{ padding: '8px 16px', fontSize: 16, borderRadius: 4, cursor: 'pointer' }}
      >
        新增
      </button>
    </form>
  );
}
