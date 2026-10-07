import { NextResponse } from "next/server";
import { readTodos, writeTodos } from "@/lib/store";

// PATCH /api/todos/:id { title?, completed?, priority?, category?, dueDate?, notes? }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const todos = await readTodos();
  const idx = todos.findIndex((t) => t.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = todos[idx];
  const next = {
    ...current,
    ...(body.title !== undefined ? { title: String(body.title).slice(0, 200) } : {}),
    ...(body.completed !== undefined ? { completed: Boolean(body.completed) } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.category !== undefined ? { category: String(body.category).slice(0, 40) } : {}),
    ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? String(body.dueDate) : null } : {}),
    ...(body.notes !== undefined ? { notes: String(body.notes).slice(0, 2000) } : {}),
    updatedAt: new Date().toISOString(),
  };
  if (!next.title.trim()) {
    return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
  }
  todos[idx] = next;
  await writeTodos(todos);
  return NextResponse.json(next);
}

// DELETE /api/todos/:id
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const todos = await readTodos();
  const remaining = todos.filter((t) => t.id !== params.id);
  if (remaining.length === todos.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await writeTodos(remaining);
  return NextResponse.json({ ok: true });
}

// PUT /api/todos/:id/toggle — flip completed (convenience)
export async function PUT(_req: Request, { params }: { params: { id: string } }) {
  const todos = await readTodos();
  const idx = todos.findIndex((t) => t.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  todos[idx] = {
    ...todos[idx],
    completed: !todos[idx].completed,
    updatedAt: new Date().toISOString(),
  };
  await writeTodos(todos);
  return NextResponse.json(todos[idx]);
}
