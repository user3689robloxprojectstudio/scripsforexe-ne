# ScriptsForExe.net

ScriptsForExe.net is a dark-mode Lua and plain-text hosting platform with Discord authentication, file management, and raw file hosting inspired by GitHub's raw URLs.

## Features

- Discord OAuth2 login
- Lua and TXT file upload, editing, visibility control, and deletion
- Public script discovery and search
- Direct raw script hosting via /raw/:id
- SQLite-ready Prisma setup with PostgreSQL-compatible schema migration path
- Responsive design for desktop and mobile

## Project structure

- public/ — static pages and frontend assets
- server/ — Express API and auth flow
- prisma/ — Prisma schema and migrations
- storage/ — persistent local storage

## Quick start

1. Copy `.env.example` to `.env` and fill in the values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push the database schema:
   ```bash
   npx prisma db push
   ```
4. Start the app:
   ```bash
   npm run dev
   ```
5. Visit http://localhost:3000

## Discord setup

1. Create a new Discord application at https://discord.com/developers/applications.
2. Add a Redirect under OAuth2 > General:
   - `https://scriptsforexe.net/auth/discord/callback`
3. Copy the client ID and secret into `.env`.
4. Set the same callback URL in your deployment environment.

## PostgreSQL deployment

The app is configured for Prisma with SQLite for local development. For production, update `DATABASE_URL` in `.env` to your PostgreSQL connection string, for example:

```env
DATABASE_URL="postgresql://user:password@host:5432/scriptsforexe"
```

Then run:

```bash
npx prisma db push
```

## Deployment

### Render / Railway / VPS

1. Set the environment variables from `.env.example`.
2. Ensure `BASE_URL` matches your public domain.
3. Keep `SESSION_SECRET` long and random.
4. Run the app using `npm start`.
5. Point your domain to the deployed app.

## Raw URLs

Public scripts are served from:

```text
https://scriptsforexe.net/raw/:storageKey
```

Private scripts require authentication and ownership verification.

## Security

- OAuth state validation is enforced.
- Sessions use HTTP-only cookies.
- Uploaded Lua and TXT files are treated as untrusted text and never executed server-side.
- File uploads are validated and limited in size.
- Private scripts are never shown in public APIs.

## License

MIT
