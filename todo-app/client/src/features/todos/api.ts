export type Todo = {
  id: number;
  title: string;
  done: boolean;
  createdAt: string | null;
};

export const todoApi = {
  getAll: async (): Promise<Todo[]> => {
    const res = await fetch('/api/todos');
    return res.json();
  },

  create: async (title: string): Promise<Todo> => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    return res.json();
  },

  toggle: async (id: number, done: boolean): Promise<Todo> => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done }),
    });
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  },
};
