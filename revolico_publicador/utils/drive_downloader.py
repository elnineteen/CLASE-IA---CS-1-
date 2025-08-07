from __future__ import annotations

import hashlib
import random
import time
from pathlib import Path
from typing import Optional

import requests

# Optional gdown import. If not available, we fall back to requests
try:  # pragma: no cover - best effort
    import gdown  # type: ignore
except Exception:  # pragma: no cover
    gdown = None

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (hard limit)
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_RETRIES = 3


def _sha1_of_file(path: Path) -> str:
    sha1 = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha1.update(chunk)
    return sha1.hexdigest()


def _safe_filename_from_headers(url: str, response: requests.Response) -> str:
    # Try to parse filename from Content-Disposition; fallback to URL id
    cd = response.headers.get("content-disposition") or response.headers.get(
        "Content-Disposition"
    )
    if cd and "filename=" in cd:
        filename = cd.split("filename=")[-1].strip("\";")
        return filename
    # Fallback: last part of URL or a generic name
    tail = url.rstrip("/").split("/")[-1]
    if tail:
        return tail
    return f"download_{int(time.time())}.bin"


def _requests_download(url: str, dest_path: Path, timeout: int) -> Path:
    with requests.get(url, stream=True, allow_redirects=True, timeout=timeout) as r:
        r.raise_for_status()
        # Determine filename if not provided
        filename = _safe_filename_from_headers(url, r)
        final_path = dest_path / filename
        with final_path.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        return final_path


def _gdown_download(url: str, dest_path: Path, timeout: int) -> Optional[Path]:  # pragma: no cover - external
    if gdown is None:
        return None
    dest_path.mkdir(parents=True, exist_ok=True)
    # gdown can take Google Drive links directly
    out = dest_path / f"gdown_{int(time.time())}.bin"
    try:
        gdown.download(url=url, output=str(out), quiet=True)
        if out.exists() and out.stat().st_size > 0:
            return out
        return None
    except Exception:
        return None


def _exponential_backoff(retry_index: int) -> None:
    # jitter 0.5-1.5x around 2^retry seconds, capped lightly
    base = min(2 ** retry_index, 8)
    sleep_s = base * random.uniform(0.5, 1.5)
    time.sleep(sleep_s)


def descargar(url: str, carpeta_destino: str | Path, *, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> Path:
    """Descarga un archivo desde URL (Drive o http), con reintentos y límites.

    - Soporta redirecciones 302 y content-disposition.
    - 3 intentos exponenciales, timeout configurable (30 s por defecto).
    - Fallback a gdown si está disponible.
    - Devuelve ruta local; borra archivos > 10 MB automáticamente.
    """
    if not url or not isinstance(url, str):
        raise ValueError("URL inválida para descarga")

    dest_dir = Path(carpeta_destino)
    dest_dir.mkdir(parents=True, exist_ok=True)

    last_error: Optional[Exception] = None
    for attempt in range(DEFAULT_MAX_RETRIES):
        try:
            # Primary: requests
            path = _requests_download(url, dest_dir, timeout=timeout)

            # Size limit check
            try:
                if path.stat().st_size > MAX_FILE_SIZE_BYTES:
                    path.unlink(missing_ok=True)
                    raise ValueError("Archivo excede el límite de 10 MB")
            except FileNotFoundError:
                pass

            # Compute SHA-1 (optional auditing - not returned, but we could log it)
            _ = _sha1_of_file(path)
            return path
        except Exception as exc:
            last_error = exc
            # Fallback to gdown only for Google Drive URLs or after failures
            if attempt == DEFAULT_MAX_RETRIES - 1:
                alt = _gdown_download(url, dest_dir, timeout)
                if alt is not None:
                    try:
                        if alt.stat().st_size > MAX_FILE_SIZE_BYTES:
                            alt.unlink(missing_ok=True)
                            raise ValueError("Archivo excede el límite de 10 MB")
                        _ = _sha1_of_file(alt)
                        return alt
                    except Exception as e2:
                        last_error = e2
            if attempt < DEFAULT_MAX_RETRIES - 1:
                _exponential_backoff(attempt)
    assert last_error is not None
    raise last_error