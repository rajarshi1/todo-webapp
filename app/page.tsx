import TodoApp from "@/components/TodoApp";
import { readTodos } from "@/lib/store";

export const dynamic = "force-dynamic";

// Server-Side Rendered: initial todos are fetched on the Node server per request.
export default async function Home() {
  const initialTodos = await readTodos();
  const sorted = [...initialTodos].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );
  return <TodoApp initialTodos={sorted} />;
}
