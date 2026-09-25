# Browser Studio — How to use (detailed)

## Start
1. Register your own email + username + password (min 6).
2. There are NO demo logins. Old seeded users were removed.
3. After login the IDE opens. Logout returns to the gate.

## Editor
- Left: files. Center: code. Right/bottom: preview and tools.
- Edit HTML/CSS/JS and use preview.
- Python/C++/SQL panels may still be browser-side demos. If a run fails, that engine is not a full Linux server.

## Real on this machine
- `node server.js` — register/login/session
- `GET /api/health`
- `POST /api/register` `POST /api/login` `GET /api/me`
- `GET/POST /api/workspace` — your files JSON on **this server disk** (`data/`)

## Not real / removed / refused
- GitHub repo as database (unsafe, not used)
- Chat GitHub/Render tokens (not used, do not paste)
- One-click Render/Vercel success animation (disabled)
- Fake SSL “valid” on any domain (now false until a real host issues certs)
- Host shell / nmap / cloudflared tunnels
- Gemini AI app writer

## Domain
DNS lookup can query public DoH. That only says “this name has A/CNAME records”.
It does not attach your project to that domain on the internet.

## 404
Unknown `/api/...` returns JSON 404.
Unknown site paths serve `index.html` if the Vite app is built, else a 404 HTML page from `server.js`.

## Deploy yourself
Build frontend (`npm run build`) then run `node server.js`.
On Render: start command `node server.js`, do not put tokens in the repo.
