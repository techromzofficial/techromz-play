# Techromz Play V3 — Final Pre-Deployment Audit

Audit date: 22 November 2026  
Target: `https://play.techromzit.com`  
Package runtime: Node.js 22 (supported by `engines.node: >=20.0.0 <25`)  
Audited source: local `techromz-play-standalone-v3` directory; this directory is not a standalone tracked Git checkout, so no commit identity is available.

## Release decision

The application passes installation, TypeScript, automated tests, lint execution, production build, route, header, metadata, course-link and package-integrity checks. The ZIP is technically buildable on Hostinger with Node.js 22.

Release approval is **not automatic** because the production dependency audit remains non-zero. `next@15.5.29` bundles `postcss@8.4.31`, which is affected by four PostCSS advisories. The application does not accept or transform user-controlled CSS, so the known exploit prerequisites are not exposed by normal game traffic; however, the vulnerable package is still shipped and must be treated as residual risk. No later Next.js 15 release is currently published. npm proposes Next.js 16.4.6, a major upgrade requiring separate approval and regression testing.

## Verification summary

| Check | Result |
|---|---|
| `npm ci` | Passed; 463 packages installed from lockfile |
| `npm run type-check` | Passed |
| `npm test` | Passed: 42/42 tests, 9/9 files |
| `npm run lint` | Completed with 0 errors and 2 existing warnings |
| `npm run build` | Passed on Next.js 15.5.29; 11 static/dynamic pages generated |
| `npm audit --omit=dev` | Non-zero: 2 dependency entries (1 moderate, 1 high), representing 4 PostCSS advisories |
| Local production smoke test | All canonical routes and health endpoint returned 200; legacy routes returned 307 to their canonical destinations |
| Public course destinations | All four returned HTTP 200 on 22 November 2026 |

`npm ci` also displayed 7 advisories when development dependencies were included: 3 moderate, 2 high and 2 critical. The required production-only audit reduces this to the two entries described below.

## Playable-experience verification

The corrected source and automated coverage were reviewed for:

1. AI Master Level 1 — timed/practice state, score/result flow, replay, achievements, sharing, course CTA and Level 2 progression persistence.
2. AI Knowledge Lab Level 2 — timed/practice state, 80-point mastery rule, repair completion, result sharing and course CTA. The 70-point Level 1 unlock rule remains unchanged.
3. Retail Rush — timed/practice engine, customer progression, scoring, results, replay, sharing and course CTA.
4. App Builder Level 1 — four-stage engine, 90-second/practice modes, scoring, results, replay, sharing and course CTA.

The 42 automated tests passed without gameplay or progression regression. Latest source corrections are present: production share URLs, shared score-card generation, result sharing actions, score-tier celebrations, reduced-motion handling, App Builder layout/navigation, and AI progression persistence.

## Branding, results and sharing

- The approved shared Institute header, navigation and footer remain sourced from the existing layout components.
- All four score-card call sites use the original `/images/institute/techromz-institute-logo-white-840.webp` asset once through the shared score-card generator.
- Previously generated score-card samples were visually checked for logo/text separation. Screenshots and test artifacts are deliberately excluded from the deployment ZIP.
- Perfect-score UI is gated by completed-game state and score; lower tiers retain their existing presentation.
- Facebook and WhatsApp builders use `https://play.techromzit.com` through `NEXT_PUBLIC_APP_URL`; automated tests assert that generated production sharing URLs do not contain `localhost`.
- Copy-link success is reported only after a successful clipboard operation. Opening a social share interface is not represented as a published post.
- AI Master preserves `ai-master-og-v2.jpg`; Retail Rush preserves `retail-rush-og-v1.png`; App Builder preserves `app-builder-og.png`.

Open Graph smoke-test results:

| Route | Canonical OG URL | Image |
|---|---|---|
| `/` | `https://play.techromzit.com` | `/images/institute/play/ai-master-og-v2.jpg` |
| `/ai-master` | `https://play.techromzit.com/ai-master` | `/images/institute/play/ai-master-og-v2.jpg` |
| `/ai-master?level=2` | `https://play.techromzit.com/ai-master?level=2` | `/images/institute/play/ai-master-og-v2.jpg` |
| `/retail-rush` | `https://play.techromzit.com/retail-rush` | `/images/institute/play/retail-rush-og-v1.png` |
| `/app-builder` | `https://play.techromzit.com/app-builder` | `/images/play/app-builder/app-builder-og.png` |

Public course checks (HTTP 200):

- AI Master Level 1: `https://techromzit.com/institute/courses/build-your-first-ai-assistant`
- AI Knowledge Lab Level 2: `https://techromzit.com/institute/courses/build-an-ai-knowledge-assistant`
- Retail Rush: `https://techromzit.com/institute/courses/retail-kickstart`
- App Builder: `https://techromzit.com/institute/courses/mobile-kickstart`

## Existing lint warnings

These are unchanged and outside the verification-only task:

1. `src/features/games/ai-master/AiMasterGame.tsx:153` — `useEffect` missing dependency `s.verified`.
2. `src/features/games/ai-master/KnowledgeLab.tsx:105` — `useEffect` missing dependencies `progress` and `state.repairConfirmed`.

They do not fail the build, but should be reviewed in a separately approved code-change task.

## Production dependency advisories

Lockfile: `package-lock.json`  
Lockfile SHA-256 at audit time: `87b825f79d34263100f1f7151f2b7513e9b5d0a1411e9f46d12c3109208f444a`

Resolved chain:

```text
techromz-play-standalone@1.0.0
└─ next@15.5.29
   └─ postcss@8.4.31
```

