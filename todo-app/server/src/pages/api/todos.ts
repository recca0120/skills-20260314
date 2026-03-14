import type { APIRoute } from 'astro';
import { db } from '../../db';
import { todos } from '../../db/schema';
import { desc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async () => {
  const all = await db.select().from(todos).orderBy(desc(todos.createdAt));
  return new Response(JSON.stringify(all), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  if (!body.title?.trim()) {
    return new Response(JSON.stringify({ error: 'title is required' }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const [todo] = await db.insert(todos).values({ title: body.title.trim() }).returning();
  return new Response(JSON.stringify(todo), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
