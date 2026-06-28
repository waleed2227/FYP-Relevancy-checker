# Backend Python Environment — Diagnostic Report

**Project:** AI-Based FYP Relevancy System  
**Document type:** Environment audit (no application code changes)  
**Date:** June 2026  
**Workspace:** `D:\FYP UNI\FYP-Relevancy-checker`

---

## Executive Summary

| Finding | Status |
|---------|--------|
| Required packages installed on active Python | **All present** |
| Runtime imports (`sqlalchemy`, `sentence_transformers`, etc.) | **All OK** |
| Unresolved import warnings in Cursor (basedpyright) | **IDE configuration issue** — not missing packages |
| Backend virtualenv (`.venv`) | **Not created** — global Python 3.12 used |
| Fix applied (workspace config only) | `.vscode/settings.json`, `pyrightconfig.json` files |

**Root cause of warnings:** Cursor/basedpyright was not pointed at the Python interpreter where packages are installed. Packages import successfully from the terminal.

---

## 1. Active Python Interpreter

### 1.1 Detected from terminal (shell default)

| Property | Value |
|----------|-------|
| **Executable** | `C:\Users\WaleedAwan\AppData\Local\Programs\Python\Python312\python.exe` |
| **Version** | Python **3.12.0** (64-bit) |
| **Platform** | Windows 10/11 (MSC v.1935) |
| **On PATH** | Yes (`Get-Command python` → same path) |

### 1.2 Project virtualenv

| Path | Exists |
|------|--------|
| `backend\.venv\Scripts\python.exe` | **No** |
| Repo root `.venv` | **No** |

The project runs against **global Python 3.12**, not an isolated venv.

### 1.3 Cursor / VS Code interpreter (before fix)

| Check | Result |
|-------|--------|
| `.vscode/settings.json` | **Was missing** — Cursor could use wrong/stub interpreter |
| `python.defaultInterpreterPath` | **Not set** |
| `backend/pyrightconfig.json` | **Was missing** |

### 1.4 Cursor / VS Code interpreter (after fix)

Created **`.vscode/settings.json`** at repo root:

```json
"python.defaultInterpreterPath": "C:\\Users\\WaleedAwan\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"
```

**You must reload Cursor** for warnings to clear:

1. `Ctrl+Shift+P` → **Python: Select Interpreter**
2. Choose `Python 3.12.0 ('Python312': python.exe)`
3. `Ctrl+Shift+P` → **Developer: Reload Window**

---

## 2. Package Verification

Checked with `python -m pip show` and runtime `import` from `backend/`.

| Package | Required | Installed | Version | Import test |
|---------|----------|-----------|---------|-------------|
| `sqlalchemy` | Yes | **Yes** | 2.0.36 | **OK** |
| `sentence-transformers` | Yes | **Yes** | 5.5.1 | **OK** |
| `torch` | Yes | **Yes** | 2.12.0 | **OK** |
| `transformers` | Yes (transitive) | **Yes** | 5.9.0 | **OK** |
| `fastapi` | Yes | **Yes** | 0.115.6 | **OK** |
| `uvicorn` | Yes | **Yes** | 0.32.1 | **OK** |

**Install location (all packages):**

```text
C:\Users\WaleedAwan\AppData\Local\Programs\Python\Python312\Lib\site-packages
```

### 2.1 Missing packages

**None** on the active interpreter above.

---

## 3. Targeted Import Tests

Run from `backend/`:

```powershell
cd "D:\FYP UNI\FYP-Relevancy-checker\backend"
python -c "import sqlalchemy; from sqlalchemy.ext.asyncio import AsyncSession; from sqlalchemy.orm import selectinload; from sqlalchemy.orm.attributes import NO_VALUE; print('SQLAlchemy OK')"
python -c "from sentence_transformers import SentenceTransformer; print('SentenceTransformer OK')"
```

**Result (audit run):** both commands printed OK.

### 3.1 `semantic_embeddings.py` imports

The module uses lazy imports inside functions:

```python
from sentence_transformers import SentenceTransformer  # when V2 enabled
```

Runtime: **works** (verified via `from sentence_transformers import SentenceTransformer`).

IDE warnings on lines 18, 61, 85 were **basedpyright resolution**, not runtime failures.

### 3.2 `auth_service.py` SQLAlchemy imports

```python
from sqlalchemy import inspect, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import NO_VALUE
```

Runtime: **works**. IDE warnings were **interpreter misconfiguration**.

