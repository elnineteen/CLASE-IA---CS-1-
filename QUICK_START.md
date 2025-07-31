# ⚡ QUICK START - Revolico Auto Publisher

## 🚀 Para desarrolladores y usuarios técnicos

### Instalación Rápida

```bash
# 1. Clonar/descargar proyecto
git clone <repo-url> revolico-publisher
cd revolico-publisher

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar
npm start
```

### Dashboard
- Abrir: `http://localhost:3000`
- Usuario: Interfaz web intuitiva
- API REST disponible en `/api/*`

---

## 🔧 Configuración Mínima

### 1. Google Sheets API
```javascript
// En .env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_sheet_id
```

### 2. Estructura de Google Sheet
```
Columnas requeridas: nombre, precio, descripcion
Columnas opcionales: imagenURL, categoria, ubicacion, contacto, linkWhatsApp
Auto-generadas: publicado, fecha_publicacion
```

### 3. Cookies de Revolico
- Exportar cookies de sesión activa
- Subir via dashboard (pestaña Cuentas)
- Formato: JSON o formato nativo del browser

---

## 🤖 Características Técnicas

### Automatización
- **Puppeteer**: Control de navegador headless/visual
- **Anti-detección**: Delays aleatorios, movimientos naturales
- **Rotación**: Múltiples cuentas, variación de textos
- **Resilencia**: Manejo de errores, reconexión automática

### Sistema de Textos
- **Templates**: 10+ variaciones de títulos
- **Sinónimos**: Reemplazo inteligente de palabras
- **Context-aware**: Variaciones por categoría
- **Emojis**: Adición automática según producto

### Logs y Monitoreo
- **Winston**: Logging estructurado
- **CSV Reports**: Exportación de resultados
- **Real-time**: Dashboard con polling cada 2s
- **Metrics**: Estadísticas de rendimiento

---

## 📡 API Endpoints

```javascript
// Estado
GET /api/status

// Google Sheets
GET /api/auth/google
GET /api/test-sheets
GET /api/products

// Cuentas
GET /api/accounts
POST /api/upload-cookies
DELETE /api/accounts/:name

// Publicación
POST /api/start-publishing
POST /api/stop-publishing

// Logs
GET /api/logs
GET /api/download-report
```

---

## 🔩 Configuración Avanzada

### Personalizar Comportamiento
```javascript
// modules/revolicoBot.js
this.humanBehavior = {
  typingSpeedMin: 50,    // ms por caracter
  typingSpeedMax: 150,
  waitMin: 2000,         // pausa entre acciones
  waitMax: 5000,
  scrollPauseMin: 500,
  scrollPauseMax: 1500
};
```

### Agregar Templates
```javascript
// modules/textRotator.js
this.titleTemplates.push('🔥 {nombre} - Solo {precio}!');
this.descriptionPrefixes.push('Liquidación:');
```

### Configurar Selectores
```javascript
// modules/revolicoBot.js - Si Revolico cambia su estructura
this.selectors = {
  titleField: 'input[name="title"], #title',
  submitButton: 'button[type="submit"]',
  // ... más selectores
};
```

---

## 🐛 Debug y Desarrollo

### Modo Debug
```bash
NODE_ENV=development npm start
# Puppeteer en modo visual para debug
```

### Logs Detallados
```bash
LOG_LEVEL=debug npm start
# Logs verbosos en consola
```

### Testing
```javascript
// Probar conexión Google Sheets
curl http://localhost:3000/api/test-sheets

// Probar carga de productos
curl http://localhost:3000/api/products

// Estado del sistema
curl http://localhost:3000/api/status
```

---

## 🔐 Seguridad

### Variables de Entorno
- Nunca commitear `.env`
- Rotar credenciales periódicamente
- Usar URLs de callback HTTPS en producción

### Cookies
- Almacenamiento local encriptado (futuro)
- Expiración automática
- Validación de sesión

### Rate Limiting
- Implementado a nivel de aplicación
- Configurable por cuenta
- Respeto a términos de servicio

---

## 📦 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### VPS/Cloud
```bash
# PM2 para producción
npm install -g pm2
pm2 start app.js --name revolico-publisher
pm2 startup
pm2 save
```

### Replit
- Fork/import proyecto
- Configurar secrets (equivalente a .env)
- Deploy automático

---

## 🔄 Mantenimiento

### Actualizaciones de Revolico
1. Inspeccionar nuevos selectores
2. Actualizar `modules/revolicoBot.js`
3. Testear en modo desarrollo
4. Deploy

### Limpieza de Logs
```javascript
// Automático: 7 días de retención
// Manual:
const logger = require('./modules/logger');
await logger.cleanOldLogs(3); // 3 días
```

### Backup de Configuración
```bash
# Backup cookies y config
tar -czf backup-$(date +%Y%m%d).tar.gz cookies/ config/ .env
```

---

## 📊 Performance

### Métricas Clave
- **Throughput**: ~50-100 publicaciones/hora
- **Success Rate**: 95%+ con configuración correcta
- **Memory**: <512MB RAM usage
- **CPU**: Minimal cuando no está publicando

### Optimizaciones
```javascript
// Headless mode
NODE_ENV=production

// Menor overhead de red
--disable-images --disable-media

// Timeouts ajustables según conexión
DEFAULT_WAIT_MIN=1000  // Conexión rápida
DEFAULT_WAIT_MIN=5000  // Conexión lenta
```

---

## 🛠️ Extensiones

### Integración con CRM
```javascript
// Webhook después de publicación exitosa
await fetch('https://tu-crm.com/api/webhook', {
  method: 'POST',
  body: JSON.stringify({ product, status: 'published' })
});
```

### Notificaciones
```javascript
// Telegram, Slack, email
const notifications = require('./modules/notifications');
await notifications.send('Publicación completada: 50 productos');
```

### Analytics
```javascript
// Google Analytics, Mixpanel
const analytics = require('./modules/analytics');
analytics.track('publication_completed', { count: publishedCount });
```

---

## 🤝 Contribuir

### Estructura del Código
```
app.js           # Express server, rutas API
modules/         # Lógica de negocio
├── googleSheets.js   # Google Sheets integration
├── revolicoBot.js    # Puppeteer automation
├── textRotator.js    # Text variation engine
└── logger.js         # Logging system
public/          # Frontend (HTML/CSS/JS)
```

### Pull Requests
1. Fork del repositorio
2. Branch feature/fix
3. Tests para nuevas funcionalidades
4. Documentation updates
5. PR con descripción detallada

### Issues Comunes
- **Selectores obsoletos**: Revolico cambió HTML
- **Rate limiting**: Demasiadas requests muy rápido
- **Cookies expiradas**: Sesión caducó
- **Memory leaks**: Puppeteer no cerrado correctamente

---

**🚀 Happy automation!**