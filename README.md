# Techromz Play Standalone

Independent educational gaming and simulation platform extracted from Techromz Institute of Technology.

Techromz Play is a self-contained, domain-independent Next.js application that runs standalone on its own domain and hosting environment (e.g. Hostinger Node.js, VPS, Docker, or cloud hosts).

---

## 🎮 Included Games & Missions

### 1. Mission 001: AI Master
- **Level 1 — AI Kickstart (30-second challenge & practice mode)**:
  - Role selection (Study coach, Sales assistant, Coding assistant)
  - Instruction core configuration (2 rules)
  - Simulated student question & answer generation
  - Verification & safety review step
  - Scoring (0-100 pts) with achievement badges:
    - *AI Master* (100)
    - *Prompt Pioneer* (70-99)
    - *AI Explorer* (40-69)
    - *AI Rookie / Quick Thinker* (<40)
  - **Level 2 Unlock Gate**: Players must earn **>= 70/100** to unlock Level 2.
- **Level 2 — AI Knowledge Lab (4-stage learning simulation)**:
  - *Stage 1: Source Hunt* (Gather and connect authoritative vs outdated/unverified knowledge, 30 pts)
  - *Stage 2: Core Configuration* (Install safety and uncertainty modules, 20 pts)
  - *Stage 3: Evidence Challenge* (Formulate grounded customer answers with citations, 30 pts)
  - *Stage 4: Repair Lab* (Inspect and repair unsupported AI hallucinations, 20 pts)
  - *Mastery Threshold*: Score **>= 80/100** to earn *AI Knowledge Lab Mastery*.
- **Level 3 — AI Launchpad**:
  - Gated/Coming Soon state.
- **Persistence**: Local device persistence preserving unlocked levels, personal bests, and achievements.

### 2. Mission 002: Retail Rush
- **60-Second Challenge & Untimed Practice Mode**:
  - Manage a fictional retail store shift with 6 sequential customers.
  - 3 products: Pure Water, Farm Fresh Milk, Crunch Snacks.
  - Real-time inventory replenishment:
    - *Standard Delivery* (4s lead time, base cost)
    - *Express Delivery* (1s lead time, base cost + LKR 30 fee)
  - Checkout POS pricing strategy (Standard margin vs Promotional offer deal).
  - Customer budget and patience timers.
  - Realistic financial accounting: Cash, Revenue, Costs, and Net Profit.
  - **Full 3D WebGL Supermarket Experience**:
    - Three.js orthographic supermarket diorama with lighting, instanced tile floors, product displays, animated customers, and delivery bay.
    - Accessible SVG & CSS fallback for devices without WebGL.
  - **Personalized Results & Social Sharing**:
    - Animated score dial, victory confetti celebrations, achievement ranks (from *Store Starter* to *Retail Legend*).
    - Player name session validation (supports international character sets).
    - Shareable challenge links.

---

## 🚀 Quick Start

### Runtime Requirements
- **Node.js**: `>= 20.0.0` (Tested on Node 22.x / 24.x)
- **npm**: `>= 10.x`

### Installation
```bash
npm ci
# or
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Testing
```bash
npm run type-check
npm run test
```

### Production Build & Start
```bash
npm run build
npm run start
```

---

## ⚙️ Environment Variables

Create a `.env.production` file using `.env.example` as a template:

```env
# Public URL of this deployment
NEXT_PUBLIC_APP_URL=https://play.yourdomain.com

# Optional: Parent Institute URL (for course links and institute navigation)
NEXT_PUBLIC_INSTITUTE_URL=https://techromzit.com

# Optional: Google Analytics (disabled by default)
NEXT_PUBLIC_PLAY_ANALYTICS_ENABLED=false
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TPH2VY63MB

# Allow search engine indexing (true in production)
PLAY_ALLOW_INDEXING=true

# Port (Hostinger sets this automatically)
PORT=3000
```

---

## 📁 Project Architecture

```
techromz-play-standalone/
├── public/
│   └── images/
│       ├── institute/play/   # WebP/PNG 3D models and sprites
│       └── play/             # Mirrored asset paths
├── src/
│   ├── app/
│   │   ├── page.tsx          # Root Lobby "/"
│   │   ├── ai-master/        # "/ai-master"
│   │   ├── retail-rush/      # "/retail-rush"
│   │   ├── api/health/       # "/api/health" Health check
│   │   └── institute/play/   # Backward-compatibility routes
│   ├── components/layout/    # Branded PlayHeader & PlayFooter
│   ├── config/site.ts        # Dynamic domain resolver & metadata
│   ├── features/
│   │   ├── analytics/        # Safe GA4 tracking
│   │   └── games/
│   │       ├── ai-master/    # Complete AI Master logic & components
│   │       └── retail-rush/  # Complete Retail Rush Three.js & engine
│   └── tests/                # Automated Vitest test suite
└── DEPLOYMENT_GUIDE.md       # Step-by-step Hostinger & Cloud guide
```

---

## 🛡️ License & Attributions
All educational simulations, game design, 3D renderers, and interactive curriculum are proprietary to Techromz Institute of Technology.
