import { promises as fs } from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import type { Todo } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "todos.json");

function seed(): Todo[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuid(),
      title: "Welcome! Try adding your first todo 👋",
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
      notes: "Everything is saved to data/todos.json on the server.",
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

export async function readTodos(): Promise<Todo[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Todo[];
  } catch (err: any) {
    if (err?.code === "ENOENT") {
      const initial = seed();
      await writeTodos(initial);
      return initial;
    }
    throw err;
  }
}

export async function writeTodos(todos: Todo[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), "utf-8");
}
