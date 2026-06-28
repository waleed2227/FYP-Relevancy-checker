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

## 2. Connect to EC2

```powershell
.\deploy\connect.ps1
```

Or manually:

```powershell
ssh -i "D:\FYP UNI\FYP-Relevancy-checker\fyp-relevancy-key.pem" ubuntu@YOUR_PUBLIC_IP
```

## 3. Vercel env var (copy from ec2.config)

| Key | Value |
|---|---|
| `VITE_API_URL` | `http://YOUR_PUBLIC_IP:8000/api/v1` |

## 4. EC2 security group

Inbound rules:

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP |
| Custom TCP | 8000 | 0.0.0.0/0 (or restrict) |

## 5. Backend on EC2 (after SSH)

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
```

Instance ID (Stockholm): `i-0ace9e12d2adc035d` · Region: `eu-north-1`
