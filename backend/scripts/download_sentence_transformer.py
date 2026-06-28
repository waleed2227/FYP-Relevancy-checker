"""
Download and verify the configured Sentence Transformer model for offline use.

Run from backend/:
    python -m scripts.download_sentence_transformer

If Hugging Face returns HTTP 429 (rate limit):
    1. Create a free token at https://huggingface.co/settings/tokens
    2. Add to backend/.env:  HF_TOKEN=hf_xxxxxxxx
    3. Re-run this script

Optional cache override:
    set SENTENCE_TRANSFORMERS_HOME=D:\\path\\to\\cache
"""
from __future__ import annotations

import argparse
import importlib.util
import os
import sys
import time
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "bootstrap", Path(__file__).resolve().parent / "_bootstrap.py"
)
_bootstrap = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bootstrap)

from app.config.settings import get_settings

BACKEND_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LOCAL_DIR = BACKEND_ROOT / "models" / "all-MiniLM-L6-v2"


def _hf_token() -> str | None:
    for key in ("HF_TOKEN", "HUGGINGFACE_HUB_TOKEN", "HUGGING_FACE_HUB_TOKEN"):
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return None


def _cache_locations() -> list[str]:
    paths: list[str] = []
    for key in ("SENTENCE_TRANSFORMERS_HOME", "HF_HOME", "HUGGINGFACE_HUB_CACHE"):
        value = os.environ.get(key)
        if value:
            paths.append(f"{key}={value}")
    default_hf = Path.home() / ".cache" / "huggingface" / "hub"
    paths.append(f"default_hf_hub={default_hf}")
    if DEFAULT_LOCAL_DIR.is_dir():
        paths.append(f"project_local={DEFAULT_LOCAL_DIR}")
    return paths


def _is_rate_limit_error(exc: BaseException) -> bool:
    text = str(exc).lower()
    return "429" in text or "too many requests" in text


def _download_snapshot(repo_id: str, *, local_dir: Path | None, max_attempts: int) -> Path:
    from huggingface_hub import snapshot_download

    token = _hf_token()
    last_error: BaseException | None = None

    for attempt in range(1, max_attempts + 1):
        try:
            if local_dir is not None:
                local_dir.mkdir(parents=True, exist_ok=True)
                path = snapshot_download(
                    repo_id=repo_id,
                    local_dir=str(local_dir),
                    local_dir_use_symlinks=False,
                    token=token,
                )
            else:
                path = snapshot_download(
                    repo_id=repo_id,
                    token=token,
                    resume_download=True,
                )
            return Path(path)
        except Exception as exc:
            last_error = exc
            if _is_rate_limit_error(exc) and attempt < max_attempts:
                wait = min(120, 15 * (2 ** (attempt - 1)))
                print(
                    f"Rate limited by Hugging Face (429). "
                    f"Waiting {wait}s before retry {attempt + 1}/{max_attempts}..."
                )
                if not token:
                    print("Tip: set HF_TOKEN in backend/.env for higher rate limits.")
                time.sleep(wait)
                continue
            raise

    assert last_error is not None
    raise last_error


def _validate_model_dir(local_dir: Path) -> list[str]:
    """Return list of missing files for a usable SentenceTransformer local folder."""
    required = ("config.json", "modules.json")
    missing = [name for name in required if not (local_dir / name).is_file()]
    return missing


def _print_rate_limit_help() -> None:
    print("\nHugging Face rate limit (HTTP 429) — try one of these:")
    print("  1. Add HF_TOKEN to backend/.env (free: huggingface.co/settings/tokens)")
    print("  2. Log in with the new CLI:")
    print("       hf auth login")
    print("  3. Download to project folder (PowerShell, from backend/):")
    print("       hf download sentence-transformers/all-MiniLM-L6-v2 --local-dir models/all-MiniLM-L6-v2")
    print("  4. Verify offline:")
    print("       python -m scripts.download_sentence_transformer --local-dir-only")
    print("  5. If folder is empty or broken, remove it first:")
    print("       Remove-Item -Recurse -Force models\\all-MiniLM-L6-v2")


