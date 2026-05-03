# Nostia Backend Deployment Guide

## Droplet Details
- **Provider:** DigitalOcean
- **IP:** 142.93.116.6
- **User:** root
- **OS:** Ubuntu 24.04.4 LTS
- **App path:** /var/www/nostia-backend/
- **Process manager:** PM2 (process name: nostia)
- **Git remote on droplet:** appback (olafwoodall-sudo/Nostia_appback)

---

## SSH Access

```bash
ssh root@142.93.116.6
```

If prompted to select a key:

```bash
ssh -i ~/.ssh/nostia-droplet root@142.93.116.6
```

---

## Deploying Backend Changes

**Important:** The droplet pulls from the `appback` remote, NOT `origin`.
Always push to `appback` from your local machine before deploying.

### Step 1 — Push to appback (from your local machine)
```bash
git push appback main
```

### Step 2 — SSH into the droplet
```bash
ssh root@142.93.116.6
```

### Step 3 — Pull and restart
```bash
cd /var/www/nostia-backend && git pull origin main && pm2 restart all
```

---

## Useful PM2 Commands (on the droplet)

```bash
pm2 list              # show running processes
pm2 logs nostia       # tail server logs
pm2 restart all       # restart the server
pm2 stop all          # stop the server
pm2 start server.js --name nostia   # start if not running
```

---

## Notes
- Backend source on GitHub: https://github.com/olafwoodall-sudo/Nostia_appback
- iOS submodule changes go to `origin` (olafw666-cpu/nostia-app), not appback
- The droplet's `origin` remote points to Nostia_appback — running `git pull origin main` on the droplet pulls from appback
