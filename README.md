# Revolico Automation App

Una aplicación de automatización para buscar productos en Revolico.cu de forma automática y recibir notificaciones cuando se encuentren productos que coincidan con tus criterios.

## 🚀 Características

- **Búsqueda automática**: Busca productos en Revolico según términos configurables
- **Filtros inteligentes**: Filtra por precio, ubicación, palabras clave
- **Notificaciones por email**: Recibe alertas cuando se encuentren nuevos productos
- **Monitoreo continuo**: Ejecuta búsquedas periódicas automáticamente
- **Evita duplicados**: No te notifica del mismo producto dos veces
- **Logging completo**: Registra todas las actividades en archivos de log
- **Configuración flexible**: Personaliza todos los parámetros desde un archivo JSON

## 📋 Requisitos

- Python 3.7 o superior
- Conexión a internet
- Cuenta de email (opcional, para notificaciones)

## 🛠️ Instalación

1. **Clona o descarga los archivos**:
   ```bash
   git clone <este-repositorio>
   cd revolico-automation
   ```

2. **Instala las dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configura la aplicación**:
   Edita el archivo `config.json` con tus preferencias.

## ⚙️ Configuración

Edita el archivo `config.json` para personalizar tu búsqueda:

```json
{
  "search_terms": ["iphone", "laptop", "auto"],
  "max_price": 2000,
  "min_price": 50,
  "locations": ["havana", "matanzas"],
  "categories": ["electronica", "celulares"],
  "check_interval": 300,
  "notifications": {
    "email": {
      "enabled": true,
      "smtp_server": "smtp.gmail.com",
      "smtp_port": 587,
      "username": "tu_email@gmail.com",
      "password": "tu_contraseña_de_app",
      "to_email": "destinatario@gmail.com"
    }
  },
  "filters": {
    "exclude_keywords": ["dañado", "roto"],
    "require_keywords": ["original"]
  }
}
```

### Configuración de Email (Opcional)

Para recibir notificaciones por email:

1. **Gmail**: 
   - Habilita la autenticación de 2 factores
   - Genera una "contraseña de aplicación"
   - Usa esa contraseña en el campo `password`

2. **Otros proveedores**:
   - Configura el servidor SMTP correspondiente

## 🚀 Uso

### Búsqueda única

Ejecuta una búsqueda una sola vez:

```bash
python revolico_automation.py --mode search
```

### Monitoreo continuo

Ejecuta búsquedas automáticas cada cierto tiempo:

```bash
python revolico_automation.py --mode monitor
```

### Opciones adicionales

```bash
# Usar archivo de configuración personalizado
python revolico_automation.py --config mi_config.json

# Guardar resultados en archivo específico
python revolico_automation.py --mode search --output mis_resultados.json

# Ver ayuda completa
python revolico_automation.py --help
```

## 📝 Ejemplos de Uso en la Vida Real

### 1. Buscar un iPhone específico

Configura `config.json`:
```json
{
  "search_terms": ["iphone 12", "iphone 13"],
  "max_price": 800,
  "min_price": 400,
  "check_interval": 600,
  "notifications": {
    "email": {
      "enabled": true,
      "username": "tu_email@gmail.com",
      "password": "tu_contraseña",
      "to_email": "tu_email@gmail.com"
    }
  }
}
```

Ejecuta:
```bash
python revolico_automation.py --mode monitor
```

### 2. Monitorear autos en La Habana

```json
{
  "search_terms": ["hyundai", "toyota", "chevrolet"],
  "max_price": 15000,
  "locations": ["havana"],
  "categories": ["autos"],
  "filters": {
    "exclude_keywords": ["accidentado", "chocado"]
  }
}
```

### 3. Buscar laptops para trabajo

```json
{
  "search_terms": ["laptop", "macbook", "thinkpad"],
  "max_price": 1200,
  "min_price": 300,
  "filters": {
    "require_keywords": ["intel", "ssd"],
    "exclude_keywords": ["dañado", "lento"]
  }
}
```

## 📊 Archivos de Salida

La aplicación genera varios archivos:

- **`revolico_results_YYYYMMDD_HHMMSS.json`**: Resultados de búsqueda con detalles completos
- **`revolico_automation.log`**: Log de todas las actividades
- **`config.json`**: Tu configuración personalizada

## 🔧 Personalización Avanzada

### Filtros de Contenido

```json
{
  "filters": {
    "exclude_keywords": ["dañado", "roto", "repuesto"],
    "require_keywords": ["original", "nuevo", "garantía"]
  }
}
```

### Intervalos de Búsqueda

```json
{
  "check_interval": 900  // 15 minutos
}
```

### Múltiples Categorías

```json
{
  "categories": ["electronica", "celulares", "computadoras"]
}
```

## 🚨 Consideraciones Importantes

1. **Uso Responsable**: No abuses del sitio web con intervalos muy cortos
2. **Respeta los Términos**: Asegúrate de cumplir con los términos de uso de Revolico
3. **Privacidad**: Mantén seguras tus credenciales de email
4. **Conexión**: Asegúrate de tener una conexión estable a internet

## 🛡️ Solución de Problemas

### Error de conexión
```bash
# Verifica tu conexión a internet
ping google.com

# Verifica que Revolico esté disponible
curl -I https://www.revolico.com
```

### No recibo emails
1. Verifica las credenciales en `config.json`
2. Asegúrate de usar una "contraseña de aplicación" para Gmail
3. Revisa la carpeta de spam

### No encuentra productos
1. Amplía los términos de búsqueda
2. Aumenta el rango de precios
3. Reduce los filtros restrictivos

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de:
- Reportar bugs
- Sugerir nuevas características
- Mejorar la documentación
- Enviar pull requests

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## ⚠️ Descargo de Responsabilidad

Esta herramienta es para uso educativo y personal. Los usuarios son responsables de cumplir con los términos de servicio de Revolico.cu y las leyes aplicables.
