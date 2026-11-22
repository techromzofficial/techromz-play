# Techromz Play V3 — Correction Task 01 Report

**Date:** 2026-11-21  
**Standalone baseline:** `techromz-play-standalone-v3.zip`  
**Authoritative Institute reference:** `techromzit-hostinger-deploy-v23.zip`  
**Scope:** Next.js security update and exact Institute header/footer verification only.

## Outcome

The correction is complete within the approved scope. The standalone application now uses Next.js `15.5.29` and matching `eslint-config-next` `15.5.29`, the lockfile is updated, all required validation passes, and two non-visual header behavior discrepancies were corrected. No gameplay, scoring, assets, analytics, or other application functionality was changed. The main Institute project was not modified.

## Files changed

1. `package.json`
   - `next`: `15.5.28` → `15.5.29` (production dependency)
   - `eslint-config-next`: `15.5.28` → `15.5.29` (development dependency)
2. `package-lock.json`
   - Refreshed only for the matching Next.js 15.5.29 packages, platform SWC packages, and ESLint configuration.
3. `src/components/layout/PlayHeader.tsx`
   - Removed the standalone-only `onBlur` menu-closing behavior absent from V23.
   - Added `aria-current="page"` to the desktop and mobile Techromz Play links. This changes accessibility semantics only; it adds no visual class or styling.
4. `CORRECTION_TASK_01_REPORT.md`
   - This report.

## Task A — Dependency security update

### Dependency trace

- Direct production dependency: `next@15.5.29`
- Matching lint package: `eslint-config-next@15.5.29`
- Next.js continues to bundle `postcss@8.4.31`.
- Root build tooling resolves `postcss@8.5.33`.
- Test-only chain remains `vitest@1.6.1` → `vite@5.4.21` / `vite-node@1.6.1` → `tinypool@0.8.4` and `esbuild@0.21.5`.

The update is a patch release within Next.js 15; no major framework upgrade was introduced.

### Original advisories remediated

The update from 15.5.28 to 15.5.29 removes the original audit's three direct Next.js advisories:

- GHSA-7qx7-33qx-rqx2 — image optimization SVG rejection bypass
- GHSA-f3mh-rxg3-f5g2 — Edge runtime internal response header cookie exposure
- GHSA-pc58-hwjq-p385 — self-hosted fetched-response injection/disclosure

### Remaining production advisories

`npm audit --omit=dev --json` reports **2 vulnerability records**:

- `next` — Moderate aggregate record, solely because it contains the vulnerable PostCSS copy.
- `postcss@8.4.31` under Next.js — High aggregate record covering GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, and GHSA-r28c-9q8g-f849.

npm offers `next@16.4.6` as the automated remediation, which is a major framework upgrade and therefore was not applied. The supplied application processes only trusted, repository-owned CSS during build and exposes no user-controlled CSS or source-map processing path, so practical runtime reachability is low; the advisory remains open until an approved compatible Next.js release updates its bundled PostCSS or a separately approved major upgrade is completed.

### Remaining development-only advisories

The full `npm audit --json` reports **7 vulnerability records** total: 3 moderate, 2 high, and 2 critical. In addition to the two production records above, the development/test chain reports:

- `vite` and `esbuild` development-server/path/launch-editor advisories.
- `vitest`, `vite-node`, and `tinypool` test-worker/UI advisories, including critical records.

npm's proposed fixes require major upgrades to Vite 8 and Vitest 5. They are not production runtime dependencies and no dev/test server is deployed by `next start`. They were not upgraded because this task prohibited unrelated major upgrades. Keep development servers bound to trusted local environments and schedule a separate test-toolchain upgrade.

### Package evidence

- Original `package.json` SHA-256: `6403dd66d3d90343d15f93b176fac99e3022f1cfd708846c3b881ec69160e7b3`
- Original `package-lock.json` SHA-256: `0d32451f30926167291153170d5b0e1488b481e932628678ea6f2703accc7818`
- Updated `package.json` SHA-256: `ae171bd01bd37e4d975445c2957adbb47c5f7dd2d75a5231ec586736c4a74637`
- Updated `package-lock.json` SHA-256: `87b825f79d34263100f1f7151f2b7513e9b5d0a1411e9f46d12c3109208f444a`

## Task B — Exact V23 Institute chrome comparison

### Header comparison

