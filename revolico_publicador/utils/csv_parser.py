from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

import pandas as pd

REQUIRED_COLUMNS: List[str] = [
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
    "Publicado",
    "Link",
]


@dataclass(frozen=True)
class SchemaValidationError(Exception):
    missing_columns: List[str]

    def __str__(self) -> str:  # pragma: no cover - simple formatting
        return f"Faltan columnas obligatorias: {', '.join(self.missing_columns)}"


def cargar_anuncios(path: str | Path) -> pd.DataFrame:
    """Carga el Excel de anuncios y valida el esquema.

    Args:
        path: Ruta al archivo .xlsx.

    Returns:
        DataFrame con las columnas esperadas.

    Raises:
        SchemaValidationError: Si faltan columnas requeridas.
    """
    excel_path = Path(path)
    if not excel_path.exists():
        raise FileNotFoundError(f"No existe el archivo: {excel_path}")

    df = pd.read_excel(excel_path, engine="openpyxl")

    # Normalizar encabezados (sin tildes ya provistas por requerimiento)
    df.columns = [str(c).strip() for c in df.columns]

    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise SchemaValidationError(missing_columns=missing)

    return df


def particionar(df: pd.DataFrame, tamano: int = 100) -> List[pd.DataFrame]:
    """Divide el DataFrame en bloques del tamaño indicado.

    Args:
        df: DataFrame completo.
        tamano: Tamaño del lote.

    Returns:
        Lista de DataFrames.
    """
    if tamano <= 0:
        raise ValueError("El tamaño de partición debe ser > 0")

    num_rows = len(df)
    return [df.iloc[i : i + tamano].copy() for i in range(0, num_rows, tamano)]


def marcar_publicado(df: pd.DataFrame, idx: int) -> None:
    """Marca una fila como publicada (L = "S").

    Args:
        df: DataFrame sobre el que se actualiza.
        idx: Índice de la fila en el DataFrame original.
    """
    if "Publicado" not in df.columns:
        raise ValueError("La columna 'Publicado' no existe en el DataFrame")

    df.loc[idx, "Publicado"] = "S"


def guardar(df: pd.DataFrame, path: str | Path) -> None:
    """Guarda el DataFrame al archivo Excel.

    Se preserva el orden de columnas del DataFrame en memoria.
    """
    out_path = Path(path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_excel(out_path, index=False, engine="openpyxl")