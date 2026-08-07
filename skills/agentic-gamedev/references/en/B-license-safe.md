## Appendix B. License-Safe Rules

Strict policies preventing open-source license violations when importing external assets.

### B.1 Core Import Policy

- **Default Rule:** Procedurally generate assets in code by default.
- **Import Exemption Rule:** If external assets are imported, enforce a strict "No import without ledger registration (`assets.json`)" rule.

### B.2 Asset Class Import Policies

| Asset Class | Policy | Rationale & Requirements |
|-------------|--------|--------------------------|
| **Fonts** | OFL / CC0 only | Document in `CREDITS.md` + mandatory system font fallback. |
| **Graphics** | Allowed under unified art style | Prevent visual clutter caused by mismatched asset styles. |
| **Audio** | Synthesize BGM; single-shot SFX imports allowed | Single-shot SFX benefit from audio samples; BGM requires dynamic code variation. |

### B.3 The 4 Rules of Asset Ledgers

1. **Machine-Readable Ledger (`assets.json`):** Track source URLs, authors, and licenses, auto-generating `CREDITS.md`.
2. **Preserve Original Binaries:** Perform pitch/volume/color modifications in code to retain raw file checksums.
3. **Automated Verification (`npm run assets`):** Run CLI scripts verifying asset fingerprints against ledger entries.
4. **Guaranteed Fallback Grace:** Ensure code falls back gracefully to system fonts and synthesized audio if assets throw 404s.
