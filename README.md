# Dungeon Tracker

A browser-based combat and party tracker for the tabletop card game [**_Munchkin_**](http://www.sjgames.com/munchkin/) by Steve Jackson Games. Designed to run on a laptop or tablet at the gaming table as a shared screen alongside the physical cards — keeping track of player levels, gear bonuses, the active monster, and a running game log so the table doesn't have to.

> **Unofficial fan-made game aid.** Not affiliated with, endorsed by, or licensed by Steve Jackson Games. See [DISCLAIMER.md](./DISCLAIMER.md) for the full notice required by the [SJ Games Online Policy](http://www.sjgames.com/general/online_policy.html).

## Running it

The project is a static HTML page that loads React and Babel from a CDN — no build step, no install.

Because Babel Standalone fetches the `.jsx` files via XHR, you cannot open `index.html` directly from disk (`file://` is blocked by browsers). Serve it over HTTP:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Project layout

```
index.html         — entry; mounts the React app, declares default tweaks
dashboard.jsx      — main combat-tracker UI (themeable: comic | parchment | flat)
design-canvas.jsx  — multi-artboard "compare" view used during design iteration
tweaks-panel.jsx   — runtime controls for view/theme/density
DISCLAIMER.md      — required SJ Games Online Policy notice
```

## Status

This is a hobby project. It originated as a design prototype (HTML/CSS/JS) and has not yet been ported to a build-tooled stack. For production use, a compile step (Vite, esbuild, etc.) would remove the in-browser Babel cost.

## Legal

[**_Munchkin_**](http://www.sjgames.com/munchkin/) is a trademark of Steve Jackson Games, and its rules and art are copyrighted by Steve Jackson Games. All rights are reserved by Steve Jackson Games. This game aid is the original creation of **[YOUR NAME]** and is released for free distribution, and not for resale, under the permissions granted in the [Steve Jackson Games Online Policy](http://www.sjgames.com/general/online_policy.html).

For the long-form notice and the scope of what is and is not included, see [DISCLAIMER.md](./DISCLAIMER.md).
