const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

class ExcelManager {
  constructor() {
    this.currentFile = null;
    this.currentData = [];
    this.uploadDir = './uploads';
    
    // Asegurar que existe el directorio de uploads
    fs.ensureDirSync(this.uploadDir);
  }

  // Procesar archivo Excel subido
  async processExcelFile(filePath, originalName) {
    try {
      logger.info(`Procesando archivo Excel: ${originalName}`);
      
      // Verificar que el archivo existe
      if (!await fs.pathExists(filePath)) {
        throw new Error('Archivo Excel no encontrado');
      }

      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Usar la primera hoja
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con headers
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!rawData || rawData.length === 0) {
        throw new Error('El archivo Excel está vacío');
      }

      // La primera fila contiene los headers
      const headers = rawData[0];
      const dataRows = rawData.slice(1);

      logger.info(`Headers encontrados: ${headers.join(', ')}`);
      logger.info(`Total de filas de datos: ${dataRows.length}`);

      // Mapear las columnas del Excel a nuestro formato estándar
      const columnMapping = this.createColumnMapping(headers);
      
      // Procesar cada fila de datos
      const products = dataRows.map((row, index) => {
        if (!row || row.length === 0) return null;
        
        const product = {
          rowIndex: index + 2, // +2 porque empezamos desde la fila 2
          nombre: this.getCellValue(row, columnMapping.titulo) || this.getCellValue(row, columnMapping.nombre),
          precio: this.formatPrice(this.getCellValue(row, columnMapping.precio), this.getCellValue(row, columnMapping.moneda)),
          descripcion: this.buildDescription(row, columnMapping),
          imagenURL: this.getCellValue(row, columnMapping.fotos),
          categoria: this.getCellValue(row, columnMapping.categoria),
          subcategoria: this.getCellValue(row, columnMapping.subcategoria),
          ubicacion: this.getCellValue(row, columnMapping.ubicacion) || 'Cuba',
          contacto: this.getCellValue(row, columnMapping.contacto) || this.getCellValue(row, columnMapping.telefono),
          linkWhatsApp: this.buildWhatsAppLink(this.getCellValue(row, columnMapping.contacto) || this.getCellValue(row, columnMapping.telefono)),
          publicado: false, // Por defecto no publicado
          fecha_publicacion: null,
          // Campos adicionales del Excel
          moneda: this.getCellValue(row, columnMapping.moneda),
          municipio: this.getCellValue(row, columnMapping.municipio),
          email: this.getCellValue(row, columnMapping.email)
        };

        return product;
      }).filter(product => 
        // Filtrar productos válidos
        product && 
        product.nombre && 
        product.nombre.trim() !== '' && 
        product.precio && 
        product.precio.trim() !== ''
      );

      // Guardar información del archivo actual
      this.currentFile = {
        originalName,
        filePath,
        processedAt: new Date(),
        totalRows: dataRows.length,
        validProducts: products.length,
        headers
      };
      
      this.currentData = products;

      logger.info(`Excel procesado exitosamente: ${products.length} productos válidos de ${dataRows.length} filas`);
      return {
        success: true,
        products,
        stats: {
          totalRows: dataRows.length,
          validProducts: products.length,
          headers: headers
        }
      };

    } catch (error) {
      logger.error('Error al procesar archivo Excel:', error);
      throw error;
    }
  }

  // Crear mapeo de columnas basado en los headers del Excel
  createColumnMapping(headers) {
    const mapping = {};
    
    // Mapeos posibles para cada campo
    const fieldMappings = {
      categoria: ['categoria', 'category', 'cat'],
      subcategoria: ['subcategoria', 'subcategory', 'subcat'],
      titulo: ['titulo', 'title', 'nombre', 'name', 'producto'],
      nombre: ['nombre', 'name', 'titulo', 'title', 'producto'],
      precio: ['precio', 'price', 'cost', 'costo'],
      moneda: ['moneda', 'currency', 'curr'],
      fotos: ['fotos', 'foto', 'imagen', 'image', 'imagenes', 'images'],
      descripcion: ['descripcion', 'description', 'desc', 'detalle'],
      ubicacion: ['ubicacion', 'location', 'lugar', 'provincia'],
      municipio: ['municipio', 'municipality', 'ciudad', 'city'],
      contacto: ['contacto', 'contact'],
      telefono: ['telefono', 'phone', 'tel', 'celular', 'movil'],
      email: ['email', 'correo', 'mail']
    };

    // Encontrar el índice de cada campo
    Object.keys(fieldMappings).forEach(field => {
      const possibleNames = fieldMappings[field];
      const index = headers.findIndex(header => 
        possibleNames.some(name => 
          header.toLowerCase().trim() === name.toLowerCase()
        )
      );
      mapping[field] = index;
    });

    logger.debug('Mapeo de columnas creado:', mapping);
    return mapping;
  }

  // Obtener valor de celda de forma segura
  getCellValue(row, columnIndex) {
    if (columnIndex === -1 || !row || columnIndex >= row.length) {
      return '';
    }
    const value = row[columnIndex];
    return value !== null && value !== undefined ? String(value).trim() : '';
  }

  // Formatear precio con moneda
  formatPrice(precio, moneda) {
    if (!precio || precio.trim() === '') return '';
    
    const cleanPrice = precio.replace(/[^\d.,]/g, '');
    const currency = moneda || 'USD';
    
    return `${cleanPrice} ${currency}`;
  }

  // Construir descripción combinando varios campos
  buildDescription(row, columnMapping) {
    let description = '';
    
    // Descripción principal
    const mainDesc = this.getCellValue(row, columnMapping.descripcion);
    if (mainDesc) {
      description += mainDesc;
    }

    // Agregar subcategoría si existe
    const subcategoria = this.getCellValue(row, columnMapping.subcategoria);
    if (subcategoria) {
      description += `\n\nSubcategoría: ${subcategoria}`;
    }

    // Agregar ubicación detallada
    const municipio = this.getCellValue(row, columnMapping.municipio);
    if (municipio) {
      description += `\n\nUbicación: ${municipio}`;
    }

    return description.trim();
  }

  // Construir link de WhatsApp
  buildWhatsAppLink(telefono) {
    if (!telefono || telefono.trim() === '') return '';
    
    // Limpiar número de teléfono
    const cleanPhone = telefono.replace(/[^\d+]/g, '');
    
    if (cleanPhone.length > 0) {
      return `https://wa.me/${cleanPhone}`;
    }
    
    return '';
  }

  // Obtener productos actuales
  getProducts() {
    return this.currentData;
  }

  // Obtener información del archivo actual
  getCurrentFileInfo() {
    return this.currentFile;
  }

  // Marcar producto como publicado (simular para Excel)
  async markAsPublished(rowIndex) {
    try {
      const productIndex = this.currentData.findIndex(p => p.rowIndex === rowIndex);
      if (productIndex !== -1) {
        this.currentData[productIndex].publicado = true;
        this.currentData[productIndex].fecha_publicacion = new Date().toISOString().split('T')[0];
        logger.debug(`Producto marcado como publicado en fila ${rowIndex}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error al marcar producto como publicado (fila ${rowIndex}):`, error);
      throw error;
    }
  }

  // Obtener estadísticas
  getStats() {
    const products = this.currentData;
    
    const stats = {
      total: products.length,
      published: products.filter(p => p.publicado).length,
      pending: products.filter(p => !p.publicado).length,
      categories: {},
      fileInfo: this.currentFile
    };

    // Contar por categorías
    products.forEach(product => {
      const category = product.categoria || 'Sin categoría';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
    });

    return stats;
  }

  // Validar estructura del Excel
  validateExcelStructure(headers) {
    const requiredFields = ['titulo', 'precio'];
    const recommendedFields = ['categoria', 'descripcion', 'fotos', 'contacto'];
    
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      headers: headers
    };

    // Verificar campos requeridos
    requiredFields.forEach(field => {
      const fieldMappings = {
        titulo: ['titulo', 'title', 'nombre', 'name', 'producto'],
        precio: ['precio', 'price', 'cost', 'costo']
      };
      
      const found = headers.some(header => 
        fieldMappings[field].some(mapping => 
          header.toLowerCase().trim() === mapping.toLowerCase()
        )
      );
      
      if (!found) {
        validation.valid = false;
        validation.errors.push(`Campo requerido faltante: ${field}`);
      }
    });

    // Verificar campos recomendados
    recommendedFields.forEach(field => {
      const fieldMappings = {
        categoria: ['categoria', 'category'],
        descripcion: ['descripcion', 'description'],
        fotos: ['fotos', 'foto', 'imagen', 'image'],
        contacto: ['contacto', 'contact', 'telefono', 'phone']
      };
      
      const found = headers.some(header => 
        fieldMappings[field].some(mapping => 
          header.toLowerCase().trim() === mapping.toLowerCase()
        )
      );
      
      if (!found) {
        validation.warnings.push(`Campo recomendado faltante: ${field}`);
      }
    });

    return validation;
  }

  // Limpiar datos actuales
  clearCurrentData() {
    this.currentData = [];
    this.currentFile = null;
    logger.info('Datos de Excel limpiados');
  }

  // Exportar datos procesados a Excel
  async exportToExcel(outputPath) {
    try {
      if (!this.currentData || this.currentData.length === 0) {
        throw new Error('No hay datos para exportar');
      }

      const ws = XLSX.utils.json_to_sheet(this.currentData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      
      XLSX.writeFile(wb, outputPath);
      logger.info(`Datos exportados a Excel: ${outputPath}`);
      
      return true;
    } catch (error) {
      logger.error('Error al exportar a Excel:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
const excelManager = new ExcelManager();

module.exports = excelManager;