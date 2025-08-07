from __future__ import annotations

import argparse
import logging
import os
import signal
import sys
import time
import random
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from colorama import Fore, Style, init as colorama_init
from dotenv import load_dotenv
from tqdm import tqdm

from utils.csv_parser import cargar_anuncios, guardar, marcar_publicado, particionar
from utils.drive_downloader import descargar
from utils.publicador import CaptchaDetected, Publicador

# Init colorama for Windows compatibility
colorama_init(autoreset=True)

# Logging setup
LOGS_DIR = Path(__file__).parent / "logs"
LOGS_DIR.mkdir(parents=True, exist_ok=True)
ERROR_LOG_PATH = LOGS_DIR / "errores.log"
PUBLISHED_LOG_PATH = LOGS_DIR / f"published_{datetime.now():%Y%m%d}.log"

LOGGER = logging.getLogger("revolico_publicador")
LOGGER.setLevel(logging.DEBUG)

_formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M")

_console = logging.StreamHandler(sys.stdout)
_console.setLevel(logging.INFO)
_console.setFormatter(_formatter)

_err_file = logging.FileHandler(ERROR_LOG_PATH, encoding="utf-8")
_err_file.setLevel(logging.WARNING)
_err_file.setFormatter(_formatter)

_published_file = logging.FileHandler(PUBLISHED_LOG_PATH, encoding="utf-8")
_published_file.setLevel(logging.INFO)
_published_file.setFormatter(_formatter)

class _PublishedOnlyFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:  # pragma: no cover - simple filter
        try:
            return str(record.getMessage()).startswith("Publicado:")
        except Exception:
            return False

_published_file.addFilter(_PublishedOnlyFilter())

LOGGER.addHandler(_console)
LOGGER.addHandler(_err_file)
LOGGER.addHandler(_published_file)

# Graceful shutdown flag
_SHOULD_STOP = False


def _signal_handler(signum: int, frame) -> None:  # type: ignore[no-untyped-def]
    global _SHOULD_STOP
    LOGGER.warning("Interrupción recibida (Ctrl-C). Guardando progreso y saliendo...")
    _SHOULD_STOP = True


signal.signal(signal.SIGINT, _signal_handler)


def _sleep_controls(index_in_batch: int) -> None:
    # 60s cada 20 anuncios
    if index_in_batch > 0 and index_in_batch % 20 == 0:
        LOGGER.info("Pausa anti-bloqueo: 60s")
        time.sleep(60)


def _download_image_if_needed(url: str, images_dir: Path) -> Path | None:
    try:
        return descargar(url, images_dir)
    except Exception as e:  # noqa: BLE001
        LOGGER.warning(f"Fallo al descargar imagen: {e}")
        return None


def _build_anuncio_dict(row: Dict[str, object]) -> Dict[str, object]:
    keys = [
        "Categoria",
        "Subcategoria",
        "Fotos",
        "Precio",
        "Moneda",
        "Titulo",
        "Descripcion",
        "Provincia",
        "Municipio",
        "Telefono",
        "Email",
    ]
    return {k: row.get(k) for k in keys}


def process_lote(df_lote, df_total, images_dir: Path, publicador: Publicador) -> None:
    df_lote = df_lote.copy()
    for i, (idx, row) in enumerate(tqdm(df_lote.iterrows(), total=len(df_lote), desc="Publicando")):
        if _SHOULD_STOP:
            break
        if str(row.get("Publicado", "")).upper() == "S":
            continue
        try:
            anuncio = _build_anuncio_dict(row.to_dict())

            # Descargar imagen si hay URL
            foto_url = str(row.get("Fotos", "") or "").strip()
            local_image: Path | None = None
            if foto_url:
                local_image = _download_image_if_needed(foto_url, images_dir)
                if local_image is not None:
                    anuncio["Fotos"] = str(local_image)
                else:
                    anuncio["Fotos"] = None

            # Publicar con captcha handling
            while True:
                try:
                    ok = publicador.publicar(anuncio)
                    if ok:
                        titulo = str(row.get("Titulo", "")).strip()
                        LOGGER.info(f"Publicado: {titulo}")
                        marcar_publicado(df_total, idx)
                        break
                    else:
                        raise RuntimeError("El formulario reportó error de validación o estado desconocido")
                except CaptchaDetected:
                    LOGGER.warning("CAPTCHA DETECTADO – PAUSADO")
                    input("Resuelve el captcha en el navegador abierto y pulsa Enter para reintentar...")
                    continue

            # Sleep aleatorio 3-7s entre cada anuncio
            time.sleep(random.uniform(publicador.config.delay_min, publicador.config.delay_max))
            _sleep_controls(i + 1)
        except Exception as e:  # noqa: BLE001
            titulo = str(row.get("Titulo", "")).strip()
            LOGGER.warning(f"Error en fila idx={idx} título='{titulo}': {e}")
            continue


def main() -> int:
    load_dotenv()

    parser = argparse.ArgumentParser(description="Revolico Publicador 1000x – PRD")
    parser.add_argument("--lote", type=int, default=100, help="Tamaño del lote a procesar")
    parser.add_argument("--headless", type=str, default="false", help="Ejecutar en modo headless (true/false)")
    parser.add_argument("--delay-min", type=int, default=3, help="Delay mínimo entre anuncios (s)")
    parser.add_argument("--delay-max", type=int, default=7, help="Delay máximo entre anuncios (s)")
    parser.add_argument("--excel", type=str, default=str(Path(__file__).parent / "anuncios.xlsx"), help="Ruta al Excel de anuncios")

    args = parser.parse_args()
    headless = str(args.headless).strip().lower() in {"true", "1", "yes"}

    excel_path = Path(args.excel)
    images_dir = Path(os.getenv("IMAGES_DIR", Path(__file__).parent / "data/imagenes"))

    df = cargar_anuncios(excel_path)

    # Filtrar donde Publicado = 'N'
    mask_no = df["Publicado"].astype(str).str.upper().ne("S")
    pendientes = df[mask_no]

    if len(pendientes) == 0:
        LOGGER.info("No hay anuncios pendientes de publicar.")
        return 0

    lotes = particionar(pendientes, tamano=args.lote)

    form_url = os.getenv("REVOLICO_FORM_URL", "https://www.revolico.com/publicar")
    publicador = Publicador(headless=headless, delay_min=args.delay_min, delay_max=args.delay_max, base_url=form_url)

    exit_code = 0
    try:
        for lote_idx, df_lote in enumerate(lotes, start=1):
            if _SHOULD_STOP:
                break
            LOGGER.info(Fore.CYAN + Style.BRIGHT + f"Procesando lote {lote_idx}/{len(lotes)} (size={len(df_lote)})")
            process_lote(df_lote, df, images_dir, publicador)
            guardar(df, excel_path)
            LOGGER.info(Fore.GREEN + Style.BRIGHT + f"Progreso guardado tras lote {lote_idx}")
    except Exception as e:  # noqa: BLE001
        LOGGER.exception(f"Fallo inesperado: {e}")
        exit_code = 1
    finally:
        try:
            publicador.cerrar()
        except Exception:
            pass
        # Limpiar caché de imágenes
        try:
            for p in images_dir.glob("*"):
                if p.is_file():
                    p.unlink(missing_ok=True)
            LOGGER.info("Caché de imágenes limpiada")
        except Exception:
            LOGGER.warning("No se pudo limpiar la caché de imágenes")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())