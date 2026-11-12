# ProCollege Production Deployment Guide

ProCollege is a React 19 + TypeScript + Vite single-page web application featuring Microsoft Teams-inspired collaboration and a Microsoft 365-style Product Suite portal.

The application produces an optimized static build in the `dist` directory.

---

## 1. Quick Verification (Local Production Preview)

Build the bundle and run the local production preview server:
```bash
npm run build
npm run preview
```
Visit `http://localhost:4173` to test the production bundle.

---

## 2. Deploy to Vercel (Recommended)

1. **Option A: GitHub Integration (Zero Config)**
   - Push your code to a GitHub repository.
   - Import the repository in [vercel.com](https://vercel.com).
   - Set **Framework Preset** to `Vite`.
   - Root directory: `./procollege-app` (or repository root if deployed standalone).
   - Click **Deploy**.
   - `vercel.json` is already included with SPA rewrites.

2. **Option B: Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```

---

## 3. Deploy to Netlify

1. **Option A: Drag-and-Drop**
   - Run `npm run build`.
   - Drag and drop the `dist/` directory directly into [app.netlify.com/drop](https://app.netlify.com/drop).

2. **Option B: Git Continuous Deployment**
   - Push repository to GitHub/GitLab.
   - Connect repository in Netlify.
   - Build Command: `npm run build`
   - Publish Directory: `dist`
   - `netlify.toml` is pre-configured with client-side SPA routing rules.

---

## 4. Deploy via Docker (Self-Hosted / Cloud Run / AWS ECS / VPS)

The included `Dockerfile` performs a multi-stage compilation and serves through an optimized `nginx:alpine` image.

```bash
# Build the Docker container image
docker build -t procollege-app:latest .

# Run the container on port 80
docker run -d -p 80:80 --name procollege procollege-app:latest
```
Access the application at `http://localhost` or your server's public IP / domain.

---

## 5. Adding New Products in the Future

The product suite architecture is modular and driven by data. To add a new product:

1. Open [`src/data/products.ts`](./src/data/products.ts).
2. Append a new product entry conforming to `ProductItem`:
```ts
{
  id: 'procollege-analytics',
  title: 'ProCollege Academic Analytics',
  shortName: 'Analytics',
  category: 'productivity', // 'collaboration' | 'learning' | 'productivity' | 'admin'
  description: 'AI-powered student engagement telemetry and institutional reporting.',
  badge: 'NEW',
  status: 'active', // 'active' | 'coming-soon'
  color: '#0284c7',
  iconName: 'Sparkles',
  actionLabel: 'Launch Analytics',
  features: [
    'Retention risk alerts',
    'Curriculum pacing analysis',
    'Exportable accreditation reports'
  ]
}
```
3. The new product will automatically appear in:
   - The **Landing Portal** product grid & category filters.
   - The **9-Dot Waffle App Launcher** dropdown in the top header.
   - The role-based launcher modal.
