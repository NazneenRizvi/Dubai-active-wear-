# ICON Activewear — corrected project

Start with **DEPLOYMENT.md** for exact stack, environment variables, Supabase schema, Firebase login, local startup and Render deployment instructions.

- `npm ci`
- Copy `.env.example` to `.env` and configure your own services.
- `npm run dev`
- `npm run lint && npm test && npm run build`

Admin: `/admin`. Use the real Firebase owner password. PIN and one-click bypasses were removed.

This is a React/Vite + Express application, not Next.js. The separate `backend/` FastAPI code is not connected to the current frontend. Read the remaining production limitations before accepting real customer orders.
