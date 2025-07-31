require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');

// Importar módulos personalizados
const googleSheets = require('./modules/googleSheets');
const revolicoBot = require('./modules/revolicoBot');
const logger = require('./modules/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Crear directorios necesarios
fs.ensureDirSync('./cookies');
fs.ensureDirSync('./logs');
fs.ensureDirSync('./uploads');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './cookies/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// Estado global de la aplicación
let appState = {
  isPublishing: false,
  currentProgress: 0,
  totalProducts: 0,
  publishedToday: 0,
  errors: [],
  lastUpdate: new Date(),
  accounts: []
};

// Rutas principales

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API para obtener estado de la aplicación
app.get('/api/status', (req, res) => {
  res.json(appState);
});

// API para autorización de Google Sheets
app.get('/api/auth/google', async (req, res) => {
  try {
    const authUrl = await googleSheets.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    logger.error('Error al generar URL de autorización:', error);
    res.status(500).json({ error: 'Error al generar URL de autorización' });
  }
});

// Callback de autorización de Google
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    await googleSheets.handleAuthCallback(code);
    res.redirect('/?auth=success');
  } catch (error) {
    logger.error('Error en callback de autorización:', error);
    res.redirect('/?auth=error');
  }
});

// API para probar conexión a Google Sheets
app.get('/api/test-sheets', async (req, res) => {
  try {
    const testResult = await googleSheets.testConnection();
    res.json({ success: true, data: testResult });
  } catch (error) {
    logger.error('Error al probar conexión a Google Sheets:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para obtener productos desde Google Sheets
app.get('/api/products', async (req, res) => {
  try {
    const products = await googleSheets.getProducts();
    res.json({ products, total: products.length });
  } catch (error) {
    logger.error('Error al obtener productos:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para subir archivo de cookies
app.post('/api/upload-cookies', upload.single('cookiesFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const { accountName } = req.body;
    if (!accountName) {
      return res.status(400).json({ error: 'Nombre de cuenta requerido' });
    }

    // Agregar cuenta al estado
    appState.accounts.push({
      name: accountName,
      cookiesFile: req.file.filename,
      lastUsed: null,
      publicationsToday: 0,
      status: 'active'
    });

    logger.info(`Cookies subidas para cuenta: ${accountName}`);
    res.json({ success: true, message: 'Cookies subidas correctamente' });
  } catch (error) {
    logger.error('Error al subir cookies:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para obtener cuentas configuradas
app.get('/api/accounts', (req, res) => {
  res.json({ accounts: appState.accounts });
});

// API para eliminar cuenta
app.delete('/api/accounts/:accountName', (req, res) => {
  try {
    const { accountName } = req.params;
    const accountIndex = appState.accounts.findIndex(acc => acc.name === accountName);
    
    if (accountIndex === -1) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }

    // Eliminar archivo de cookies
    const cookiesFile = appState.accounts[accountIndex].cookiesFile;
    fs.removeSync(path.join('./cookies', cookiesFile));

    // Eliminar de la lista
    appState.accounts.splice(accountIndex, 1);

    logger.info(`Cuenta eliminada: ${accountName}`);
    res.json({ success: true, message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para iniciar publicación masiva
app.post('/api/start-publishing', async (req, res) => {
  try {
    if (appState.isPublishing) {
      return res.status(400).json({ error: 'Ya hay una publicación en proceso' });
    }

    if (appState.accounts.length === 0) {
      return res.status(400).json({ error: 'No hay cuentas configuradas' });
    }

    // Iniciar proceso de publicación
    appState.isPublishing = true;
    appState.currentProgress = 0;
    appState.errors = [];
    appState.lastUpdate = new Date();

    // Ejecutar en background
    publishProducts().catch(error => {
      logger.error('Error en publicación masiva:', error);
      appState.isPublishing = false;
    });

    res.json({ success: true, message: 'Publicación masiva iniciada' });
  } catch (error) {
    logger.error('Error al iniciar publicación masiva:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para detener publicación
app.post('/api/stop-publishing', (req, res) => {
  try {
    appState.isPublishing = false;
    logger.info('Publicación masiva detenida por el usuario');
    res.json({ success: true, message: 'Publicación detenida' });
  } catch (error) {
    logger.error('Error al detener publicación:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para obtener logs
app.get('/api/logs', (req, res) => {
  try {
    const logs = logger.getRecentLogs(100); // Últimos 100 logs
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs' });
  }
});

// API para descargar reporte
app.get('/api/download-report', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reportPath = path.join('./logs', `reporte-${today}.csv`);
    
    if (fs.existsSync(reportPath)) {
      res.download(reportPath);
    } else {
      res.status(404).json({ error: 'No hay reporte disponible para hoy' });
    }
  } catch (error) {
    logger.error('Error al descargar reporte:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función principal de publicación
async function publishProducts() {
  try {
    logger.info('Iniciando publicación masiva de productos');

    // Obtener productos desde Google Sheets
    const products = await googleSheets.getProducts();
    const unpublishedProducts = products.filter(product => !product.publicado);

    appState.totalProducts = unpublishedProducts.length;
    logger.info(`Total de productos a publicar: ${appState.totalProducts}`);

    if (unpublishedProducts.length === 0) {
      logger.info('No hay productos nuevos para publicar');
      appState.isPublishing = false;
      return;
    }

    // Inicializar el bot
    await revolicoBot.initialize();

    let currentAccountIndex = 0;
    let publicationsWithCurrentAccount = 0;
    const maxPublicationsPerAccount = 20; // Límite por cuenta por sesión

    for (let i = 0; i < unpublishedProducts.length && appState.isPublishing; i++) {
      const product = unpublishedProducts[i];

      try {
        // Cambiar de cuenta si es necesario
        if (publicationsWithCurrentAccount >= maxPublicationsPerAccount) {
          currentAccountIndex = (currentAccountIndex + 1) % appState.accounts.length;
          publicationsWithCurrentAccount = 0;
          await revolicoBot.switchAccount(appState.accounts[currentAccountIndex]);
        }

        // Publicar producto
        const result = await revolicoBot.publishProduct(product, appState.accounts[currentAccountIndex]);

        if (result.success) {
          // Marcar como publicado en Google Sheets
          await googleSheets.markAsPublished(product.rowIndex);
          appState.publishedToday++;
          publicationsWithCurrentAccount++;
          appState.accounts[currentAccountIndex].publicationsToday++;
          
          logger.info(`Producto publicado exitosamente: ${product.nombre}`);
        } else {
          appState.errors.push({
            product: product.nombre,
            error: result.error,
            timestamp: new Date()
          });
          logger.error(`Error al publicar ${product.nombre}: ${result.error}`);
        }

      } catch (error) {
        appState.errors.push({
          product: product.nombre,
          error: error.message,
          timestamp: new Date()
        });
        logger.error(`Error inesperado al publicar ${product.nombre}:`, error);
      }

      // Actualizar progreso
      appState.currentProgress = i + 1;
      appState.lastUpdate = new Date();

      // Pausa aleatoria entre publicaciones para simular comportamiento humano
      const waitTime = Math.random() * (10000 - 5000) + 5000; // 5-10 segundos
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Finalizar
    await revolicoBot.cleanup();
    appState.isPublishing = false;
    
    logger.info(`Publicación masiva completada. Publicados: ${appState.publishedToday}, Errores: ${appState.errors.length}`);

    // Generar reporte final
    await generateDailyReport();

  } catch (error) {
    logger.error('Error en proceso de publicación masiva:', error);
    appState.isPublishing = false;
    appState.errors.push({
      product: 'Sistema',
      error: error.message,
      timestamp: new Date()
    });
  }
}

// Función para generar reporte diario
async function generateDailyReport() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const reportPath = path.join('./logs', `reporte-${today}.csv`);
    
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
      path: reportPath,
      header: [
        { id: 'timestamp', title: 'Fecha/Hora' },
        { id: 'product', title: 'Producto' },
        { id: 'account', title: 'Cuenta' },
        { id: 'status', title: 'Estado' },
        { id: 'error', title: 'Error' }
      ]
    });

    const reportData = [];
    
    // Agregar publicaciones exitosas
    for (let i = 0; i < appState.publishedToday; i++) {
      reportData.push({
        timestamp: new Date().toISOString(),
        product: 'Publicado',
        account: 'Varias',
        status: 'Exitoso',
        error: ''
      });
    }

    // Agregar errores
    appState.errors.forEach(error => {
      reportData.push({
        timestamp: error.timestamp.toISOString(),
        product: error.product,
        account: 'N/A',
        status: 'Error',
        error: error.error
      });
    });

    await csvWriter.writeRecords(reportData);
    logger.info(`Reporte diario generado: ${reportPath}`);

  } catch (error) {
    logger.error('Error al generar reporte diario:', error);
  }
}

// Manejador de errores global
app.use((error, req, res, next) => {
  logger.error('Error no manejado:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor iniciado en http://localhost:${PORT}`);
  logger.info('🔥 Revolico Auto Publisher v1.0');
  logger.info('📋 Dashboard disponible en el navegador');
  
  // Verificar configuración inicial
  if (!process.env.GOOGLE_SHEET_ID) {
    logger.warn('⚠️  Configurar GOOGLE_SHEET_ID en archivo .env');
  }
  if (!process.env.GOOGLE_CLIENT_ID) {
    logger.warn('⚠️  Configurar credenciales de Google en archivo .env');
  }
});

module.exports = app;