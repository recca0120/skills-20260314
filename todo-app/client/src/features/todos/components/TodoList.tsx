import type { Todo } from '../api';
import { TodoItem } from './TodoItem';

type Props = {
  todos: Todo[];
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
};

export function TodoList({ todos, onToggle, onDelete }: Props) {
  if (todos.length === 0) {
    return <p style={{ color: '#999', textAlign: 'center', marginTop: 32 }}>沒有 todo，新增一個吧！</p>;
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
