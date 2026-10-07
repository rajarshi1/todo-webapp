# Todo Webapp — React + Node.js (SSR via Next.js)

A full-featured Todo app running on **http://todo-webapp-19q6m82gm-madmax-09.vercel.app**.

- Server-side rendered homepage (`app/page.tsx`)
- Node REST API (`app/api/todos/...`)
- React interactive UI (`components/TodoApp.tsx`)
- File persistence in `data/todos.json`

## Run locally

```bash
npm install
npm run dev      # dev mode with hot reload
# or
npm run build && npm start -- -p 3000   # production
```

## API

- `GET /api/todos?q=&filter=&category=` — list/search
- `POST /api/todos` — create `{ title, priority?, category?, dueDate?, notes? }`
- `PATCH /api/todos/:id` — update fields
- `PUT /api/todos/:id` — toggle completed
- `DELETE /api/todos/:id` — delete one
- `DELETE /api/todos?clear=completed` — clear completed
