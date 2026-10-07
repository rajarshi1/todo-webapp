import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { readTodos, writeTodos } from "@/lib/store";
import type { Priority, Todo } from "@/lib/types";

const VALID_PRIORITIES: Priority[] = ["low", "medium", "high"];

// GET /api/todos?q=&filter=&category= — server-rendered initial data also uses readTodos()
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase();
  const filter = searchParams.get("filter") ?? "all";
  const category = searchParams.get("category") ?? "all";

  let todos = await readTodos();

  if (filter === "active") todos = todos.filter((t) => !t.completed);
  if (filter === "completed") todos = todos.filter((t) => t.completed);
  if (category !== "all") todos = todos.filter((t) => t.category === category);
  if (q) {
    todos = todos.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  // newest first by default
  todos = [...todos].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return NextResponse.json(todos);
}

// POST /api/todos { title, priority?, category?, dueDate?, notes? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const priority: Priority = VALID_PRIORITIES.includes(body.priority) ? body.priority : "medium";
  const now = new Date().toISOString();
  const todo: Todo = {
    id: uuid(),
    title: title.slice(0, 200),
    completed: false,
    priority,
    category: String(body.category ?? "General").slice(0, 40) || "General",
    dueDate: body.dueDate ? String(body.dueDate) : null,
    notes: String(body.notes ?? "").slice(0, 2000),
    createdAt: now,
    updatedAt: now,
  };
  const todos = await readTodos();
  todos.unshift(todo);
  await writeTodos(todos);
  return NextResponse.json(todo, { status: 201 });
}

// DELETE /api/todos?clear=completed — bulk clear completed
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("clear") === "completed") {
    const todos = await readTodos();
    const remaining = todos.filter((t) => !t.completed);
    await writeTodos(remaining);
    return NextResponse.json({ cleared: todos.length - remaining.length });
  }
  return NextResponse.json({ error: "Use ?clear=completed" }, { status: 400 });
}
