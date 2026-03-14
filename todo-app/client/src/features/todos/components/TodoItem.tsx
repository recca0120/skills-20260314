import type { Todo } from '../api';

type Props = {
  todo: Todo;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
};

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #eee',
      }}
    >
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id, !todo.done)}
        style={{ width: 18, height: 18, cursor: 'pointer' }}
      />
      <span
        style={{
          flex: 1,
          fontSize: 16,
          textDecoration: todo.done ? 'line-through' : 'none',
          color: todo.done ? '#999' : 'inherit',
        }}
      >
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#e53e3e',
          cursor: 'pointer',
          fontSize: 14,
          padding: '4px 8px',
        }}
      >
        刪除
      </button>
    </li>
  );
}
