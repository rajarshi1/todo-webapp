"use client";

import { useMemo, useState } from "react";
import type { Priority, Todo, TodoFilter, TodoSort } from "@/lib/types";

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_STYLES: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function isOverdue(t: Todo): boolean {
  if (!t.dueDate || t.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(t.dueDate + "T00:00:00") < today;
}

const inputCls =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function TodoApp({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const [sort, setSort] = useState<TodoSort>("newest");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  const [editCategory, setEditCategory] = useState("General");
  const [editDueDate, setEditDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const s = new Set(todos.map((t) => t.category).filter(Boolean));
    return ["all", ...Array.from(s).sort()];
  }, [todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    return { total, active: total - completed, completed,
      percent: total ? Math.round((completed / total) * 100) : 0 };
  }, [todos]);

  const visible = useMemo(() => {
    let list = [...todos];
    if (filter === "active") list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) => t.completed);
    if (categoryFilter !== "all") list = list.filter((t) => t.category === categoryFilter);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((t) =>
      t.title.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q));
    if (sort === "oldest") list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sort === "alpha") list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "priority") list.sort((a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === "dueDate") list.sort((a, b) =>
      (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1);
    else list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list;
  }, [todos, filter, sort, query, categoryFilter]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true); setError(null);
    try {
      const created = await api<Todo>("/api/todos", { method: "POST",
        body: JSON.stringify({ title: trimmed, priority,
          category: category.trim() || "General", dueDate: dueDate || null }) });
      setTodos((prev) => [created, ...prev]);
      setTitle(""); setDueDate("");
    } catch (err: any) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function toggleTodo(id: string) {
    setError(null);
    const prev = todos;
    setTodos((l) => l.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
    try {
      const updated = await api<Todo>(`/api/todos/${id}`, { method: "PUT" });
      setTodos((l) => l.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) { setTodos(prev); setError(err.message); }
  }

  async function deleteTodo(id: string) {
    setError(null);
    const prev = todos;
    setTodos((l) => l.filter((t) => t.id !== id));
    try { await api(`/api/todos/${id}`, { method: "DELETE" }); }
    catch (err: any) { setTodos(prev); setError(err.message); }
  }

  async function clearCompleted() {
    if (!stats.completed || busy) return;
    setBusy(true); setError(null);
    const prev = todos;
    setTodos((l) => l.filter((t) => !t.completed));
    try { await api("/api/todos?clear=completed", { method: "DELETE" }); }
    catch (err: any) { setTodos(prev); setError(err.message); }
    finally { setBusy(false); }
  }

  function startEdit(t: Todo) {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditNotes(t.notes);
    setEditPriority(t.priority);
    setEditCategory(t.category);
    setEditDueDate(t.dueDate ?? "");
  }

  async function saveEdit(id: string) {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await api<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: trimmed,
          notes: editNotes,
          priority: editPriority,
          category: editCategory.trim() || "General",
          dueDate: editDueDate || null,
        }),
      });
      setTodos((l) => l.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Todo</h1>
        <p className="mt-1 text-sm text-slate-500">React + Node.js with server-side rendering (Next.js)</p>
      </header>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">{stats.completed} of {stats.total} done</span>
          <span className="text-slate-500">{stats.percent}%</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${stats.percent}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">Total: {stats.total}</span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">Active: {stats.active}</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Done: {stats.completed}</span>
        </div>
      </div>

      <form onSubmit={addTodo} className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing? Press Enter" className={`${inputCls} flex-1`} maxLength={200} autoFocus />
          <button type="submit" disabled={busy || !title.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">Add</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputCls} title="Priority">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={inputCls} maxLength={40} />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} title="Due date" />
        </div>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className={`${inputCls} min-w-[140px] flex-1`} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={inputCls} title="Category filter">
          {categories.map((c) => (<option key={c} value={c}>{c === "all" ? "All categories" : c}</option>))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as TodoSort)} className={inputCls} title="Sort">
          <option value="newest">Newest</option><option value="oldest">Oldest</option>
          <option value="dueDate">Due date</option><option value="priority">Priority</option>
          <option value="alpha">A-Z</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {(["all", "active", "completed"] as TodoFilter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"}`}>{f}</button>
        ))}
        <button onClick={clearCompleted} disabled={!stats.completed || busy}
          className="ml-auto rounded-full border border-red-200 bg-white px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">
          Clear completed ({stats.completed})</button>
      </div>

      {error && (<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>)}

    setEditingId(t.id); setEditTitle(t.title); setEditNotes(t.notes);
    setEditPriority(t.priority); setEditCategory(t.category);
    setEditDueDate(t.dueDate ?? "");
      <ul className="space-y-2">
        {visible.map((t) => (
          <li key={t.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {editingId === t.id ? (
              <div className="space-y-2">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={`${inputCls} w-full`} maxLength={200} />
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className={`${inputCls} w-full`} maxLength={2000} />
                <div className="flex flex-wrap gap-2">
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Priority)} className={inputCls}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                  <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className={inputCls} maxLength={40} />
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className={inputCls} />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(t.id)} disabled={busy}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40">Save</button>
                  <button onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <button onClick={() => toggleTodo(t.id)} title={t.completed ? "Mark active" : "Mark done"}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    t.completed ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 hover:border-emerald-500"}`}>
                  {t.completed && <span className="text-xs font-bold">✓</span>}
                </button>
                <div className="min-w-0 flex-1" onDoubleClick={() => startEdit(t)}>
                  <p className={`break-words text-[15px] font-medium ${t.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>{t.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-medium capitalize ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{t.category}</span>
                    {t.dueDate && (
                      <span className={`rounded-full px-2 py-0.5 ${isOverdue(t) ? "bg-red-100 text-red-700 font-semibold" : "bg-slate-100 text-slate-600"}`}>
                        {t.dueDate}{isOverdue(t) ? " · overdue" : ""}</span>)}
                  </div>
                  {t.notes && <p className="mt-1 break-words text-sm text-slate-500">{t.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => startEdit(t)} className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Edit">Edit</button>
                  <button onClick={() => deleteTodo(t.id)} className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600" title="Delete">Del</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p className="mt-2 font-medium">Nothing here!</p>
          <p className="text-sm">{query || filter !== "all" || categoryFilter !== "all" ? "Try a different search or filter." : "Add your first task above to get started."}</p>
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-slate-400">
        Double-click a task to edit · SSR via Next.js (React + Node) · REST API at /api/todos
      </footer>
    </div>
  );
}
