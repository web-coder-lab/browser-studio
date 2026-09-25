# Browser Studio

Editor + preview. Accounts and project files live in Firebase through the Node server.

## Run locally

npm install --legacy-peer-deps
npm run build
npm start

Health: GET /api/health

## Account flow

1. Register: Gmail, 6-digit code, display name, username, password
2. Log in again to confirm
3. Forgot password uses the same email code path

## Honest limits

No custom domain attach, no remote Linux, no live team editing, no one-click deploy from the editor.

Full guide: /help.html
