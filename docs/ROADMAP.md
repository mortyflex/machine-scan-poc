## Agent Runtime Migration — Claude Code

Status: DONE

Reason:

- Project workflow moved from OpenCode to Claude Code.
- OpenCode-specific config removed.
- Claude Code project memory added via `CLAUDE.md`.
- Claude Code skills added under `.claude/skills`.

Current accepted baseline before next product phase:

```txt
58edced 🎨 feat(scan): add skia cutout validation renderer
```

Next recommended phase:

```txt
Phase 6.6 — Generate real cutoutUri
```

Goal:

- Build the real cutout pipeline.
- Mobile app requests a backend cutout.
- Backend returns a transparent PNG/WebP cutout.
- Skia validation screen renders the cutout.
- Fallback remains honest if cutout is unavailable.
