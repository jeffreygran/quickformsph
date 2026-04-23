# QuickFormsPH — High Availability Strategy

Two production instances, fronted by Cloudflare, with shared state. Designed to run on
**$0 Cloudflare free tier** plus whatever Azure + DGX already cost.

---

## 1. Topology

```
Spaceship (registrar)
        │ NS records → Cloudflare (one-time change)
        ▼
Cloudflare DNS + WAF + CDN + DDoS + Universal SSL
        │
        ├── Origin #1: Azure App Service (Linux, Node 20 LTS)
        │     - Public hostname: *.azurewebsites.net
        │     - Proxied CNAME in Cloudflare DNS
        │     - App Service Access Restrictions: allow Cloudflare IPs only
        │
        └── Origin #2: DGX Spark via Cloudflare Tunnel
              - cloudflared connector → http://localhost:3000
              - No open ports on the home router

Shared state (both origins connect):
  - DB:    Turso (libSQL) OR Azure Postgres Flexible Server
  - Blobs: Cloudflare R2 (zero egress) OR Azure Blob Storage
  - Logs:  stdout → App Service / journald; aggregated later
```

---

## 2. Why Cloudflare in front

| Capability            | Free tier | Used for                                   |
| --------------------- | --------- | ------------------------------------------ |
| DNS (unlimited)       | ✅        | Single source of truth for `quickforms.ph` |
| CDN (unlimited BW)    | ✅        | Cache `/public`, `/_next/static/*`         |
| Universal SSL         | ✅        | TLS at edge, no cert management            |
| DDoS L3/L4/L7         | ✅        | Unmetered                                  |
| WAF (managed + 5 custom) | ✅     | Block obvious attacks                      |
| Tunnel (Zero Trust)   | ✅        | Expose DGX without opening ports           |
| R2 object storage     | 10 GB    | User uploads / generated PDFs              |

Spaceship remains the registrar. Only the **nameservers** move to Cloudflare (one-time).
All future DNS edits happen in Cloudflare — Spaceship never needs to be touched again.

---

## 3. Origin #1 — Azure App Service (Linux)

### Runtime
- Stack: **Node 20 LTS**, Linux plan (Basic B2 minimum; P1v3 recommended for OCR load).
- Build: `next build` with `output: 'standalone'` in `next.config.js`.
- Startup command: `node server.js`.
- App settings:
  - `WEBSITES_PORT=3000`
  - `SCM_DO_BUILD_DURING_DEPLOYMENT=true` (or deploy prebuilt artifact)
  - `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true` (only needed if writing to `/home`)
  - `NODE_ENV=production`
  - **Always On** = enabled

### Native modules
`better-sqlite3` and `sharp` ship Linux x64 prebuilt binaries. Pin Node 20 so prebuilds match.
Verify post-deploy: `npm ls better-sqlite3 sharp` and a startup health check.

