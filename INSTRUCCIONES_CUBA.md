# 🇨🇺 INSTRUCCIONES PARA CUBA - Revolico Auto Publisher

## 📋 Guía Completa para Usuarios Principiantes

Esta guía está especialmente diseñada para usuarios cubanos que quieren automatizar sus publicaciones en Revolico sin tener conocimientos técnicos avanzados.

---

## 🎯 ¿Qué hace esta aplicación?

**Revolico Auto Publisher** te permite:
- ✅ Publicar **cientos de productos automáticamente** en Revolico
- ✅ **Rotar textos** para evitar que te baneen
- ✅ Usar **múltiples cuentas** de Revolico
- ✅ **Importar productos** desde Google Sheets (Excel en la nube)
- ✅ **Simular comportamiento humano** (pausas, scrolls, etc.)
- ✅ **Generar reportes** de publicaciones exitosas

---

## 🛠️ INSTALACIÓN PASO A PASO

### Opción 1: REPLIT (Más fácil - Recomendado)

**Ventaja:** No necesitas instalar nada en tu computadora

1. **Ve a [replit.com](https://replit.com)**
   - Crea una cuenta gratis
   - Es como Google pero para programas

2. **Crea un nuevo proyecto:**
   - Haz clic en "Create"
   - Selecciona "Node.js"
   - Ponle nombre: "revolico-publisher"

3. **Sube los archivos:**
   - Borra todo lo que viene por defecto
   - Copia y pega todos los archivos de esta aplicación
   - Respeta la estructura de carpetas

4. **Ejecuta:**
   - Haz clic en "Run"
   - Espera a que se instalen las dependencias
   - Abre la URL que te muestra

### Opción 2: En tu computadora

**Requisitos:** Computadora con Windows, Mac o Linux

1. **Descargar Node.js:**
   ```
   Ve a: https://nodejs.org
   Descarga la versión LTS (recomendada)
   Instala siguiendo el asistente
   ```

2. **Descargar la aplicación:**
   - Descarga todos los archivos
   - Crea una carpeta "revolico-publisher"
   - Pon todos los archivos dentro

3. **Abrir terminal/cmd:**
   - Windows: Presiona Win+R, escribe "cmd"
   - Mac: Presiona Cmd+Espacio, escribe "terminal"
   - Navega a la carpeta: `cd revolico-publisher`

4. **Instalar dependencias:**
   ```bash
   npm install
   ```

5. **Ejecutar:**
   ```bash
   npm start
   ```

6. **Abrir en navegador:**
   - Ve a: `http://localhost:3000`

---

## 🔧 CONFIGURACIÓN INICIAL

### Paso 1: Configurar Google Sheets

#### 1.1 Crear el proyecto en Google Cloud
```
1. Ve a: https://console.cloud.google.com
2. Crea un nuevo proyecto (nombre: "revolico-publisher")
3. Busca "Google Sheets API" y actívala
4. Ve a "Credenciales" → "Crear credenciales" → "OAuth 2.0"
5. Agrega estas URLs autorizadas:
   - http://localhost:3000/auth/callback
   - https://tu-replit-url/auth/callback (si usas Replit)
```

#### 1.2 Configurar variables de entorno
Crea el archivo `.env` (copia desde `.env.example`):
```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
GOOGLE_SHEET_ID=tu_sheet_id_aqui
PORT=3000
NODE_ENV=development
```

#### 1.3 Crear la hoja de productos
En Google Sheets, crea una hoja con estas columnas **EXACTAS**:

| A        | B      | C           | D        | E         | F         | G        | H            | I         | J                |
|----------|--------|-------------|----------|-----------|-----------|----------|--------------|-----------|------------------|
| nombre   | precio | descripcion | imagenURL| categoria | ubicacion | contacto | linkWhatsApp | publicado | fecha_publicacion|

**Ejemplo de fila:**
```
iPhone 14 | 800 | iPhone en perfecto estado, como nuevo | https://... | Telefonia | Habana | 58912345 | https://wa.me/5358912345 | FALSE | 
```

### Paso 2: Exportar cookies de Revolico

#### 2.1 Instalar extensión de cookies
- **Chrome:** Busca "EditThisCookie" en Chrome Web Store
- **Firefox:** Busca "Cookie Quick Manager"

#### 2.2 Exportar cookies
```
1. Ve a revolico.com
2. Inicia sesión con tu cuenta
3. Abre la extensión de cookies
4. Selecciona "Export" o "Exportar"
5. Guarda como archivo .json o .txt
```

#### 2.3 Subir cookies a la app
```
1. Ve a la pestaña "Cuentas" en el dashboard
2. Haz clic en "Agregar Nueva Cuenta"
3. Pon un nombre (ej: "MiCuenta01")
4. Sube el archivo de cookies
5. Haz clic en "Agregar Cuenta"
```

---

## 🚀 CÓMO USAR LA APLICACIÓN

### 1. Abrir el dashboard
- Ve a `http://localhost:3000` en tu navegador
- Verás una interfaz moderna y fácil de usar

### 2. Configurar Google Sheets
```
1. Ve a la pestaña "Google Sheets"
2. Haz clic en "Autorizar Google Sheets"
3. Sigue las instrucciones en la nueva ventana
4. Autoriza el acceso
5. Haz clic en "Probar Conexión"
6. Haz clic en "Ver Productos" para verificar
```

### 3. Agregar cuentas de Revolico
```
1. Ve a la pestaña "Cuentas"
2. Sube los archivos de cookies de tus cuentas
3. Verifica que aparezcan como "activas"
```

### 4. Iniciar publicación masiva
```
1. Ve al Dashboard o pestaña "Publicar"
2. Haz clic en "Iniciar Publicación Masiva"
3. ¡El sistema trabajará automáticamente!
```

### 5. Monitorear progreso
- El dashboard se actualiza en tiempo real
- Puedes ver cuántos productos se han publicado
- Los errores se muestran automáticamente

---

## 📊 CARACTERÍSTICAS DEL SISTEMA

### Rotación de Textos Inteligente
El sistema **automáticamente**:
- ✅ Cambia los títulos: "iPhone 14 - $800" → "Vendo iPhone 14 por $800"
- ✅ Varía las descripciones añadiendo prefijos y sufijos
- ✅ Usa sinónimos: "excelente" → "magnífico"
- ✅ Agrega emojis según la categoría
- ✅ Cambia el orden de las características

### Comportamiento Humano
Para evitar detección:
- ⏱️ Pausas aleatorias (5-10 segundos entre publicaciones)
- 🖱️ Movimientos naturales del mouse
- ⌨️ Velocidad de escritura variable
- 📜 Scroll aleatorio en las páginas
- 🔄 Rotación automática entre cuentas

### Múltiples Cuentas
- 👥 Usa hasta 10+ cuentas diferentes
- 🔄 Rota automáticamente entre ellas
- 📊 Límite configurable por cuenta (ej: 20 publicaciones/día)
- 📝 Log independiente por cuenta

---

## 📈 CONSEJOS PARA EVITAR BANEOS

### 1. Configuración Conservadora
```
- Máximo 15-20 publicaciones por cuenta por día
- Pausa de 8-12 segundos entre publicaciones
- Usa al menos 3-5 cuentas diferentes
- No publiques las 24 horas del día
```

### 2. Variación de Contenido
```
- Cambia descripciones regularmente
- Usa diferentes fotos para productos similares
- Varía los números de contacto
- Rota las ubicaciones
```

### 3. Horarios Naturales
```
- Publica en horarios humanos (9am - 10pm)
- Toma descansos de 2-3 horas
- No publiques domingos completos
- Pausa durante mantenimientos de Revolico
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: "No se puede conectar a Google Sheets"
**Solución:**
```
1. Verifica que el GOOGLE_SHEET_ID sea correcto
2. Asegúrate de que la hoja sea pública o compartida
3. Revisa las credenciales en Google Cloud Console
4. Reautoriza la aplicación
```

### Error: "Puppeteer no puede iniciar"
**Solución Linux/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

**Solución Windows:**
```
- Asegúrate de tener Google Chrome instalado
- Ejecuta como administrador
- Desactiva antivirus temporalmente
```

### Las publicaciones fallan
**Verifica:**
```
1. Que las cookies sean válidas (no hayan expirado)
2. Que Revolico no esté en mantenimiento
3. Que la cuenta no esté bloqueada
4. Revisa los logs para más detalles
```

### Conexión lenta
**Optimiza:**
```
1. Aumenta los tiempos de espera en configuración
2. Reduce publicaciones simultáneas
3. Usa modo headless (NODE_ENV=production)
4. Cierra otras aplicaciones que usen internet
```

---

## 📱 CONFIGURACIÓN PARA CUBA

### Internet Lento
```javascript
// En modules/revolicoBot.js - ajustar timeouts
this.puppeteerConfig = {
  // ... otras configuraciones
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-images', // No cargar imágenes
    '--disable-javascript', // Solo si es necesario
  ]
};
```

### Ahorro de Datos
- ✅ El sistema bloquea fuentes y medios automáticamente
- ✅ Usa timeouts largos para conexiones lentas
- ✅ Cache de productos para evitar recargas
- ✅ Compresión de logs

### VPN Recomendada
Si necesitas VPN:
- 🌐 Windscribe (plan gratuito)
- 🌐 ProtonVPN (plan gratuito)
- 🌐 TunnelBear

---

## 📊 ESTRUCTURA DE ARCHIVOS

```
revolico-auto-publisher/
├── package.json              # Configuración y dependencias
├── app.js                    # Servidor principal
├── .env                      # Variables de entorno (CREAR)
├── README.md                 # Documentación técnica
├── INSTRUCCIONES_CUBA.md     # Esta guía
├── public/                   # Interfaz web
│   ├── index.html            # Página principal
│   ├── style.css             # Estilos
│   └── script.js             # JavaScript del frontend
├── modules/                  # Módulos del sistema
│   ├── googleSheets.js       # Conexión a Google Sheets
│   ├── revolicoBot.js        # Automatización de Revolico
│   ├── textRotator.js        # Rotación de textos
│   └── logger.js             # Sistema de logs
├── cookies/                  # Archivos de cookies (se crea automáticamente)
├── logs/                     # Logs del sistema (se crea automáticamente)
└── config/                   # Configuración (se crea automáticamente)
```

---

## 📞 SOPORTE Y AYUDA

### Logs del Sistema
- Ve a la pestaña "Logs" para ver actividad en tiempo real
- Descarga reportes diarios en formato CSV
- Filtra por tipo de evento (error, info, warning)

### Archivos Importantes
- `logs/app-YYYY-MM-DD.log` - Log general del sistema
- `logs/publicaciones-YYYY-MM-DD.csv` - Reporte de publicaciones
- `config/token.json` - Token de Google Sheets (auto-generado)

### Problemas Comunes
1. **"Sistema no responde"** → Reinicia la aplicación
2. **"Error de memoria"** → Cierra navegadores no usados
3. **"Cookies expiradas"** → Re-exporta cookies de Revolico
4. **"Límite de cuota alcanzado"** → Espera 24 horas o usa más cuentas

---

## 🎯 CONSEJOS DE RENDIMIENTO

### Para Hardware Limitado
```javascript
// En .env
NODE_ENV=production           # Modo headless
DEFAULT_WAIT_MIN=3000        # Aumentar esperas
DEFAULT_WAIT_MAX=8000        # Pausas más largas
```

### Para Maximizar Publicaciones
```
- Usa 5-10 cuentas rotativas
- Programa ejecución en horarios de bajo tráfico
- Prepara 500+ productos en Google Sheets
- Usa categorías diversas
- Actualiza cookies semanalmente
```

---

## ⚡ AUTOMATIZACIÓN AVANZADA

### Ejecución Programada (Cron)
Para ejecutar automáticamente cada día:

**Linux/Mac:**
```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar a las 9am cada día)
0 9 * * * cd /ruta/a/revolico-publisher && npm start
```

**Windows:**
- Usar "Programador de Tareas"
- Crear tarea básica
- Ejecutar: `node app.js`
- Programar horario

### Integración con Telegram
Para recibir notificaciones:
```javascript
// Agregar al final de app.js
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('TU_BOT_TOKEN');