The separately declared PostCSS/build-tool copy resolves to `postcss@8.5.33` and is outside the reported affected ranges. The remaining nested copy is affected by:

| Advisory | Severity | Affected | Patched PostCSS |
|---|---:|---|---:|
| GHSA-qx2v-qp2m-jg93 / CVE-2026-41305 | Moderate | `<8.5.10` | 8.5.10 |
| GHSA-6g55-p6wh-862q / CVE-2026-45623 | High | `<=8.5.11` | 8.5.12 |
| GHSA-r28c-9q8g-f849 / CVE-2026-73646 | High | `<=8.5.17` | 8.5.18 |
| GHSA-fxqj-rqcc-2cmp / CVE-2026-69153 | Moderate | `<=8.5.22` | 8.5.23 |

Exposure assessment: the file-read advisories require attacker-controlled CSS containing a `sourceMappingURL` to be processed by PostCSS. The XSS advisory requires hostile CSS to be parsed/stringified and embedded. This application has no CSS upload, user theme, CSS transformation API or other runtime path that passes player input to PostCSS. In this codebase PostCSS is used during trusted application builds. That materially lowers practical exposure but does not remove the vulnerable transitive dependency or make the audit clean.

Available remediation: npm reports Next.js 16.4.6 as the automatic fix, marked SemVer-major. Registry inspection found 15.5.29 to be the newest published Next.js 15 release. Do not use `npm audit fix --force`. Recheck for a Next.js 15 backport; otherwise schedule and fully regress a separately approved Next.js 16 upgrade. Founder/release-owner approval is required to accept the residual risk for this deployment.

Advisory sources:

- https://github.com/advisories/GHSA-qx2v-qp2m-jg93
- https://github.com/advisories/GHSA-6g55-p6wh-862q
- https://github.com/advisories/GHSA-r28c-9q8g-f849
- https://github.com/advisories/GHSA-fxqj-rqcc-2cmp

## Environment checklist

Set these in Hostinger's application environment before building:

| Variable | Required value | Meaning in source |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://play.techromzit.com` | Canonical application origin used by metadata, health output and all public sharing links. |
| `NEXT_PUBLIC_INSTITUTE_URL` | `https://techromzit.com` | Institute origin used by course and Institute navigation links. |
| `NEXT_PUBLIC_PLAY_ANALYTICS_ENABLED` | `false` | Keeps Google Tag Manager/Analytics loading and event transport disabled pending consent approval. |
| `PLAY_ALLOW_INDEXING` | `false` | Emits `noindex, nofollow` during initial verification. Change to `true` only after founder approval and production verification. |

Optional/conditional:

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — analytics property ID; not used while analytics is disabled.
- `NEXT_DIST_DIR` — overrides `.next`; leave unset for standard Hostinger deployment.
- `PORT` — normally assigned by Hostinger; `next start` respects the platform port.

`NEXT_PUBLIC_*` values are compiled into browser bundles, so set them before `npm run build`. Do not upload a local `.env`; enter values in Hostinger's environment settings.

## Routes checklist

| Route | Purpose | Verification |
|---|---|---|
| `/` | Approved three-game homepage | 200 |
| `/ai-master` | AI Master overview, Level 1 and results | 200 |
| `/ai-master?level=2` | AI Knowledge Lab Level 2 | 200 |
| `/retail-rush` | Retail Rush overview/game/results | 200 |
| `/app-builder` | App Builder overview | 200 |
| `/app-builder/level-1` | App Builder Level 1 game/results | 200 |
| `/api/health` | Health JSON | 200; `status: ok` |
| `/institute/play` | Legacy entry | 307 → `/` |
| `/institute/play/ai-master` | Legacy AI entry | 307 → `/ai-master` |
| `/institute/play/retail-rush` | Legacy Retail entry | 307 → `/retail-rush` |

The production smoke test confirmed CSP, Permissions Policy, HSTS, `nosniff`, frame denial and strict-origin referrer policy. Images receive a 30-day cache policy with stale-while-revalidate.

## Hostinger deployment instructions

1. Create/select an independent Node.js application for `play.techromzit.com`; do not place these files into or overwrite the main Institute application.
2. Select Node.js 22 and upload/extract `techromz-play-hostinger-final.zip` into the application root.
3. Configure the four required environment variables exactly as listed above before building.
4. Run `npm ci`.
5. Run `npm run build`.
6. Configure the start command as `npm start`. Hostinger should provide `PORT`; do not hard-code a public port.
7. Start/restart only this application.
8. Confirm `/api/health` returns 200 and `baseUrl` is `https://play.techromzit.com`.
9. Smoke-test the canonical routes, score-card preview/download, Facebook/WhatsApp link generation and course CTAs on the public origin.
10. Validate HTTPS, headers, Open Graph previews with the social platforms' public debuggers, and mobile layouts. Keep `PLAY_ALLOW_INDEXING=false` until founder approval.
11. After approval, change only `PLAY_ALLOW_INDEXING=true`, rebuild and recheck metadata if public indexing is desired.

## Remaining release risks

1. **Unresolved production advisory:** Next.js embeds vulnerable PostCSS 8.4.31. Practical exposure is reduced by the absence of untrusted CSS processing, but risk acceptance must be explicit.
2. **Live-platform validation:** Facebook/WhatsApp crawler previews and native mobile share sheets can only be fully verified against the deployed public HTTPS origin/device.
3. **Existing lint warnings:** two AI Master hook dependency warnings remain documented above.
4. **Indexing:** intentional `noindex, nofollow` remains active for initial verification.

No source or hosting changes were made to the main Techromz Institute website. No deployment, commit, push, DNS change or automatic dependency upgrade was performed.
