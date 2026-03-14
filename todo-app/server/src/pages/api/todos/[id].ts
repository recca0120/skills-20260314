import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { todos } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  const body = await request.json();
  const [updated] = await db
    .update(todos)
    .set(body)
    .where(eq(todos.id, id))
    .returning();
  if (!updated) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  await db.delete(todos).where(eq(todos.id, id));
  return new Response(null, { status: 204 });
};
