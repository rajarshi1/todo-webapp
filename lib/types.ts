export type Priority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: string;
  dueDate: string | null; // ISO date yyyy-mm-dd
  notes: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type TodoFilter = "all" | "active" | "completed";
export type TodoSort = "newest" | "oldest" | "dueDate" | "priority" | "alpha";

export interface TodoStats {
  total: number;
  active: number;
  completed: number;
  percent: number;
}
