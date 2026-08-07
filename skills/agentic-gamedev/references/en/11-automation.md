## 11. Continuous Automation — Background Execution Loops

Elevate testing tools into **continuous background automation workflows** (CI/Cron), creating self-maintaining verification loops.

| Automated Loop | Frequency | Core Functionality |
|----------------|-----------|--------------------|
| **Deployment Smoke Gate** | On `git push` | Runs headless browser audits; fails deployments on console runtime errors. |
| **Nightly Balance Gate** | Daily at midnight | Runs bot simulations; opens automated GitHub issues if medians drift from baselines. |
| **Daily Ghost Runs** ★ | Daily at midnight | Executes seeded bot runs and commits recorded ghost telemetry as game content. |
| **Morning Trend Scout** | Every morning | Researches game jam trends and open-source repos, filtering top ideas via 3-Gate rules. |
| **Automated Doc Metrics** | Periodic | Parses git commit history to update performance metrics and documentation stats. |

### 11.1 Promoting Test Artifacts to Gameplay Content

Commit daily bot simulation logs (`public/ghost/<date>.json`) as static JSON files. Web clients can fetch these files as daily leaderboard ghosts without requiring dedicated backend servers or databases.

### 11.2 5 Rules for Cron Automation

1. **Idempotence:** Exit instantly if today's record already exists.
2. **Explicit Timezones:** Align Cron UTC execution with game local time (e.g., KST).
3. **Silent Failures:** Never commit corrupted or incomplete bot telemetry; rely on fallback simulation models instead.
4. **Separate Exit Codes:** Distinguish runtime crashes (exit code 1) from valid baseline shifts (exit code 2).
