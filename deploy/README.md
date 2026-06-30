# EC2 backend deployment (FYP Relevancy Checker)

Use **`fyp-relevancy-key.pem`** in the **repo root** (`FYP-Relevancy-checker/fyp-relevancy-key.pem`).

The key is **gitignored** — do not commit it to GitHub.

## 1. One-time setup

```powershell
cd "D:\FYP UNI\FYP-Relevancy-checker"
copy deploy\ec2.config.example deploy\ec2.config
```

Edit `deploy\ec2.config` — set your **Public IPv4** from AWS EC2 → Instances:

```ini
EC2_HOST=3.xx.xx.xx
EC2_USER=ubuntu
EC2_KEY_PATH=fyp-relevancy-key.pem
VITE_API_URL=http://3.xx.xx.xx:8000/api/v1
```

> **User name:** `ubuntu` for Ubuntu AMI, `ec2-user` for Amazon Linux.

## 2. One command (PowerShell — recommended)

Vercel par `VITE_API_URL` add ho chuka ho, phir repo root se:

```powershell
cd "D:\FYP UNI\FYP-Relevancy-checker"
  # apna path
.\deploy\automate.ps1
```

Yeh script:
- Local V2 checks (`verify_v2_predeploy`, pytest, E2E, DB export)
- Backend test karegi (`http://YOUR_IP:8000/api/v1/docs`)
- EC2 par SSH se repo clone, deps, **V2 model**, PostgreSQL, DB import, CORS, uvicorn start
- Dubara test karegi

Sirf test: `.\deploy\automate.ps1 -TestOnly`  
Sirf EC2 setup: `.\deploy\automate.ps1 -SetupOnly`  
Local checks skip: `.\deploy\automate.ps1 -SkipLocalChecks`

**Vercel redeploy** (env change ke baad): Dashboard → Deployments → Redeploy

## 3. Connect to EC2 (manual SSH)

```powershell
.\deploy\connect.ps1
```

Or manually:

```powershell
ssh -i "D:\FYP UNI\FYP-Relevancy-checker\fyp-relevancy-key.pem" ubuntu@YOUR_PUBLIC_IP
```

## 4. Vercel env var (copy from ec2.config)

| Key | Value |
|---|---|
| `VITE_API_URL` | `http://YOUR_PUBLIC_IP:8000/api/v1` |

## 5. EC2 security group

Inbound rules:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP |
| Custom TCP | 8000 | 0.0.0.0/0 (or restrict) |

## 6. Backend on EC2 (manual fallback)

```bash
sudo apt update && sudo apt install -y python3-venv python3-pip postgresql git
git clone https://github.com/waleed2227/FYP-Relevancy-checker.git
cd FYP-Relevancy-checker/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit DB + CORS + SECRET_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**CORS on EC2** (`backend/.env`):

```env
CORS_ORIGINS=https://fyp-relevancy-checker.vercel.app,http://localhost:5173
RELEVANCY_ENGINE_V2_ENABLED=true
SENTENCE_TRANSFORMER_MODEL=sentence-transformers/all-MiniLM-L6-v2
SENTENCE_TRANSFORMER_DEVICE=cpu
OLLAMA_ENABLED=false
```

## 7. V2 semantic relevancy on EC2

`remote-setup.sh` now installs **torch + sentence-transformers**, downloads `all-MiniLM-L6-v2`, and imports your local DB dump (with V2 scores).

**Before deploy (local):**

```powershell
cd backend
python -m scripts.verify_v2_predeploy
python -m pytest tests/ -q
python scripts/export_local_db.py
```

Or run everything via `.\deploy\automate.ps1` (includes these checks).

**On EC2 (automatic via automate.ps1):**

1. CPU-only `torch` + `sentence-transformers`
2. `RELEVANCY_ENGINE_V2_ENABLED=true` in `.env`
3. `python -m scripts.download_sentence_transformer`
4. Import `local_database_dump.json` (uploaded from your machine)
5. `python -m scripts.verify_v2_predeploy`

If model download fails (HTTP 429), SSH in and add `HF_TOKEN=hf_xxx` to `backend/.env`, then re-run:

```bash
cd ~/FYP-Relevancy-checker/backend && source venv/bin/activate
python -m scripts.download_sentence_transformer
python -m scripts.verify_v2_predeploy
```

The model folder `backend/models/all-MiniLM-L6-v2` is gitignored (~90MB) — it is downloaded on the server, not committed.

Instance ID (Stockholm): `i-0ace9e12d2adc035d` · Region: `eu-north-1`
