# Claimora Frontend

UI web untuk **Claimora** — review klaim asuransi, upload dokumen, dan tinjau hasil ekstraksi AI (Next.js App Router).

## Prasyarat

- **Node.js** 20+ (disarankan LTS)
- **Backend** Claimora berjalan (default `http://localhost:4000`) — lihat [`../backend/README.md`](../backend/README.md)

## Setup cepat

```bash
cd frontend
cp .env.example .env.local
# Sesuaikan NEXT_PUBLIC_API_BASE_URL jika backend tidak di localhost:4000

npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Login membutuhkan user di backend (mis. `npm run seed:super-admin` di folder `backend/`).

## Environment

| Variabel | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL API backend, dengan suffix `/api` (default: `http://localhost:4000/api`) |

Dibaca di `src/lib/api/client.ts`. Template: [`.env.example`](./.env.example).

**Jangan commit** `.env` atau `.env.local` — hanya `.env.example`.

## Docker (production)

### Coolify (repo monorepo `rs_abby`)

| Setting | Nilai |
|---------|--------|
| **Base Directory** | `/` (root repo) |
| **Dockerfile** | `Dockerfile` (di **root**, bukan `frontend/Dockerfile`) |
| **Build arg** | `NEXT_PUBLIC_API_BASE_URL=https://your-api.com/api` |

Root tidak punya `package-lock.json` — hanya ada di `frontend/`. Dockerfile root menyalin `frontend/package.json` + `frontend/package-lock.json`.

Alternatif: Base Directory = `frontend`, Dockerfile = `Dockerfile` (pakai `frontend/Dockerfile`).

### Lokal

```bash
# Dari root monorepo
docker build -f Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api -t claimora-frontend .

# Atau dari folder frontend
cd frontend
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api -t claimora-frontend .
```

`NEXT_PUBLIC_*` harus diset saat **build** (bukan hanya saat `docker run`).

## Scripts

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Jalankan build production |
| `npm run lint` | ESLint (Next.js config) |

## Struktur penting

```
src/
  app/
    (auth)/          # Login, register, reset password
    (platform)/      # Dashboard, claims, extraction review, settings
  components/        # UI & claim detail (PDF viewer, highlights)
  lib/api/           # HTTP client ke backend
```

## Push ke GitHub

Sebelum commit:

1. `.env` / `.env.local` tidak ter-track
2. `node_modules/`, `.next/`, `out/` diabaikan
3. Hanya `.env.example` yang di-commit

```bash
git status   # verifikasi tidak ada secret atau artefak build
```

## Dokumentasi terkait

- Pipeline ekstraksi (backend): [`../backend/documentations/extraction-pipeline.md`](../backend/documentations/extraction-pipeline.md)
