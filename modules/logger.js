const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

// Configurar timezone para Cuba
moment.locale('es');

class Logger {
  constructor() {
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = this.logLevels[process.env.LOG_LEVEL?.toUpperCase()] || this.logLevels.INFO;
    this.logs = []; // Almacenar logs en memoria para API
    this.maxMemoryLogs = 1000; // Máximo de logs en memoria
    
    // Asegurar que existe el directorio de logs
    fs.ensureDirSync('./logs');
  }

  // Método principal de logging
  log(level, message, ...args) {
    if (this.logLevels[level] > this.currentLevel) {
      return;
    }

    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logEntry = {
      timestamp,
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      args: args.length > 0 ? args : undefined
    };

    // Agregar a memoria
    this.logs.push(logEntry);
    if (this.logs.length > this.maxMemoryLogs) {
      this.logs.shift(); // Remover el más antiguo
    }

    // Formatear para consola
    const consoleMessage = `[${timestamp}] ${level}: ${logEntry.message}`;
    
    // Mostrar en consola con colores
    switch (level) {
      case 'ERROR':
        console.error(`\x1b[31m${consoleMessage}\x1b[0m`, ...args);
        break;
      case 'WARN':
        console.warn(`\x1b[33m${consoleMessage}\x1b[0m`, ...args);
        break;
      case 'INFO':
        console.info(`\x1b[36m${consoleMessage}\x1b[0m`, ...args);
        break;
      case 'DEBUG':
        console.log(`\x1b[37m${consoleMessage}\x1b[0m`, ...args);
        break;
      default:
        console.log(consoleMessage, ...args);
    }

    // Escribir a archivo
    this.writeToFile(logEntry);
  }

  // Escribir a archivo de log diario
  async writeToFile(logEntry) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const logFile = path.join('./logs', `app-${today}.log`);
      
      const logLine = `[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}\n`;
      
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      console.error('Error al escribir al archivo de log:', error);
    }
  }

  // Métodos de conveniencia
  error(message, ...args) {
    this.log('ERROR', message, ...args);
  }

  warn(message, ...args) {
    this.log('WARN', message, ...args);
  }

  info(message, ...args) {
    this.log('INFO', message, ...args);
  }

  debug(message, ...args) {
    this.log('DEBUG', message, ...args);
  }

  // Obtener logs recientes para la API
  getRecentLogs(limit = 100) {
    return this.logs.slice(-limit).reverse(); // Los más recientes primero
  }

  // Limpiar logs antiguos (ejecutar diariamente)
  async cleanOldLogs(daysToKeep = 7) {
    try {
      const logsDir = './logs';
      const files = await fs.readdir(logsDir);
      const cutoffDate = moment().subtract(daysToKeep, 'days');

      for (const file of files) {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(logsDir, file);
          const stats = await fs.stat(filePath);
          const fileDate = moment(stats.mtime);

          if (fileDate.isBefore(cutoffDate)) {
            await fs.remove(filePath);
            this.info(`Log antiguo eliminado: ${file}`);
          }
        }
      }
    } catch (error) {
      this.error('Error al limpiar logs antiguos:', error);
    }
  }

  // Crear log específico para publicaciones
  async logPublication(product, account, status, error = null) {
    const publicationLog = {
      timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
      product: product.nombre || 'Desconocido',
      account: account.name || 'Desconocida',
      category: product.categoria || 'Sin categoría',
      price: product.precio || '0',
      status: status, // 'success', 'error', 'skipped'
      error: error || '',
      location: product.ubicacion || 'Sin ubicación'
    };

    // Log en memoria
    const message = `Publicación ${status}: ${product.nombre} (${account.name})`;
    if (status === 'success') {
      this.info(message);
    } else if (status === 'error') {
      this.error(`${message} - Error: ${error}`);
    } else {
      this.warn(message);
    }

    // Escribir a archivo específico de publicaciones
    await this.writePublicationToFile(publicationLog);
  }

  // Escribir publicación a archivo CSV
  async writePublicationToFile(publicationLog) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const csvFile = path.join('./logs', `publicaciones-${today}.csv`);
      
      // Verificar si el archivo existe
      const fileExists = await fs.pathExists(csvFile);
      
      // Si no existe, crear con headers
      if (!fileExists) {
        const headers = 'Timestamp,Producto,Cuenta,Categoria,Precio,Estado,Error,Ubicacion\n';
        await fs.writeFile(csvFile, headers);
      }

      // Formatear datos para CSV (escapar comillas)
      const csvLine = [
        publicationLog.timestamp,
        `"${publicationLog.product.replace(/"/g, '""')}"`,
        publicationLog.account,
        `"${publicationLog.category.replace(/"/g, '""')}"`,
        publicationLog.price,
        publicationLog.status,
        `"${publicationLog.error.replace(/"/g, '""')}"`,
        `"${publicationLog.location.replace(/"/g, '""')}"`
      ].join(',') + '\n';

      await fs.appendFile(csvFile, csvLine);
    } catch (error) {
      console.error('Error al escribir publicación a CSV:', error);
    }
  }

  // Obtener estadísticas de publicaciones del día
  async getTodayStats() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const csvFile = path.join('./logs', `publicaciones-${today}.csv`);
      
      if (!(await fs.pathExists(csvFile))) {
        return {
          total: 0,
          success: 0,
          errors: 0,
          skipped: 0
        };
      }

      const content = await fs.readFile(csvFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Saltar header
      const dataLines = lines.slice(1);
      
      const stats = {
        total: dataLines.length,
        success: 0,
        errors: 0,
        skipped: 0
      };

      dataLines.forEach(line => {
        const columns = line.split(',');
        if (columns.length >= 6) {
          const status = columns[5]; // Estado
          if (status === 'success') stats.success++;
          else if (status === 'error') stats.errors++;
          else if (status === 'skipped') stats.skipped++;
        }
      });

      return stats;
    } catch (error) {
      this.error('Error al obtener estadísticas del día:', error);
      return { total: 0, success: 0, errors: 0, skipped: 0 };
    }
  }
}

// Crear instancia singleton
const logger = new Logger();

// Limpiar logs antiguos al iniciar (opcional)
logger.cleanOldLogs(7).catch(err => {
  console.error('Error inicial al limpiar logs:', err);
});

module.exports = logger;