## Revolico Publicador 1000x – PRD

Bot industrial para publicar hasta 1 000 anuncios diarios en Revolico a partir de un Excel maestro. Arquitectura modular, extensible, con logging y manejo de captchas.

### Requisitos
- Python 3.10+
- Chromium (instalado vía Playwright)
- Conexión a internet

### Instalación
1. Clonar el repositorio
   ```bash
git clone <TU_REPO_URL>
cd revolico_publicador
```
2. Crear entorno virtual y activarlo
   ```bash
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# Linux/MacOS
source .venv/bin/activate
```
3. Instalar dependencias
   ```bash
pip install -r requirements.txt
playwright install chromium
```
4. Colocar `anuncios.xlsx` en la raíz del proyecto con el esquema indicado abajo.

### Uso
```bash
python main.py --lote 100 --headless false
```
Opciones:
- `--lote` tamaño del lote por ciclo (default 100)
- `--headless` ejecutar navegador en modo headless (true/false)
- `--delay-min` y `--delay-max` segundos de espera aleatoria entre publicaciones (default 3..7)

### Esquema del Excel (sin tildes)
Columnas esperadas (en orden):
A Categoria | B Subcategoria | C Fotos | D Precio | E Moneda | F Titulo | G Descripcion | H Provincia | I Municipio | J Telefono | K Email | L Publicado | M Link

- `Fotos`: URL de Google Drive en formato `https://drive.google.com/uc?id=FILE_ID`
- `Publicado`: "S" o "N"

### Carpetas
```
revolico_publicador/
├── main.py
├── anuncios.xlsx
├── requirements.txt
├── .env.example
├── logs/
│   ├── errores.log
│   └── published_YYYYMMDD.log
├── data/
│   └── imagenes/
└── utils/
    ├── csv_parser.py
    ├── drive_downloader.py
    └── publicador.py
```

### Logging
- Consola: nivel INFO+
- Archivo `logs/errores.log`: nivel WARNING+
- Archivo por día `logs/published_YYYYMMDD.log` con títulos publicados

### CAPTCHA
Si se detecta un CAPTCHA, el proceso se pausa manteniendo el navegador abierto y solicita intervención humana. Tras resolver el CAPTCHA, pulse Enter para reintentar la misma fila.

### Pruebas
- Ejecutar `pytest` para correr tests unitarios (si agregas tests en `tests/`).
- Smoke test: ejecutar un anuncio de prueba en modo manual.

### FAQ
- ¿Funciona en Windows 8?
  - Sí. Se usa Playwright 1.44.0 con Chromium y dependencias compatibles.
- ¿Por qué algunas imágenes se borran de `data/imagenes`?
  - Se elimina automáticamente cualquier imagen >10 MB (Revolico limita ~5 MB).
- ¿Se puede ejecutar en un VPS?
  - Sí. Está preparado para futuro modo headless y proxy-pool.

### Licencia
Uso interno. Ajusta según tus necesidades.