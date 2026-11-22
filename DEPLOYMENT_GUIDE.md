# Hostinger & Cloud Deployment Guide — Techromz Play Standalone

This guide explains how to deploy `techromz-play-standalone` to Hostinger Node.js Web Hosting or any Node.js VPS/cloud server.

---

## Option 1: Hostinger Node.js Application Deployment (Recommended)

Hostinger Cloud & Web Hosting packages support Node.js applications with automated process management (PM2/Passenger).

### Step 1: Create a Node.js Application in hPanel
1. Log in to your **Hostinger hPanel**.
2. Go to **Websites** → select your domain/subdomain (e.g. `play.yourdomain.com` or `games.yourdomain.com`).
3. Open **Node.js** under Advanced / Web Development.
4. Click **Create Application**:
   - **Node.js version**: Choose `20.x` or `22.x`.
   - **Application root**: `public_html` or a dedicated folder like `techromz-play`.
   - **Application startup file**: `server.js` or leave default for Next.js.
   - **Application mode**: `Production`.

### Step 2: Upload the Deployment Archive
1. In hPanel, open **File Manager**.
2. Navigate to your application root directory.
3. Upload `techromz-play-standalone-v3.zip`.
4. Extract the ZIP contents directly into the application root.
5. Confirm that `package.json`, `next.config.mjs`, `public/`, and `src/` are located at the root of the application directory.

### Step 3: Configure Environment Variables
In hPanel Node.js settings or by creating a `.env.production` file in your application root:

```ini
NEXT_PUBLIC_APP_URL=https://play.yourdomain.com
NEXT_PUBLIC_INSTITUTE_URL=https://techromzit.com
NEXT_PUBLIC_PLAY_ANALYTICS_ENABLED=false
PLAY_ALLOW_INDEXING=true
NODE_ENV=production
```

### Step 4: Install Dependencies & Build
You can run these via Hostinger's **SSH Access** or via the **Node.js Console** in hPanel:

```bash
# 1. Navigate to application folder
cd /home/u123456789/domains/play.yourdomain.com/public_html

# 2. Install dependencies
npm ci --production=false

# 3. Build the Next.js production bundle
npm run build

# 4. Start the application
npm run start
```

### Step 5: Verify Deployment
1. Visit `https://play.yourdomain.com/` — check the landing page.
2. Visit `https://play.yourdomain.com/ai-master` — play Level 1 and verify Level 2 unlocks at 70 pts.
3. Visit `https://play.yourdomain.com/retail-rush` — test the 60-second store challenge with 3D diorama.
4. Visit `https://play.yourdomain.com/api/health` — confirm response:
   ```json
   {
     "status": "ok",
     "service": "techromz-play-standalone",
     "version": "1.0.0"
   }
   ```

---

## Option 2: VPS / Ubuntu / Debian Deployment (PM2 + Nginx)

If hosting on a Hostinger VPS or AWS/DigitalOcean droplet:

### 1. Install Node.js 22 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Extract Archive
```bash
mkdir -p /var/www/techromz-play
unzip techromz-play-standalone-v3.zip -d /var/www/techromz-play
cd /var/www/techromz-play
```

### 3. Install & Build
```bash
npm ci
npm run build
```

### 4. Run with PM2
```bash
sudo npm install -g pm2
pm2 start npm --name "techromz-play" -- start -- -p 3000
pm2 save
pm2 startup
```

### 5. Configure Nginx Reverse Proxy
```nginx
server {
    server_name play.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```
Obtain SSL using Certbot:
```bash
sudo certbot --nginx -d play.yourdomain.com
```

---

## Health Probes & Monitoring
- **Health check endpoint**: `GET /api/health`
- Uptime monitors (UptimeRobot, Better Uptime) should ping `/api/health` every 1-5 minutes.
- Returns HTTP 200 with JSON payload and no cache headers.

---

## Troubleshooting

1. **Images not loading?**
   - Ensure the `public/` directory was uploaded in full. All image assets are located under `public/images/institute/play/` and `public/images/play/`.
2. **WebGL 3D diorama fallback?**
   - If WebGL is blocked or hardware acceleration is disabled in the client browser, Retail Rush automatically falls back to an accessible SVG + 2D product layout without disrupting gameplay.
3. **Port conflicts?**
   - Hostinger Node.js sets the `PORT` environment variable automatically. Next.js `npm start` honors `process.env.PORT`.
