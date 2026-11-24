# Strike: Arena

Browser FPS inspired by Counter-Strike. Bot matches plus **online 1v1 invite links**.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:5000`. The playable game lives in `public/` (same folder Netlify publishes).

## Online 1v1

1. **Invite 1v1 (link)** on the main menu  
2. Copy the invite URL and send it to a friend  
3. When they join, hit **Start match** (host)  
4. First to 5 round wins  

Uses peer-to-peer (PeerJS) — no game server required. Both players need the site URL (Netlify or localhost).

## Deploy (Netlify)

Connect the repo to Netlify with:

- **Publish directory:** `public`
- **Build command:** none (already set in `netlify.toml`)

Invite links work automatically on the deployed URL.

## Defaults

| Action | Key |
|--------|-----|
| Move | WASD |
| Walk | Shift |
| Duck | Ctrl |
| Jump | Space |
| Fire | LMB |
| Reload | R |
| Buy menu | B |
| Pause / Controls | Esc |
| Weapons | 1 / 2 / scroll wheel |

Kills award weapon-based cash. Round wins pay `$3250`; losses pay a rising bonus (`$1400`–`$3400`).
