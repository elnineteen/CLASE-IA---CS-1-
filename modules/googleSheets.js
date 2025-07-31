const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

class GoogleSheetsManager {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.tokenPath = './config/token.json';
    this.credentialsPath = './config/credentials.json';
    
    // Asegurar que existe el directorio de configuración
    fs.ensureDirSync('./config');
    
    this.initializeAuth();
  }

  // Inicializar autenticación
  async initializeAuth() {
    try {
      // Configurar OAuth2 con variables de entorno
      this.auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Cargar token existente si está disponible
      await this.loadSavedToken();
      
      if (this.auth.credentials && this.auth.credentials.access_token) {
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
        logger.info('Google Sheets API inicializada correctamente');
      }
    } catch (error) {
      logger.warn('No se pudo inicializar Google Sheets automáticamente:', error.message);
    }
  }

  // Cargar token guardado
  async loadSavedToken() {
    try {
      if (await fs.pathExists(this.tokenPath)) {
        const token = await fs.readJson(this.tokenPath);
        this.auth.setCredentials(token);
        logger.info('Token de Google Sheets cargado desde archivo');
        return true;
      }
    } catch (error) {
      logger.warn('Error al cargar token guardado:', error.message);
    }
    return false;
  }

  // Guardar token
  async saveToken(token) {
    try {
      await fs.writeJson(this.tokenPath, token);
      logger.info('Token de Google Sheets guardado');
    } catch (error) {
      logger.error('Error al guardar token:', error);
    }
  }

  // Obtener URL de autorización
  async getAuthUrl() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Credenciales de Google no configuradas. Revisa las variables de entorno.');
    }

    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
    
    const authUrl = this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Forzar consent para obtener refresh token
    });

    logger.info('URL de autorización generada');
    return authUrl;
  }

  // Manejar callback de autorización
  async handleAuthCallback(code) {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      
      // Guardar token
      await this.saveToken(tokens);
      
      // Inicializar sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      logger.info('Autorización de Google Sheets completada exitosamente');
      return true;
    } catch (error) {
      logger.error('Error en callback de autorización:', error);
      throw new Error('Error al procesar autorización de Google');
    }
  }

  // Probar conexión
  async testConnection() {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets no está inicializado. Autoriza la aplicación primero.');
      }

      if (!this.spreadsheetId) {
        throw new Error('GOOGLE_SHEET_ID no está configurado en las variables de entorno');
      }

      // Obtener información básica de la hoja
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const title = response.data.properties.title;
      const sheets = response.data.sheets.map(sheet => sheet.properties.title);

      logger.info(`Conexión exitosa a: "${title}"`);
      logger.info(`Hojas disponibles: ${sheets.join(', ')}`);

      return {
        title,
        sheets,
        url: `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`
      };
    } catch (error) {
      logger.error('Error al probar conexión con Google Sheets:', error);
      throw error;
    }
  }

  // Obtener productos desde la hoja
  async getProducts(sheetName = 'Sheet1') {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets no está inicializado');
      }

      // Definir el rango de datos (asumiendo que los headers están en la fila 1)
      const range = `${sheetName}!A:J`; // A-J para cubrir todas las columnas necesarias

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        logger.warn('No se encontraron datos en la hoja de cálculo');
        return [];
      }

      // La primera fila debe contener los headers
      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Mapear las columnas esperadas
      const expectedColumns = {
        nombre: ['nombre', 'name', 'producto', 'product'],
        precio: ['precio', 'price', 'cost', 'costo'],
        descripcion: ['descripcion', 'description', 'desc'],
        imagenURL: ['imagenurl', 'imagen', 'image', 'imageurl', 'foto'],
        categoria: ['categoria', 'category', 'cat'],
        ubicacion: ['ubicacion', 'location', 'lugar'],
        contacto: ['contacto', 'contact', 'telefono', 'phone'],
        linkWhatsApp: ['linkwhatsapp', 'whatsapp', 'wa'],
        publicado: ['publicado', 'published', 'posted'],
        fecha_publicacion: ['fecha_publicacion', 'date_published', 'published_date']
      };

      // Encontrar índices de columnas
      const columnIndexes = {};
      Object.keys(expectedColumns).forEach(key => {
        const possibleNames = expectedColumns[key];
        const index = headers.findIndex(header => 
          possibleNames.some(name => 
            header.toLowerCase().trim() === name.toLowerCase()
          )
        );
        columnIndexes[key] = index;
      });

      // Verificar que las columnas esenciales existen
      const essentialColumns = ['nombre', 'precio', 'descripcion'];
      const missingColumns = essentialColumns.filter(col => columnIndexes[col] === -1);
      
      if (missingColumns.length > 0) {
        throw new Error(`Columnas faltantes en la hoja: ${missingColumns.join(', ')}`);
      }

      // Procesar productos
      const products = dataRows.map((row, index) => {
        const product = {
          rowIndex: index + 2, // +2 porque empezamos desde la fila 2 (después del header)
          nombre: this.getCellValue(row, columnIndexes.nombre),
          precio: this.getCellValue(row, columnIndexes.precio),
          descripcion: this.getCellValue(row, columnIndexes.descripcion),
          imagenURL: this.getCellValue(row, columnIndexes.imagenURL),
          categoria: this.getCellValue(row, columnIndexes.categoria) || 'Sin categoría',
          ubicacion: this.getCellValue(row, columnIndexes.ubicacion) || 'Cuba',
          contacto: this.getCellValue(row, columnIndexes.contacto),
          linkWhatsApp: this.getCellValue(row, columnIndexes.linkWhatsApp),
          publicado: this.getCellValue(row, columnIndexes.publicado) === 'TRUE' || 
                     this.getCellValue(row, columnIndexes.publicado) === '1' ||
                     this.getCellValue(row, columnIndexes.publicado)?.toLowerCase() === 'si',
          fecha_publicacion: this.getCellValue(row, columnIndexes.fecha_publicacion)
        };

        return product;
      }).filter(product => 
        // Filtrar productos que tengan al menos nombre y precio
        product.nombre && product.nombre.trim() !== '' && 
        product.precio && product.precio.trim() !== ''
      );

      logger.info(`${products.length} productos obtenidos desde Google Sheets`);
      return products;

    } catch (error) {
      logger.error('Error al obtener productos desde Google Sheets:', error);
      throw error;
    }
  }

  // Obtener valor de celda de forma segura
  getCellValue(row, columnIndex) {
    if (columnIndex === -1 || !row || columnIndex >= row.length) {
      return '';
    }
    return row[columnIndex] || '';
  }

  // Marcar producto como publicado
  async markAsPublished(rowIndex, sheetName = 'Sheet1') {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets no está inicializado');
      }

      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Actualizar la columna "publicado" (I) y "fecha_publicacion" (J)
      const updates = [
        {
          range: `${sheetName}!I${rowIndex}`,
          values: [['TRUE']]
        },
        {
          range: `${sheetName}!J${rowIndex}`,
          values: [[currentDate]]
        }
      ];

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'RAW',
          data: updates
        }
      });

      logger.debug(`Producto marcado como publicado en fila ${rowIndex}`);
      return true;

    } catch (error) {
      logger.error(`Error al marcar producto como publicado (fila ${rowIndex}):`, error);
      throw error;
    }
  }

  // Agregar nuevo producto a la hoja
  async addProduct(product, sheetName = 'Sheet1') {
    try {
      if (!this.sheets) {
        throw new Error('Google Sheets no está inicializado');
      }

      const values = [[
        product.nombre || '',
        product.precio || '',
        product.descripcion || '',
        product.imagenURL || '',
        product.categoria || '',
        product.ubicacion || '',
        product.contacto || '',
        product.linkWhatsApp || '',
        'FALSE', // publicado
        '' // fecha_publicacion
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:J`,
        valueInputOption: 'RAW',
        resource: { values }
      });

      logger.info(`Nuevo producto agregado: ${product.nombre}`);
      return true;

    } catch (error) {
      logger.error('Error al agregar producto:', error);
      throw error;
    }
  }

  // Obtener estadísticas de la hoja
  async getSheetStats(sheetName = 'Sheet1') {
    try {
      const products = await this.getProducts(sheetName);
      
      const stats = {
        total: products.length,
        published: products.filter(p => p.publicado).length,
        pending: products.filter(p => !p.publicado).length,
        categories: {}
      };

      // Contar por categorías
      products.forEach(product => {
        const category = product.categoria || 'Sin categoría';
        stats.categories[category] = (stats.categories[category] || 0) + 1;
      });

      return stats;

    } catch (error) {
      logger.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // Validar estructura de la hoja
  async validateSheetStructure(sheetName = 'Sheet1') {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!1:1`
      });

      const headers = response.data.values ? response.data.values[0] : [];
      
      const requiredColumns = ['nombre', 'precio', 'descripcion'];
      const recommendedColumns = ['imagenURL', 'categoria', 'ubicacion', 'contacto', 'linkWhatsApp', 'publicado', 'fecha_publicacion'];
      
      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        headers: headers
      };

      // Verificar columnas requeridas
      requiredColumns.forEach(col => {
        const found = headers.some(header => 
          header.toLowerCase().trim() === col.toLowerCase()
        );
        if (!found) {
          validation.valid = false;
          validation.errors.push(`Columna requerida faltante: ${col}`);
        }
      });

      // Verificar columnas recomendadas
      recommendedColumns.forEach(col => {
        const found = headers.some(header => 
          header.toLowerCase().trim().replace('_', '') === col.toLowerCase().replace('_', '')
        );
        if (!found) {
          validation.warnings.push(`Columna recomendada faltante: ${col}`);
        }
      });

      return validation;

    } catch (error) {
      logger.error('Error al validar estructura de la hoja:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
const googleSheets = new GoogleSheetsManager();

module.exports = googleSheets;