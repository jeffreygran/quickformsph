# QuickFormsPH Deployment Plan

> **Reference document for all deployment, versioning, and infrastructure decisions for QuickFormsPH.**
> Always refer to this file for deployment-related concerns and improvements.

---

## Table of Contents

1. [Environments](#environments)
2. [DEV Deployment (DGX)](#dev-deployment-dgx)
3. [PROD Deployment (Azure)](#prod-deployment-azure)
4. [Version Bump Convention](#version-bump-convention)
5. [Azure Resources](#azure-resources)
6. [GitHub Repository & Secrets](#github-repository--secrets)
7. [DNS Configuration (Spaceship → quickformsph.com)](#dns-configuration)
8. [Azure Storage Containers](#azure-storage-containers)
9. [Environment Variables Reference](#environment-variables-reference)
10. [QA Checklist (Engineer Mai)](#qa-checklist-engineer-mai)
11. [Rollback Procedure](#rollback-procedure)
12. [Future Improvements](#future-improvements)

---

## Environments

| Environment | URL | Branch | Trigger |
|---|---|---|---|
| DEV | http://192.168.79.11:3400 | `dev` | Push to `dev` branch |
| PROD | https://quickformsph-webapp.azurewebsites.net | `main` | Push to `main` branch |
| PROD (custom) | https://www.quickformsph.com | `main` | After DNS configured |

---

## DEV Deployment (DGX)

**Server:** DGX local machine — `192.168.79.11`  
**Port:** `3400`  
**Process manager:** `systemd` (`quickformsph.service`)  
**User:** `skouzen`

### Automatic (GitHub Actions)

Push to `dev` branch triggers `.github/workflows/deploy-dev.yml`:

```
dev branch push → SSH into DGX → git pull → npm ci → npm run build → systemctl restart quickformsph
```

**Required GitHub Secret:**
- `DGX_SSH_PRIVATE_KEY` — SSH private key for `skouzen@192.168.79.11`

To set it:
```bash
cat ~/.ssh/id_rsa | gh secret set DGX_SSH_PRIVATE_KEY --repo jeffreygran/quickformsph
```

### Manual Deploy to DEV

```bash
cd /home/skouzen/projects/quickformsph-dev
git pull origin dev
npm ci
npm run build
sudo systemctl restart quickformsph
sudo systemctl status quickformsph
```

### Systemd Service

```bash
# Check status
sudo systemctl status quickformsph

# View logs
sudo journalctl -u quickformsph -f

# Restart
sudo systemctl restart quickformsph
```

Service file: `/etc/systemd/system/quickformsph.service`

---

## PROD Deployment (Azure)

**Azure Subscription:** `e9fb67eb-de51-43bf-a2eb-2fed65e0722b`  
**Resource Group:** `quickformsph-rg` (Southeast Asia)  
**App Service Plan:** `quickformsph-plan` (B1 Linux)  
**WebApp:** `quickformsph-webapp`  
**Runtime:** Node 20 LTS  
**Startup command:** `node server.js`

### Automatic (GitHub Actions — Primary Method)

Push to `main` branch triggers `.github/workflows/deploy-prod.yml`:

```
main branch push
→ npm ci
→ npm run build (Next.js standalone output)
→ Copy .next/static + public into standalone/
→ Zip .next/standalone/
→ az webapp deploy (zip deploy, async)
→ Deployed to https://quickformsph-webapp.azurewebsites.net
```

**Notes:**
- Deploy uses `--async true` — Azure restarts the container after zip extraction
- Site comes up within ~60-90 seconds after deploy job completes
- GitHub Actions may show "success" before warmup probe completes — this is normal

### Manual Deploy to PROD

```bash
# 1. Build locally
cd /home/skouzen/projects/quickformsph-dev
npm run build

# 2. Assemble standalone package
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 3. Login and deploy
az login
cd .next/standalone
zip -r /tmp/deploy.zip .
az webapp deploy \
  --name quickformsph-webapp \
  --resource-group quickformsph-rg \
  --src-path /tmp/deploy.zip \
  --type zip \
  --async true
```

### PROD Logs

```bash
az webapp log tail \
  --name quickformsph-webapp \
  --resource-group quickformsph-rg
```

---

## Version Bump Convention

**Rule: Always bump version when deploying to DEV or PROD.**

| Deploy Target | Version Change | Example |
|---|---|---|
| Bug fix to DEV | Patch `x.x.PATCH` | `1.0.0 → 1.0.1` |
| Feature to DEV | Minor `x.MINOR.0` | `1.0.1 → 1.1.0` |
| PROD release | Major or Minor | `1.0.x → 1.1.0` |
| Breaking change | Major `MAJOR.0.0` | `1.x.x → 2.0.0` |

**Files to update on version bump:**
1. `package.json` — `"version"` field
2. `src/app/layout.tsx` — footer `QuickFormsPH vX.X.X`

**Git commit message convention:**
```
feat: <description> vX.X.X       # new feature
fix: <description>                # bug fix
chore: bump version to X.X.X     # version bump only
```

---

## Azure Resources

| Resource | Name | Notes |
|---|---|---|
| Subscription | `e9fb67eb-de51-43bf-a2eb-2fed65e0722b` | |
| Resource Group | `quickformsph-rg` | southeastasia |
| App Service Plan | `quickformsph-plan` | B1 Linux |
| WebApp | `quickformsph-webapp` | Node 20 LTS |
| Storage Account | `quickformsphstor` | Standard LRS |

### Recreate WebApp (if needed)

```bash
az appservice plan create \
  --name quickformsph-plan \
  --resource-group quickformsph-rg \
  --sku B1 \
  --is-linux \
  --location southeastasia

az webapp create \
  --name quickformsph-webapp \
  --resource-group quickformsph-rg \
  --plan quickformsph-plan \
  --runtime "NODE:20-lts"
```

---

## GitHub Repository & Secrets

**Repo:** https://github.com/jeffreygran/quickformsph  
**Branches:** `main` (PROD), `dev` (DEV)

### Required GitHub Actions Secrets

| Secret Name | Description |
|---|---|
| `AZURE_CREDENTIALS` | Azure Service Principal JSON (SP: `quickformsph-github-actions`) |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | WebApp publish profile XML (backup auth method) |
| `DGX_SSH_PRIVATE_KEY` | SSH key for DGX server (needed for DEV workflow) |

### Re-generate AZURE_CREDENTIALS (if SP expires)

```bash
az ad sp create-for-rbac \
  --name "quickformsph-github-actions" \
  --role contributor \
  --scopes "/subscriptions/e9fb67eb-de51-43bf-a2eb-2fed65e0722b/resourceGroups/quickformsph-rg" \
  --sdk-auth | gh secret set AZURE_CREDENTIALS --repo jeffreygran/quickformsph
```

---

## DNS Configuration

**Domain:** `quickformsph.com` (registered at Spaceship)  
**Target:** `quickformsph-webapp.azurewebsites.net`

### Steps to configure custom domain

1. **Get the Custom Domain Verification ID from Azure:**
   ```bash
   az webapp show \
     --name quickformsph-webapp \
     --resource-group quickformsph-rg \
     --query customDomainVerificationId \
     -o tsv
   ```

2. **In Spaceship DNS Manager, add these records:**

   | Type | Host | Value | TTL |
   |---|---|---|---|
   | CNAME | `www` | `quickformsph-webapp.azurewebsites.net` | 3600 |
   | TXT | `asuid.www` | `<verification-id-from-step-1>` | 3600 |
   | A | `@` | `20.195.37.193` *(get current IP from Azure)* | 3600 |
   | TXT | `asuid` | `<verification-id-from-step-1>` | 3600 |

3. **Add custom domain in Azure:**
   ```bash
   az webapp custom-domain add \
     --webapp-name quickformsph-webapp \
     --resource-group quickformsph-rg \
     --hostname www.quickformsph.com
   ```

4. **Enable Managed Certificate (free HTTPS):**
   ```bash
   az webapp config ssl create \
     --name quickformsph-webapp \
     --resource-group quickformsph-rg \
     --hostname www.quickformsph.com
   ```

5. **Bind certificate:**
   ```bash
   az webapp config ssl bind \
     --certificate-type managed \
     --name quickformsph-webapp \
     --resource-group quickformsph-rg \
     --ssl-type SNI \
     --hostname www.quickformsph.com
   ```

---

## Azure Storage Containers

**Account:** `quickformsphstor`

| Container | Purpose |
|---|---|
| `pdf` | Generated PDF files |
| `pdf-preview` | PDF preview images |
| `image-preview` | Upload preview images |

**Access:** Set via app settings `AZURE_STORAGE_ACCOUNT_NAME` + `AZURE_STORAGE_ACCOUNT_KEY`.

---

## Environment Variables Reference

See `.env.example` for the template. **Never commit `.env.local` or `.env.production`.**

| Variable | DEV value | PROD source |
|---|---|---|
| `NODE_ENV` | `development` | Azure App Settings |
| `STORAGE_BACKEND` | `local` or `azure` | `azure` |
| `ADMIN_USERNAME` | `skouzen` | Azure App Settings |
| `ADMIN_PASSWORD` | (local) | Azure App Settings |
| `JWT_SECRET` | (local) | Azure App Settings |
| `AZURE_STORAGE_ACCOUNT_NAME` | `quickformsphstor` | Azure App Settings |
| `AZURE_STORAGE_ACCOUNT_KEY` | (local) | Azure App Settings |
| `PORT` | `3400` | `8080` (Azure default) |

---

## QA Checklist (Engineer Mai)

> **@QA Engineer Mai** — End-to-end test checklist for each deployment.

### Smoke Tests (run after every deploy)

- [ ] Homepage loads at the deployed URL
- [ ] Form page loads: `/forms/hqp-pff-356`
- [ ] Auto-populate button fills all fields correctly
- [ ] All form wizard steps navigate forward and back
- [ ] Review screen shows all entered data grouped by section
- [ ] "Edit" buttons on Review screen return to correct wizard step
- [ ] "Preview in PDF" button generates a watermarked preview image
- [ ] PDF preview lightbox opens on image tap/click
- [ ] "Generate & Download PDF" downloads a valid PDF file
- [ ] Downloaded PDF filename: `FULLNAME - Pag-IBIG Fund - HQP-PFF-356.pdf`
- [ ] Both form copies in the PDF are filled correctly
- [ ] WinAnsi characters display correctly (no garbled text)
- [ ] Footer shows correct version number
- [ ] Admin login accessible via Shift+double-click on logo

### PROD-Specific Checks

- [ ] HTTPS is active (no mixed content warnings)
- [ ] Response time < 3 seconds on initial load
- [ ] `/api/generate` returns HTTP 200 with `application/pdf`
- [ ] No console errors in browser developer tools

### Regression Tests

- [ ] Draft save/load works across browser refresh
- [ ] Address fields (street, barangay, city/province/zip) render on correct lines
- [ ] Name extension field skips "N/A" correctly
- [ ] Bank name field skips empty/"Other" correctly

---

## Rollback Procedure

### PROD rollback

```bash
# List recent deployment slots
az webapp deployment list \
  --name quickformsph-webapp \
  --resource-group quickformsph-rg

# Roll back to previous git tag
git -C /home/skouzen/projects/quickformsph-dev checkout <prev-tag>
# Then re-run the manual deploy steps above
```

### Git rollback

```bash
# Revert last commit and push (triggers re-deploy)
git revert HEAD
git push origin main
```

---

## Future Improvements

- [ ] Add staging slot in Azure (swap-based zero-downtime deploy)
- [ ] Add `DGX_SSH_PRIVATE_KEY` secret to GitHub and test `deploy-dev.yml`
- [ ] Configure custom domain `www.quickformsph.com` via Spaceship DNS
- [ ] Enable managed HTTPS certificate on custom domain
- [ ] Add more government forms (SSS, PhilHealth, BIR)
- [ ] Integrate Azure Document Intelligence for auto-fill from uploaded IDs
- [ ] Add Azure AI (gpt-5.2) for form field assistance / validation
- [ ] Add form version history in Azure Storage
- [ ] Add health check endpoint `/api/health` for uptime monitoring
- [ ] Scale up to B2/B3 if build-on-deploy becomes needed
- [ ] Add GitHub Dependabot for dependency updates
- [ ] Add unit tests and integrate into CI pipeline
