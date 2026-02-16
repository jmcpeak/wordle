# Wordle Clone

This is a Wordle clone built with Next.js, TypeScript, and Material UI (MUI).

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Database (production / deploy)

The app uses Neon Postgres. Schema is not applied on every request. After deploying, run the ensure-schema route once so tables and seed data exist:

1.  Set `DB_INIT_SECRET` in your environment (e.g. a long random string).
2.  Call the route (from CI or manually):
    ```bash
    curl "https://your-app.com/api/db/ensure-schema?secret=YOUR_DB_INIT_SECRET"
    ```
    Or use `Authorization: Bearer YOUR_DB_INIT_SECRET` or a POST body `{"secret":"YOUR_DB_INIT_SECRET"}`.

## Features

*   Wordle game logic (5-letter words, 6 guesses).
*   Color-coded feedback (Green: Correct, Yellow: Present, Grey: Absent).
*   Keyboard support.
*   Material UI components for a polished look.
*   Next.js App Router structure.
