# Versioning Guide — wolfman.blog

## Version number format

```
[SITE STATE] . [RELEASE STATE] . [FEATURE STATE] . [MINOR UPDATE]
```

Each part is a plain integer, starting from 0.

| Part | What it tracks | When to bump |
|------|---------------|--------------|
| **Site state** | Development phase of the whole project | Never during normal development. Changes only if the project fundamentally shifts (e.g. hard relaunch). Currently `0`. |
| **Release state** | Which beta release milestone is active | When moving to the next named release milestone (Closed Alpha → Release 0.1, etc.) |
| **Feature state** | Features shipped within the current release | Every time a new feature or meaningful new behaviour is deployed to production |
| **Minor update** | Small fixes within a feature increment | Bug fixes, copy tweaks, style corrections, configuration changes that don't add new behaviour |

### Examples

| Version | Meaning |
|---------|---------|
| `0.1.0.0` | Closed Alpha, no features deployed yet — the baseline |
| `0.1.1.0` | First feature shipped in Closed Alpha |
| `0.1.1.1` | A bug fix on top of that feature |
| `0.1.1.2` | Another bug fix |
| `0.1.2.0` | Second feature shipped in Closed Alpha, minor fix counter resets |
| `0.2.0.0` | Moved to Release 0.1 — Journaling (release state bumps, others reset) |
| `0.2.1.0` | First feature in Release 0.1 |

### Reset rules

- When **release state** bumps, reset feature state and minor update to `0`.
- When **feature state** bumps, reset minor update to `0`.
- **Site state** does not reset anything below it — but this should virtually never change.

---

## Where the version is stored

**`package.json`** — the `appVersion` field is the source of truth:
```json
{
  "appVersion": "0.1.2.1"
}
```

The `version` field (standard npm semver, 3 parts) should mirror the first three parts:
```json
{
  "version": "0.1.2"
}
```

`next.config.ts` reads `appVersion` and injects it as `NEXT_PUBLIC_APP_VERSION` at build time. This powers the version badge in the upper nav bar.

---

## Process — every commit

1. **Decide which part to bump** using the table above.
2. **Update `appVersion` in `package.json`** — increment the right part, reset lower parts if needed.
3. **Update `version` in `package.json`** — mirror the first three parts (drop the fourth).
4. **Include the version in the commit message**, e.g.:
   ```
   feat: morning reminder email opt-in — v0.1.1.0
   ```

---

## Process — logging a version entry in the admin panel

After a deployment goes live, log it in the admin panel at `/admin`:

1. Open **Log version entry** (collapsible section).
2. Select the **active release** from the dropdown.
3. Enter the **version number** (e.g. `0.1.1.0`).
4. Write a **one-line summary** (what this version is, in plain English).
5. List **changes** — one bullet per line, no dashes needed. Be specific. What was added, fixed, or changed.
6. Paste **commit hashes** — short SHAs are fine, one per line or comma-separated. These are the commits that went into this version.
7. Set **deployed at** — the datetime the Vercel deployment completed.
8. Click **Log version**.

This entry will appear immediately on the public `/dev` page.

---

## Release state reference

| Release state digit | Release name |
|--------------------|-------------|
| `1` | Closed Alpha Development |
| `2` | Release 0.1 — Journaling |
| `3` | Release 0.2 — WOLF\|BOT |
| `4` | Release 0.3 — Communities |
| `5` | Release 0.4 — Rituals |
| `6` | Release 0.5 — Statistics |
| `7` | Release 0.6 — Achievements |
| `8` | Release 0.7 — Shop |
| `9` | Release 0.8 — Subscriptions |
| `10` | Release 0.9 — Legal |

---

## What NOT to log

- Don't log entries for infrastructure-only changes invisible to users (dependency updates, CI config).
- Don't log speculative or unreleased work — only deployed production versions.
- Don't log partial deploys — wait until a complete feature or fix is live.