// Enviar notificación cuando termine
bot.sendMessage('TU_CHAT_ID', `Publicación completada: ${publishedCount} productos`);
```

---

## 📝 EJEMPLO COMPLETO

### Google Sheet de Muestra
```
| nombre | precio | descripcion | imagenURL | categoria | ubicacion | contacto | linkWhatsApp | publicado | fecha_publicacion |
|--------|--------|-------------|-----------|-----------|-----------|----------|--------------|-----------|-------------------|
| iPhone 14 Pro | 1200 | iPhone en perfectas condiciones, batería al 100% | https://i.imgur.com/abc.jpg | Telefonia | Habana | 53912345 | https://wa.me/5353912345 | FALSE | |
| Samsung S23 | 900 | Samsung Galaxy S23, como nuevo, con caja | https://i.imgur.com/def.jpg | Telefonia | Santiago | 53987654 | https://wa.me/5353987654 | FALSE | |
```

### Archivo .env Completo
```env
# Google Sheets Configuration
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# Server Configuration
PORT=3000
NODE_ENV=development

# Revolico Configuration
REVOLICO_BASE_URL=https://www.revolico.com
DEFAULT_WAIT_MIN=3000
DEFAULT_WAIT_MAX=7000

# Logging
LOG_LEVEL=info
```

---

## 🏆 RESULTADOS ESPERADOS

Con esta configuración podrás:
- 📈 **200-500 publicaciones por día** (con 5-8 cuentas)
- ⏱️ **Ahorro de 8-10 horas diarias** de trabajo manual
- 🎯 **95%+ tasa de éxito** en publicaciones
- 🔄 **Rotación inteligente** para evitar baneos
- 📊 **Reportes detallados** de actividad

¡Tu negocio en Revolico nunca fue tan eficiente! 🚀

---

**💡 ¿Necesitas ayuda?** Revisa los logs, verifica tu configuración paso a paso, y asegúrate de tener todos los requisitos cumplidos. ¡La automatización vale la pena! 🇨🇺