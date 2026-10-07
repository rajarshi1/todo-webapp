import { v4 as uuid } from "uuid";
import type { Todo } from "./types";

// NOTE: serverless-safe store. File persistence doesn't survive on Vercel's
// read-only filesystem, so todos live in memory (per serverless instance).
// For durable multi-user storage, swap this for Vercel KV / Postgres later.
function seed(): Todo[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuid(),
      title: "Welcome! Try adding your first todo",
      completed: false,
      priority: "medium",
      category: "General",
      dueDate: null,
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      title: "Double-click (or hit Edit) to update a task",
      completed: false,
      priority: "low",
      category: "Tips",
      dueDate: null,
      notes: "Hosted build uses in-memory storage per instance.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      title: "Tick me off — filters update live",
      completed: true,
      priority: "high",
      category: "Tips",
      dueDate: null,
      notes: "",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;
if (!g.__todos) g.__todos = seed();

export async function readTodos(): Promise<Todo[]> {
  return [...(g.__todos as Todo[])];
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  g.__todos = [...todos];
}

