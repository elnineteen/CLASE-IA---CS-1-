# SPIN_REVO 1.0 - Bot de Publicación Masiva en Revolico

Sistema 100% automático que lee productos desde Excel y los publica en Revolico.com sin intervención humana.

## 🚀 Instalación

### Instalación automática (recomendada)
```bash
./install.sh
```

### Instalación manual

1. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

2. **Instalar Playwright**
```bash
playwright install
```

### 3. Configurar credenciales
Editar `config.json` con tus credenciales de Revolico:
```json
{
  "delay_min": 8,
  "delay_max": 15,
  "max_posts_per_hour": 10,
  "revolico_login": {
    "email": "tu_email@ejemplo.com",
    "password": "tu_password"
  }
}
```

### 4. Preparar datos de productos
Crear o editar `excel_data.xlsx` con tus productos. Puedes generar un archivo de ejemplo:
```bash
python main.py --create-sample
```

## 📋 Estructura del Excel

El archivo Excel debe contener las siguientes columnas:
- `titulo`: Título del anuncio
- `descripcion`: Descripción del producto
- `precio`: Precio numérico
- `moneda`: USD, EUR o CUP
- `categoria`: Categoría principal (Tecnología, Carros, Casa, etc.)
- `subcategoria`: Subcategoría específica
- `provincia`: Provincia de ubicación
- `municipio`: Municipio de ubicación
- `telefono`: Número de teléfono
- `email`: Email de contacto (opcional)
- `imagen1`, `imagen2`, `imagen3`: Rutas a imágenes (opcional)

## 🎯 Uso

### Modo debug (con interfaz visual)
```bash
python main.py
```

### Modo producción (headless)
```bash
python main.py --headless
```

### Crear archivo de ejemplo
```bash
python main.py --create-sample
```

### Opciones adicionales
```bash
python main.py --help
```

## 📁 Estructura del proyecto

```
SPIN_REVO/
├── main.py              # Punto de entrada principal
├── utils.py             # Funciones auxiliares
├── config.json          # Configuración
├── requirements.txt     # Dependencias
├── excel_data.xlsx      # Base de datos de productos
├── excel_data.csv       # Versión CSV de respaldo
├── cookies.json         # Sesión guardada (auto-generado)
├── logs/
│   └── publicaciones.log
└── README.md
```

## ⚙️ Configuración

### Anti-ban features
- Delays aleatorios entre publicaciones (8-15 segundos por defecto)
- Límite de publicaciones por hora (10 por defecto)
- Simulación de comportamiento humano (scroll, movimiento de mouse)
- Text spinning básico para evitar contenido duplicado
- Rotación de User-Agent

### Logging
- Logs detallados en `logs/publicaciones.log`
- Formato: `[2025-01-08 18:32] ✔ Publicado: (Titulo) | ID (Url)`
- Rotación automática de logs

## 🔧 Solución de problemas

### Error "Module not found"
```bash
pip install -r requirements.txt
playwright install
```

### Error de login
- Verificar credenciales en `config.json`
- Intentar login manual en el navegador
- Eliminar `cookies.json` para forzar nuevo login

### Error de Excel
Si no tienes Excel disponible, puedes usar el archivo CSV:
```bash
# Convertir CSV a Excel (opcional)
python -c "import pandas as pd; pd.read_csv('excel_data.csv').to_excel('excel_data.xlsx', index=False)"
```

## 📝 Notas importantes

1. **Primera ejecución**: Ejecutar sin `--headless` para ver el proceso
2. **Credenciales**: Actualizar `config.json` antes del primer uso
3. **Imágenes**: Las rutas de imágenes deben ser relativas al directorio del proyecto
4. **Rate limiting**: Respeta los límites configurados para evitar bloqueos
5. **Captcha**: Si aparece captcha, el script pausará y guardará screenshot

## 🎯 Comandos principales

```bash
# Instalación completa
pip install -r requirements.txt
playwright install

# Crear datos de ejemplo
python main.py --create-sample

# Ejecutar en modo debug
python main.py

# Ejecutar en modo producción
python main.py --headless
```

## 📊 Logs y métricas

Los logs se guardan en `logs/publicaciones.log` con formato:
```
[2025-01-08 18:32] INFO Publicado: iPhone 13 Pro Max 256GB | ID 123456 (https://revolico.com/anuncio/123456)
```

## 🔄 Futuras mejoras

- [ ] Rotación de múltiples cuentas
- [ ] Integración con proxy/VPN
- [ ] Resolución automática de captcha
- [ ] Dashboard web para métricas
- [ ] Integración con bases de datos