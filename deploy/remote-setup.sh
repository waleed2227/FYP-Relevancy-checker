#!/usr/bin/env bash
# Run on EC2 (first-time backend setup). Called by automate.ps1 via SSH.
set -eu

VERCEL_URL="${VERCEL_URL:-https://fyp-relevancy-checker.vercel.app}"
REPO_DIR="${REPO_DIR:-$HOME/FYP-Relevancy-checker}"
REPO_URL="${REPO_URL:-https://github.com/waleed2227/FYP-Relevancy-checker.git}"

echo "==> Setting up 2GB swap space to prevent OOM killer..."
if [ ! -f /swapfile ]; then
  sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
fi

echo "==> Installing system packages..."
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
  python3-venv python3-pip git postgresql postgresql-contrib libpq-dev python3-dev curl

echo "==> Cloning/updating repo..."
if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$REPO_URL" "$REPO_DIR"
else
  cd "$REPO_DIR" && git pull origin main
fi

cd "$REPO_DIR/backend"

echo "==> Installing uv (ultra-fast Python package manager)..."
curl -LsSf https://astral.sh/uv/install.sh | sh || true
export PATH="$HOME/.local/bin:$PATH"

echo "==> Creating Python 3.12 virtual environment via uv..."
rm -rf venv
uv venv --python 3.12 venv
source venv/bin/activate

echo "==> Installing Python dependencies (V2 semantic engine, CPU-only torch)..."
uv pip install "numpy>=2.2.1"
uv pip install torch --index-url https://download.pytorch.org/whl/cpu
uv pip install -r requirements.txt

echo "==> PostgreSQL database (local on EC2)..."
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgre123';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE fyp_relevancy_system;" 2>/dev/null || true

echo "==> backend/.env ..."
if [ ! -f .env ]; then
  cp .env.example .env
fi

if grep -q '^CORS_ORIGINS=' .env; then
  sed -i "s|^CORS_ORIGINS=.*|CORS_ORIGINS=${VERCEL_URL},http://localhost:5173|" .env
else
  echo "CORS_ORIGINS=${VERCEL_URL},http://localhost:5173" >> .env
fi

sed -i 's|^DB_HOST=.*|DB_HOST=localhost|' .env
sed -i 's|^DB_NAME=.*|DB_NAME=fyp_relevancy_system|' .env
sed -i 's|^DB_USER=.*|DB_USER=postgres|' .env
sed -i 's|^DB_PASSWORD=.*|DB_PASSWORD=postgre123|' .env
sed -i 's|^HOST=.*|HOST=0.0.0.0|' .env
sed -i 's|^PORT=.*|PORT=8000|' .env

# V2 relevancy engine (semantic similarity)
if grep -q '^RELEVANCY_ENGINE_V2_ENABLED=' .env; then
  sed -i 's|^RELEVANCY_ENGINE_V2_ENABLED=.*|RELEVANCY_ENGINE_V2_ENABLED=true|' .env
else
  echo "RELEVANCY_ENGINE_V2_ENABLED=true" >> .env
fi
if grep -q '^SENTENCE_TRANSFORMER_MODEL=' .env; then
  sed -i 's|^SENTENCE_TRANSFORMER_MODEL=.*|SENTENCE_TRANSFORMER_MODEL=sentence-transformers/all-MiniLM-L6-v2|' .env
else
  echo "SENTENCE_TRANSFORMER_MODEL=sentence-transformers/all-MiniLM-L6-v2" >> .env
fi
if grep -q '^SENTENCE_TRANSFORMER_DEVICE=' .env; then
  sed -i 's|^SENTENCE_TRANSFORMER_DEVICE=.*|SENTENCE_TRANSFORMER_DEVICE=cpu|' .env
else
  echo "SENTENCE_TRANSFORMER_DEVICE=cpu" >> .env
fi
# Allow Hugging Face download on first deploy (local dev may use offline flags)
if grep -q '^HF_HUB_OFFLINE=' .env; then
  sed -i 's|^HF_HUB_OFFLINE=.*|HF_HUB_OFFLINE=0|' .env
fi
if grep -q '^TRANSFORMERS_OFFLINE=' .env; then
  sed -i 's|^TRANSFORMERS_OFFLINE=.*|TRANSFORMERS_OFFLINE=0|' .env
fi
# Ollama is optional on EC2 — disable unless you install it on the server
if grep -q '^OLLAMA_ENABLED=' .env; then
  sed -i 's|^OLLAMA_ENABLED=.*|OLLAMA_ENABLED=false|' .env
else
  echo "OLLAMA_ENABLED=false" >> .env
fi

echo "==> DB schema + seed..."
export PYTHONPATH=.
python scripts/setup_db.py || echo "WARN: setup_db failed - edit .env DB_PASSWORD then re-run setup_db.py"

echo "==> Downloading V2 sentence-transformer model (~90MB)..."
python -m scripts.download_sentence_transformer || echo "WARN: model download failed — add HF_TOKEN to .env and re-run download_sentence_transformer"

if [ -f local_database_dump.json ]; then
  echo "==> Importing local database dump (includes V2 relevancy scores)..."
  python scripts/import_ec2_db.py || echo "WARN: import_ec2_db failed"
else
  echo "==> No local_database_dump.json — re-scoring all projects with V2..."
  python -m scripts.backfill_all_relevancy --force || echo "WARN: backfill_all_relevancy failed"
fi

echo "==> V2 pre-deployment verification..."
python -m scripts.verify_v2_predeploy || echo "WARN: verify_v2_predeploy failed — check model and DB"

echo "==> Starting uvicorn (background)..."
pkill -f "uvicorn app.main:app" 2>/dev/null || true
export PYTHONPATH=.
nohup venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > ~/uvicorn.log 2>&1 &
sleep 6

echo "==> Done. Log: ~/uvicorn.log"
curl -sf "http://127.0.0.1:8000/docs" >/dev/null && echo "Backend OK on port 8000" || echo "WARN: backend not responding yet - check ~/uvicorn.log and DB_PASSWORD in .env"