| Item | V23 authoritative reference | Standalone V3 result |
|---|---|---|
| Structure | Sticky header, logo, desktop nav, dropdowns, Play CTA, mobile toggle/nav | Same structure |
| Header classes | `sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur` | Identical visual classes; scoped typography class added only to reproduce V23 globals inside Play |
| Header sizing | `h-24`, `sm:h-28`, `max-w-7xl`, `px-4/sm:px-6/lg:px-8` | Identical |
| Desktop breakpoint | Visible at `xl`, hidden below `xl` | Identical |
| Mobile menu | `xl:hidden`, `max-h-[70vh]`, scrollable, same spacing/classes | Identical |
| Dropdown width/position | `absolute left-0 top-full w-64`, same border, padding, radius and shadow | Identical |
| Dropdown behavior | Click toggle, outside mousedown close, Escape close/focus return, route-change close | Identical after removing standalone-only blur close |
| Logo | `techromz-institute-logo-840.webp`, 840×480, displayed 170/210 px | Identical file bytes, dimensions, alt text and classes |
| Menus/labels | Explore Courses, Departments, Community Impact, For Organisations, About | Identical |
| Departments | Seven identical labels and order | Identical |
| Institute destinations | Relative `/institute/...` paths on main site | Same destinations expressed as absolute `https://techromzit.com/institute/...`, required because Play is a separate origin |
| Institute home | `/institute` | `https://techromzit.com/`; both resolve to the Institute's public site, but the landing path differs and should be founder-confirmed |
| Techromz Play destination | `/institute/play` | `/`, required for standalone origin |
| Active states | V23 evaluates relative Institute paths; Play CTA has no `aria-current` | Institute links correctly remain inactive while browsing standalone Play; Play CTA now has `aria-current="page"` with no visual change |
| Accessibility labels/focus rings | Present | Identical, plus correct current-page semantics for standalone Play |

### Footer comparison

| Item | Result |
|---|---|
| Layout/grid | Identical `sm:grid-cols-2` and `lg:grid-cols-12` structure and column spans |
| Spacing/colors/type utility classes | Identical |
| White logo | Byte-identical SHA-1 `fcd664f174f671d83733fb4be3262b0f8b8c0560`; identical 840×334 dimensions and 205 px display width |
| Slogan/description | Identical |
| Techromz Group companies/URLs | Identical |
| Explore TIT links | Identical labels/order/destinations; standalone uses the required absolute Institute origin |
| Organisation audience links/fragments | Identical labels/order/fragments; standalone uses the required absolute Institute origin |
| Social profiles | Identical: Facebook configured; Instagram, LinkedIn and YouTube intentionally hidden because their URLs are null |
| Contact data | Identical WhatsApp `+94 77 366 3604`, general email `info@techromzit.com`, enrolments email `enrolments@techromzit.com`, and prefilled contact message |
| Privacy link | Same `/institute/privacy` destination on the Institute origin |
| Copyright/year | Identical dynamic year behavior |

### Logo integrity

All three standalone Institute logo assets are byte-identical to V23:

- Light WebP SHA-1: `145084671a39bd183da4f90016867c6f7d80f336`
- White WebP SHA-1: `fcd664f174f671d83733fb4be3262b0f8b8c0560`
- PNG SHA-1: `64ad1639bf24ec4f927d84510e79d3b903190a86`

### CSS and typography

V23 obtains Manrope-first typography and global heading/paragraph line-height rules from its global stylesheet. Standalone Play uses different game-wide typography, so `InstituteChrome.module.css` scopes the V23 values to header/footer only. The relevant V23 values are reproduced: Manrope-first font stack, heading line-height `1.18`, heading letter spacing `-0.02em`, and paragraph/list line-height `1.6`. No visual class or breakpoint was changed in this correction.

### Differences intentionally retained

These are necessary consequences of independent deployment, not redesigns:

1. Institute links are absolute so they leave `play.techromzit.com` and reach `techromzit.com`.
2. Techromz Play links target standalone `/` rather than main-site `/institute/play`.
3. A scoped CSS module reproduces V23 global typography without changing game typography.
4. Component/config filenames differ because this is a standalone package.

No visual changes were made. The Institute home link difference (`https://techromzit.com/` versus V23 `/institute`) is documented for founder confirmation before any change.

## Verification results

| Command | Result |
|---|---|
| `npm ci` | Pass; clean lockfile install, 463 packages added |
| `npm audit --omit=dev --json` | Completed; 2 production records remain (Next/PostCSS) |
| `npm audit --json` | Completed; 7 total records remain (3 moderate, 2 high, 2 critical), including dev/test tooling |
| `npm run type-check` | Pass; no TypeScript errors |
| `npm test` | Pass; 8 files, 37/37 tests |
| `npm run lint` | Pass with the same two pre-existing AI Master hook dependency warnings; no new warning |
| `npm run build` | Pass on Next.js 15.5.29; all 11 routes generated; same two pre-existing warnings |

## Scope confirmation

- No gameplay or scoring file changed.
- No asset changed.
- No analytics file changed.
- No main Institute file changed.
- No deployment, commit, or push occurred.
- No visual change was made.

## Founder decisions requested

1. Approve the current Institute home logo/footer link destination (`https://techromzit.com/`) or authorize changing it to `https://techromzit.com/institute` to match V23's exact route.
2. Decide whether to approve a separately scoped Next.js 16 compatibility upgrade for the remaining bundled PostCSS advisories, or defer until a compatible patched release is available.
3. Decide whether to approve a separately scoped Vite/Vitest major upgrade for development-only advisories.

No other audit finding has been addressed in this correction.
