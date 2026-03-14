import { useState, useEffect } from 'react';
import { todoApi, type Todo } from './features/todos/api';
import { AddTodo } from './features/todos/components/AddTodo';
import { TodoList } from './features/todos/components/TodoList';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    todoApi.getAll().then((data) => {
      setTodos(data);
      setLoading(false);
    });
  }, []);

  async function handleAdd(title: string) {
    const todo = await todoApi.create(title);
    setTodos((prev) => [todo, ...prev]);
  }

  async function handleToggle(id: number, done: boolean) {
    const updated = await todoApi.toggle(id, done);
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id: number) {
    await todoApi.delete(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>Todo App</h1>
      <AddTodo onAdd={handleAdd} />
      {loading ? (
        <p style={{ textAlign: 'center', color: '#999' }}>載入中...</p>
      ) : (
        <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
      )}
    </div>
  );
}