---

## 4. Why Cursor Showed “Import could not be resolved”

| Symptom | Cause |
|---------|-------|
| `sqlalchemy` unresolved | basedpyright not using Python 3.12 site-packages |
| `sentence_transformers` unresolved | Same — stub/wrong interpreter or no `defaultInterpreterPath` |
| Terminal `pip install` succeeds | Packages on global Python; IDE used different environment |

This is a **language server configuration** problem, not a broken `requirements.txt`.

---

## 5. Exact Fixes Required

### 5.1 Already applied (workspace config — not application code)

| File | Purpose |
|------|---------|
| `.vscode/settings.json` | Points Cursor to Python 3.12; sets `extraPaths` for `backend/` |
| `pyrightconfig.json` (repo root) | basedpyright workspace roots for `backend/` |
| `backend/pyrightconfig.json` | Local analysis config for backend package |

### 5.2 Manual steps in Cursor (required once)

```text
1. Ctrl+Shift+P → Python: Select Interpreter
2. Select: C:\Users\WaleedAwan\AppData\Local\Programs\Python\Python312\python.exe
3. Ctrl+Shift+P → Developer: Reload Window
```

Confirm status bar shows **Python 3.12.0**.

### 5.3 Optional but recommended — project virtualenv

Isolates dependencies and avoids global/IDE drift:

```powershell
cd "D:\FYP UNI\FYP-Relevancy-checker\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Then update `.vscode/settings.json` interpreter to:

```text
${workspaceFolder}/backend/.venv/Scripts/python.exe
```

**Windows CPU-only torch (if install fails or wheel is too large):**

```powershell
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install "sentence-transformers>=3.3.0,<6"
pip install -r requirements.txt
```

### 5.4 If packages were missing (not your case)

Full install on current interpreter:

```powershell
cd "D:\FYP UNI\FYP-Relevancy-checker\backend"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Individual installs if needed:

```powershell
python -m pip install "sqlalchemy[asyncio]==2.0.36"
python -m pip install "fastapi==0.115.6" "uvicorn[standard]==0.32.1"
python -m pip install "torch>=2.2.0,<3"
python -m pip install "sentence-transformers>=3.3.0,<6"
```

---

## 6. VS Code / Cursor Configuration Checklist

| Setting | Expected value | Status |
|---------|----------------|--------|
| `python.defaultInterpreterPath` | Global 3.12 or `backend/.venv/Scripts/python.exe` | **Set** in `.vscode/settings.json` |
| `python.analysis.extraPaths` | `${workspaceFolder}/backend` | **Set** |
| `basedpyright.analysis.extraPaths` | `${workspaceFolder}/backend` | **Set** |
| `python.envFile` | `${workspaceFolder}/backend/.env` | **Set** |
| `backend/pyrightconfig.json` | Present | **Created** |
| Root `pyrightconfig.json` | Present | **Created** |

---

## 7. pytest-asyncio Warning (non-blocking)

When running tests you may see:

```text
PytestDeprecationWarning: asyncio_default_fixture_loop_scope is unset
```

**Fix (optional, `backend/pytest.ini`):**

```ini
[pytest]
asyncio_default_fixture_loop_scope = function
```

This is unrelated to import resolution; packages are fine.

---

## 8. Verification Commands

After reloading Cursor:

```powershell
cd "D:\FYP UNI\FYP-Relevancy-checker\backend"

# Runtime
python -c "import sqlalchemy; from sentence_transformers import SentenceTransformer; print('OK')"

# Tests
python -m pytest tests/test_semantic_embeddings_prereq.py tests/test_relevancy_engine.py -q

# Package pins match requirements.txt
python -m pip check
```

**Expected:** no import errors in terminal; IDE squiggles on `sqlalchemy` / `sentence_transformers` disappear after interpreter reload.

---

## 9. Summary Table

| Item | Result |
|------|--------|
| Active interpreter | `Python312\python.exe` 3.12.0 |
| sqlalchemy | Installed 2.0.36 — import OK |
| sentence-transformers | Installed 5.5.1 — import OK |
| torch | Installed 2.12.0 — import OK |
| transformers | Installed 5.9.0 — import OK |
| fastapi | Installed 0.115.6 — import OK |
| uvicorn | Installed 0.32.1 — import OK |
| Missing packages | **None** |
| Application code changed | **No** |
| Workspace config added | **Yes** — fixes IDE warnings |

---

*End of diagnostic report.*