### Lock down to Cloudflare
App Service → **Networking → Access Restrictions**:
- Allow: [Cloudflare IPv4](https://www.cloudflare.com/ips-v4) + [IPv6](https://www.cloudflare.com/ips-v6) ranges.
- Deny all others.
- Keep the SCM site restricted to your IP / Azure AD users.

### Cloudflare DNS record
```
Type:  CNAME
Name:  quickforms   (or @)
Value: <app-name>.azurewebsites.net
Proxy: ☁️ Proxied (orange cloud)
```
SSL mode: **Full (strict)** using the App Service managed cert as origin cert.

---

## 4. Origin #2 — DGX Spark via Cloudflare Tunnel

### One-time setup on DGX
```bash
# Install
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Authenticate + create tunnel
cloudflared tunnel login
cloudflared tunnel create quickformsph

# Route DNS (auto-creates proxied CNAME in Cloudflare)
cloudflared tunnel route dns quickformsph quickforms.ph
```

### `/etc/cloudflared/config.yml`
```yaml
tunnel: quickformsph
credentials-file: /etc/cloudflared/<tunnel-uuid>.json

ingress:
  - hostname: quickforms.ph
    service: http://localhost:3000
  - hostname: www.quickforms.ph
    service: http://localhost:3000
  - service: http_status:404
```

### Systemd
```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

No inbound ports, no public IP required. Survives dynamic IP and CGNAT.

---

## 5. Shared state (the hard part)

`better-sqlite3` is a local file. It cannot be shared between Azure and DGX.
Pick one of the two paths below **before** enabling active/active.

### Option A — Turso (libSQL, recommended for minimal code change)
- Drop-in replacement for SQLite; supports read replicas in multiple regions.
- Free tier: 9 GB storage, 1 B row reads/month, 25 M writes/month, 3 DBs.
- Swap `better-sqlite3` for `@libsql/client`; SQL mostly unchanged.
- Both Azure and DGX connect to the same Turso DB.

### Option B — Postgres (Neon / Supabase / Azure Flexible Server)
- Requires moving queries to a Postgres driver (`pg` or Drizzle/Prisma).
- More migration work, but industry-standard.
- Neon free: 0.5 GB, autoscale to zero. Supabase free: 500 MB + auth + storage.

### Blob storage
Move user uploads and generated PDFs to **Cloudflare R2** (S3-compatible, zero egress).
Both origins read/write the same bucket. Keep signed URLs short-lived.

### Migration order
1. Stand up Turso/Postgres, import current SQLite data.
2. Point Azure App Service at the new DB (still single origin).
3. Validate for a week.
4. Add DGX as second origin.

---

## 6. Failover modes

### Mode 1 — Active / Passive (start here, free)
- Azure = live, DGX = warm standby.
- DNS CNAME points to Azure.
- On outage, edit Cloudflare DNS to point to the DGX tunnel (CNAME → `<uuid>.cfargotunnel.com`).
  - Proxied records propagate in seconds.
- DGX runs the same build; DB is already shared, so it just needs to be running.

### Mode 2 — Active / Active via multiple tunnel connectors (free)
- Register **two connectors** against the same Cloudflare Tunnel:
  - connector #1 on an Azure VM or Container App (not App Service — it can't host cloudflared cleanly)
  - connector #2 on DGX
- Cloudflare load-balances across healthy connectors automatically.
- If a connector drops, traffic shifts in seconds. No DNS edits.

### Mode 3 — Active / Active via Cloudflare Load Balancer (paid, ~$5/mo)
- Keep Azure App Service as a public origin; add DGX tunnel as second origin.
- Cloudflare LB health-checks both, does geo-steering + weighted routing.
- Cleanest but costs money.

**Current recommendation:** start at **Mode 1**, graduate to **Mode 2** once the DB is externalized and deploys are reproducible on both hosts.

---

## 7. Deployment workflow

### Build artifact
- Build once with `next build` (`output: 'standalone'`).
- Output: `.next/standalone/` + `.next/static/` + `public/`.
- Produce a tarball; deploy the **same** tarball to Azure and DGX.

### Azure
- GitHub Actions → `azure/webapps-deploy@v3` with the built zip.
- Slot: `staging` → swap to `production` after smoke tests.

### DGX
- rsync the tarball to DGX; `systemctl restart quickformsph`.
- Or GitHub Actions self-hosted runner on DGX.

### Blue / green on DGX
- Run two systemd units on different ports (`:3000` and `:3001`).
- `cloudflared` ingress points at the active one; swap port after health check passes.

---

## 8. Observability

- **Azure**: App Service logs → Log Analytics workspace. Application Insights for APM.
- **DGX**: `journalctl -u quickformsph` + node-exporter + Prometheus (already present in `/monitoring`).
- **Cloudflare**: Analytics (free), Logpush is Enterprise-only — skip on free tier.
- **Uptime checks**: Cloudflare Workers cron OR UptimeRobot free tier, hitting `/api/health` on both origins directly (bypass CF cache).

Add a `/api/health` route that returns:
```json
{ "ok": true, "db": "up", "blob": "up", "build": "<git-sha>", "origin": "azure|dgx" }
```

---

## 9. Security checklist

- [ ] App Service Access Restrictions: Cloudflare IPs only.
- [ ] SSL mode: **Full (strict)** in Cloudflare.
- [ ] Tunnel credentials file: `chmod 600`, owned by `cloudflared`.
- [ ] Rotate tunnel token if it ever leaks (`cloudflared tunnel token`).
- [ ] WAF rule: block non-PH traffic to `/admin/*` (optional).
- [ ] Rate limiting rule: 10 req/s per IP on `/api/*`.
- [ ] Signed URLs for R2 objects (no public buckets).
- [ ] Env secrets in Azure Key Vault references + `cloudflared` + `systemd` EnvironmentFile on DGX (mode 600).

---

## 10. Cost summary

| Component                         | Cost                           |
| --------------------------------- | ------------------------------ |
| Cloudflare (DNS, CDN, WAF, DDoS, Tunnel, SSL) | $0                 |
| Cloudflare R2 (10 GB free)        | $0 to start                    |
| Azure App Service Linux B2        | ~$13/mo (or P1v3 ~$70/mo)      |
| Turso free tier                   | $0                             |
| DGX Spark                         | Already owned                  |
| Spaceship domain renewal          | Annual registrar fee only      |
| **Total new spend**               | **~$13/mo** (App Service only) |

---

## 11. Roll-forward plan

1. Move Spaceship nameservers to Cloudflare. *(one-time)*
2. Deploy current Next.js build to Azure Linux App Service. *(origin #1)*
3. Set up Cloudflare Tunnel on DGX; map `staging.quickforms.ph` for parity testing.
4. Externalize DB to Turso; migrate data; dual-write test.
5. Move uploads to R2; update signed URL logic.
6. Promote DGX tunnel to a prod hostname behind the same Cloudflare zone.
7. Switch to Mode 2 (two connectors, one tunnel) once both origins read/write identical state.
8. Add health endpoint + external uptime monitor.
9. Document runbook in `DEPLOYMENT.md` → link back here.

---

## 12. Known caveats

- `better-sqlite3` on App Service `/home` works only at **scale = 1 instance**. Do not scale out without migrating the DB.
- `tesseract.js` is CPU-heavy; size the App Service plan accordingly or move OCR to a worker.
- In-flight requests during a connector/ISP flap will fail (reset). Make API calls idempotent where possible and add client-side retry on POSTs.
- Cloudflare Tunnel requires outbound 443 (HTTP/2) or UDP 7844 (QUIC). Ensure both ISPs allow them.
- If both home ISPs share an upstream, you don't actually have redundancy — verify divergent paths.