def _load_model(model_ref: str, device: str, *, local_files_only: bool):
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(
        model_ref,
        device=device,
        local_files_only=local_files_only,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Download Sentence Transformer model for offline use")
    parser.add_argument(
        "--local-dir",
        type=Path,
        default=DEFAULT_LOCAL_DIR,
        help=f"Also save model under this path (default: {DEFAULT_LOCAL_DIR})",
    )
    parser.add_argument(
        "--local-dir-only",
        action="store_true",
        help="Skip download; verify an existing --local-dir copy only",
    )
    parser.add_argument(
        "--max-attempts",
        type=int,
        default=5,
        help="Max download retries on HTTP 429 (default: 5)",
    )
    args = parser.parse_args()

    settings = get_settings()
    model_name = settings.sentence_transformer_model
    device = settings.sentence_transformer_device
    token = _hf_token()

    print("Sentence Transformer model download")
    print("-" * 40)
    print(f"Model:   {model_name}")
    print(f"Device:  {device}")
    print(f"HF token: {'set' if token else 'not set (recommended for 429 errors)'}")
    print("Cache locations:")
    for line in _cache_locations():
        print(f"  {line}")

    try:
        from sentence_transformers import SentenceTransformer  # noqa: F401
    except ImportError:
        print("\nFAIL: sentence-transformers is not installed.")
        print("Run: pip install -r requirements.txt")
        return 1

    cache_path: Path | None = None
    load_ref = model_name

    if args.local_dir_only:
        missing = _validate_model_dir(args.local_dir)
        if missing:
            print(f"\nFAIL: Incomplete model folder: {args.local_dir}")
            print(f"Missing: {', '.join(missing)}")
            print("The folder exists but has no model files (common after a failed download).")
            _print_rate_limit_help()
            return 1
        load_ref = str(args.local_dir)
        print(f"\n[skip download] Using existing local dir: {args.local_dir}")
    else:
        print("\n[1/3] Downloading model snapshot (network required)...")
        try:
            cache_path = _download_snapshot(
                model_name,
                local_dir=args.local_dir,
                max_attempts=args.max_attempts,
            )
            print(f"Hub cache path: {cache_path}")
            if args.local_dir.is_dir():
                print(f"Project copy:   {args.local_dir}")
                load_ref = str(args.local_dir)
        except Exception as exc:
            print(f"\nFAIL: Could not download model: {exc}")
            if _is_rate_limit_error(exc):
                _print_rate_limit_help()
            return 1

        print("\n[2/3] Loading downloaded model...")
        try:
            model = _load_model(load_ref, device, local_files_only=False)
        except Exception as exc:
            print(f"\nFAIL: Could not load model after download: {exc}")
            return 1

        dim = model.get_sentence_embedding_dimension()
        sample = model.encode(["offline verification probe"], normalize_embeddings=True)
        print(f"Download OK — embedding dimension: {dim}, sample shape: {sample.shape}")

    print("\n[3/3] Verifying offline load (local files only)...")
    prev_offline = os.environ.get("HF_HUB_OFFLINE")
    os.environ["HF_HUB_OFFLINE"] = "1"
    try:
        offline_model = _load_model(load_ref, device, local_files_only=True)
        offline_vec = offline_model.encode(["offline verification probe"], normalize_embeddings=True)
        dim = offline_model.get_sentence_embedding_dimension()
    except Exception as exc:
        print(f"\nFAIL: Offline verification failed: {exc}")
        print("Ensure the download completed and cache paths above are writable.")
        return 1
    finally:
        if prev_offline is None:
            os.environ.pop("HF_HUB_OFFLINE", None)
        else:
            os.environ["HF_HUB_OFFLINE"] = prev_offline

    if offline_vec.shape[-1] != dim:
        print("\nFAIL: Offline model embedding dimension mismatch.")
        return 1

    print("Offline verification OK — model loads from local cache without network.")
    print("\nNext steps:")
    print("  1. Keep RELEVANCY_ENGINE_V2_ENABLED=false until engine integration is complete.")
    print("  2. Re-run this script after dependency or model updates.")
    if cache_path:
        print(f"  3. Cached at: {cache_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
