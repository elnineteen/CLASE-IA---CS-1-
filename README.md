# 🚀 Revolico Auto Publisher

Automatizador de publicaciones masivas en Revolico.com desde Google Sheets, diseñado especialmente para usuarios en Cuba con tecnología limitada.

## 📋 ¿Qué hace esta aplicación?

- ✅ Lee productos desde Google Sheets automáticamente
- ✅ Publica en Revolico.com simulando comportamiento humano
- ✅ Rota textos y descripciones para evitar baneos
- ✅ Maneja múltiples cuentas de Revolico
- ✅ Genera logs detallados de publicaciones
- ✅ Funciona con conexión lenta
- ✅ Interfaz web simple y fácil de usar

## 🛠️ Instalación Paso a Paso

### Opción 1: En Replit (Recomendado para principiantes)

1. Ve a [Replit.com](https://replit.com) y crea una cuenta
2. Crea un nuevo Repl y selecciona "Node.js"
3. Borra todo el contenido y pega todos los archivos de esta aplicación
4. Haz clic en "Run" y sigue las instrucciones

### Opción 2: En tu computadora

1. **Instalar Node.js:**
   - Ve a [nodejs.org](https://nodejs.org)
   - Descarga la versión LTS
   - Instala siguiendo el asistente

2. **Descargar el código:**
   - Descarga todos los archivos en una carpeta
   - Abre la terminal/cmd en esa carpeta

3. **Instalar dependencias:**
   ```bash
   npm install
   ```

4. **Configurar Google Sheets:**
   - Copia `.env.example` a `.env`
   - Sigue la guía de configuración más abajo

5. **Ejecutar:**
   ```bash
   npm start
   ```

## 🔧 Configuración de Google Sheets

### Paso 1: Crear proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Habilita "Google Sheets API"
4. Crea credenciales OAuth 2.0
5. Agrega `http://localhost:3000/auth/callback` como URI de redirección

### Paso 2: Configurar tu hoja de cálculo

Crea una hoja con estas columnas exactas:
```
A: nombre
B: precio  
C: descripcion
D: imagenURL
E: categoria
F: ubicacion
G: contacto
H: linkWhatsApp
I: publicado (se llenará automáticamente)
J: fecha_publicacion (se llenará automáticamente)
```

### Paso 3: Configurar variables de entorno

Edita el archivo `.env` con tus datos:
```
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_SHEET_ID=tu_sheet_id
```

## 🎯 Cómo usar la aplicación

1. **Iniciar la aplicación:**
   ```bash
   npm start
   ```

2. **Abrir en el navegador:**
   - Ve a `http://localhost:3000`

3. **Autorizar Google Sheets:**
   - Haz clic en "Autorizar Google Sheets"
   - Sigue el proceso de autorización

4. **Configurar cuentas de Revolico:**
   - Ve a la sección "Cuentas"
   - Sube archivos de cookies para cada cuenta

5. **Iniciar publicación masiva:**
   - Haz clic en "Iniciar Publicación Masiva"
   - El sistema trabajará automáticamente

## 📁 Estructura de archivos

```
revolico-auto-publisher/
├── package.json          # Configuración del proyecto
├── app.js                # Servidor principal
├── .env                  # Variables de entorno (crear desde .env.example)
├── public/               # Archivos web estáticos
│   ├── index.html        # Interfaz principal
│   ├── style.css         # Estilos
│   └── script.js         # JavaScript del frontend
├── modules/              # Módulos principales
│   ├── googleSheets.js   # Conexión a Google Sheets
│   ├── revolicoBot.js    # Automatización de Revolico
│   ├── textRotator.js    # Sistema de rotación de textos
│   └── logger.js         # Sistema de logs
├── cookies/              # Archivos de cookies (se crea automáticamente)
├── logs/                 # Logs de publicaciones (se crea automáticamente)
└── README.md             # Este archivo
```

## ⚡ Características principales

### Comportamiento Humano
- Esperas aleatorias entre acciones
- Velocidad de escritura variable
- Scroll aleatorio
- Pausas naturales

### Rotación de Textos
- Múltiples versiones de descripciones
- Variaciones en títulos
- Sinónimos automáticos
- Orden aleatorio de características

### Múltiples Cuentas
- Rotación automática entre cuentas
- Límites por cuenta por día
- Gestión de cookies independiente
- Logs separados por cuenta

## 🔧 Solución de problemas

### Error: "No se puede conectar a Google Sheets"
- Verifica que las credenciales estén correctas
- Asegúrate de que la hoja sea pública o esté compartida
- Revisa que el ID de la hoja sea correcto

### Error: "Puppeteer no puede iniciar"
- En Linux: `sudo apt-get install chromium-browser`
- En sistemas limitados: usa `--no-sandbox` flag

### Publicaciones fallan
- Revisa los logs en la carpeta `logs/`
- Verifica que las cookies sean válidas
- Asegúrate de que Revolico no esté bloqueando

### Conexión lenta
- Aumenta los tiempos de espera en la configuración
- Reduce el número de publicaciones simultáneas
- Usa modo headless para mejor rendimiento

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en `logs/`
2. Verifica la configuración en `.env`
3. Asegúrate de que todas las dependencias estén instaladas
4. Reinicia la aplicación

## ⚠️ Importante

- Usa esta herramienta responsablemente
- Respeta los términos de servicio de Revolico
- No abuses del sistema para evitar baneos
- Mantén actualizada tu información de contacto

## 🇨🇺 Optimizado para Cuba

Esta aplicación está especialmente diseñada para funcionar con:
- Conexiones lentas e intermitentes
- Hardware limitado
- Restricciones de ancho de banda
- Múltiples interrupciones de servicio

¡Listo para automatizar tus publicaciones en Revolico! 🚀
