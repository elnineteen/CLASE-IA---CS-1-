const logger = require('./logger');

class TextRotator {
  constructor() {
    // Templates para títulos
    this.titleTemplates = [
      '{nombre} - {precio}',
      '{nombre} | {precio}',
      'Vendo {nombre} - {precio}',
      'Se vende {nombre} por {precio}',
      '{nombre} - Precio: {precio}',
      '¡{nombre}! Solo {precio}',
      '{nombre} ({precio})',
      'Oferta: {nombre} - {precio}',
      '{nombre} disponible por {precio}',
      'Aprovecha: {nombre} - {precio}'
    ];

    // Prefijos para descripciones
    this.descriptionPrefixes = [
      'Excelente oportunidad:',
      'Gran oferta:',
      'No te pierdas:',
      'Aprovecha esta ocasión:',
      'Oferta especial:',
      'Disponible ahora:',
      'Última oportunidad:',
      'Para venta:',
      'Se ofrece:',
      'En oferta:'
    ];

    // Sufijos para descripciones
    this.descriptionSuffixes = [
      'Contacta para más detalles.',
      'Precio negociable.',
      'Entrega inmediata.',
      'Solo efectivo.',
      'Primera calidad.',
      'En excelente estado.',
      'No dejes pasar esta oportunidad.',
      'Precio fijo.',
      'Entrega a domicilio.',
      'Garantía incluida.'
    ];

    // Palabras de transición
    this.transitions = [
      'Además,',
      'También,',
      'Por otro lado,',
      'Incluye',
      'Características:',
      'Detalles importantes:',
      'Información adicional:',
      'Ten en cuenta que',
      'Es importante mencionar que',
      'Cabe destacar que'
    ];

    // Sinónimos para palabras comunes
    this.synonyms = {
      'excelente': ['magnífico', 'extraordinario', 'fantástico', 'estupendo', 'genial'],
      'bueno': ['bien', 'correcto', 'adecuado', 'apropiado', 'óptimo'],
      'nuevo': ['reciente', 'flamante', 'moderno', 'actual', 'fresco'],
      'usado': ['usado', 'segunda mano', 'pre-owned', 'seminuevo', 'de ocasión'],
      'precio': ['costo', 'valor', 'importe', 'cantidad', 'tarifa'],
      'vendo': ['ofrezco', 'comercializo', 'pongo en venta', 'tengo disponible'],
      'contacto': ['comunícate', 'escríbeme', 'llama', 'ponte en contacto'],
      'disponible': ['libre', 'accesible', 'a la mano', 'en stock', 'en existencia']
    };

    // Frases de llamada a la acción
    this.callToActions = [
      'Contáctame ya!',
      'No esperes más!',
      'Llama ahora!',
      'Escríbeme pronto!',
      'Aprovecha la oferta!',
      'Primera llamada se lo lleva!',
      'Pregunta sin compromiso!',
      'Interesados contactar!',
      'Solo llamadas serias!',
      'WhatsApp disponible!'
    ];

    // Frases para ubicación
    this.locationPhrases = [
      'Ubicado en {ubicacion}',
      'Disponible en {ubicacion}',
      'Se encuentra en {ubicacion}',
      'Para entrega en {ubicacion}',
      'Zona: {ubicacion}',
      'Área: {ubicacion}',
      'Municipio: {ubicacion}',
      'En {ubicacion}',
      'Desde {ubicacion}',
      'Localizado en {ubicacion}'
    ];

    this.usedCombinations = new Set(); // Para evitar repeticiones muy frecuentes
  }

  // Generar título variado
  generateTitle(product) {
    try {
      const template = this.getRandomItem(this.titleTemplates);
      let title = template
        .replace('{nombre}', product.nombre)
        .replace('{precio}', this.formatPrice(product.precio));

      // Ocasionalmente agregar emojis
      if (Math.random() > 0.7) {
        title = this.addEmojis(title, product.categoria);
      }

      return title;
    } catch (error) {
      logger.error('Error al generar título:', error);
      return `${product.nombre} - ${product.precio}`;
    }
  }

  // Generar descripción variada
  generateDescription(product) {
    try {
      let description = product.descripcion || '';
      
      // Agregar prefijo
      if (Math.random() > 0.6) {
        const prefix = this.getRandomItem(this.descriptionPrefixes);
        description = `${prefix} ${description}`;
      }

      // Reemplazar sinónimos
      description = this.replaceSynonyms(description);

      // Agregar información adicional
      const additionalInfo = this.generateAdditionalInfo(product);
      if (additionalInfo) {
        const transition = this.getRandomItem(this.transitions);
        description += ` ${transition} ${additionalInfo}`;
      }

      // Agregar ubicación
      if (product.ubicacion && Math.random() > 0.5) {
        const locationPhrase = this.getRandomItem(this.locationPhrases);
        description += ` ${locationPhrase.replace('{ubicacion}', product.ubicacion)}.`;
      }

      // Agregar llamada a la acción
      if (Math.random() > 0.4) {
        const cta = this.getRandomItem(this.callToActions);
        description += ` ${cta}`;
      }

      // Agregar sufijo
      if (Math.random() > 0.5) {
        const suffix = this.getRandomItem(this.descriptionSuffixes);
        description += ` ${suffix}`;
      }

      return description.trim();
    } catch (error) {
      logger.error('Error al generar descripción:', error);
      return product.descripcion || 'Producto en venta';
    }
  }

  // Generar información adicional basada en la categoría
  generateAdditionalInfo(product) {
    const category = product.categoria?.toLowerCase() || '';
    const info = [];

    if (category.includes('auto') || category.includes('carro') || category.includes('vehiculo')) {
      const carInfo = ['motor en perfecto estado', 'papeles al día', 'mantenimiento reciente', 'aire acondicionado', 'transmisión automática'];
      info.push(this.getRandomItem(carInfo));
    } else if (category.includes('casa') || category.includes('apartamento') || category.includes('vivienda')) {
      const houseInfo = ['excelente ubicación', 'cerca del transporte', 'zona tranquila', 'todos los servicios', 'acceso fácil'];
      info.push(this.getRandomItem(houseInfo));
    } else if (category.includes('telefono') || category.includes('celular') || category.includes('movil')) {
      const phoneInfo = ['batería dura todo el día', 'pantalla perfecta', 'sin rayones', 'con cargador original', 'liberado de fábrica'];
      info.push(this.getRandomItem(phoneInfo));
    } else if (category.includes('ropa') || category.includes('zapato') || category.includes('accesorio')) {
      const clothingInfo = ['talla perfecta', 'como nuevo', 'marca reconocida', 'muy cómodo', 'estilo moderno'];
      info.push(this.getRandomItem(clothingInfo));
    }

    return info.length > 0 ? info[0] : '';
  }

  // Reemplazar palabras con sinónimos
  replaceSynonyms(text) {
    let result = text;
    
    Object.keys(this.synonyms).forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(result) && Math.random() > 0.6) {
        const synonym = this.getRandomItem(this.synonyms[word]);
        result = result.replace(regex, synonym);
      }
    });

    return result;
  }

  // Formatear precio
  formatPrice(price) {
    if (!price) return 'Precio a consultar';
    
    const formats = [
      `$${price}`,
      `${price} pesos`,
      `${price} CUP`,
      `$${price} CUP`,
      `Precio: $${price}`,
      `${price}$`
    ];

    return this.getRandomItem(formats);
  }

  // Agregar emojis según la categoría
  addEmojis(text, category) {
    const categoryEmojis = {
      'auto': ['🚗', '🚙', '🚘'],
      'casa': ['🏠', '🏡', '🏘️'],
      'telefono': ['📱', '📞', '☎️'],
      'ropa': ['👕', '👔', '👗'],
      'zapato': ['👟', '👠', '👞'],
      'comida': ['🍕', '🍔', '🥘'],
      'electronico': ['💻', '📺', '🔌'],
      'mueble': ['🪑', '🛏️', '🗄️'],
      'default': ['⭐', '✨', '🎯', '🔥', '💎']
    };

    const cat = category?.toLowerCase() || '';
    let emojis = categoryEmojis.default;

    Object.keys(categoryEmojis).forEach(key => {
      if (cat.includes(key)) {
        emojis = categoryEmojis[key];
      }
    });

    const emoji = this.getRandomItem(emojis);
    return `${emoji} ${text}`;
  }

  // Obtener elemento aleatorio de un array
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Generar variación completa del producto
  generateVariation(product) {
    const combination = `${product.nombre}-${Date.now()}`;
    
    // Evitar generar la misma combinación muy seguido
    if (this.usedCombinations.has(combination)) {
      // Si ya se usó, hacer pequeños ajustes
      return this.generateMinorVariation(product);
    }

    this.usedCombinations.add(combination);

    // Limpiar combinaciones usadas si hay muchas
    if (this.usedCombinations.size > 1000) {
      this.usedCombinations.clear();
    }

    return {
      title: this.generateTitle(product),
      description: this.generateDescription(product),
      originalProduct: product
    };
  }

  // Generar variación menor para evitar repeticiones exactas
  generateMinorVariation(product) {
    const variations = {
      title: this.generateTitle(product),
      description: this.generateDescription(product),
      originalProduct: product
    };

    // Agregar pequeñas variaciones adicionales
    if (Math.random() > 0.5) {
      variations.title = variations.title.replace(/[.!]$/, '') + (Math.random() > 0.5 ? '!' : '.');
    }

    return variations;
  }

  // Generar múltiples variaciones para rotación
  generateMultipleVariations(product, count = 5) {
    const variations = [];
    
    for (let i = 0; i < count; i++) {
      // Agregar delay para evitar colisiones en timestamp
      setTimeout(() => {
        variations.push(this.generateVariation(product));
      }, i * 10);
    }

    return variations;
  }

  // Obtener estadísticas de rotación
  getRotationStats() {
    return {
      usedCombinations: this.usedCombinations.size,
      availableTemplates: this.titleTemplates.length,
      availablePrefixes: this.descriptionPrefixes.length,
      availableSuffixes: this.descriptionSuffixes.length,
      totalSynonyms: Object.keys(this.synonyms).length
    };
  }

  // Agregar nuevos templates personalizados
  addCustomTemplate(type, template) {
    try {
      switch (type) {
        case 'title':
          this.titleTemplates.push(template);
          break;
        case 'prefix':
          this.descriptionPrefixes.push(template);
          break;
        case 'suffix':
          this.descriptionSuffixes.push(template);
          break;
        default:
          throw new Error('Tipo de template no válido');
      }
      
      logger.info(`Template personalizado agregado: ${type} - ${template}`);
      return true;
    } catch (error) {
      logger.error('Error al agregar template personalizado:', error);
      return false;
    }
  }

  // Reiniciar estadísticas de rotación
  resetRotationStats() {
    this.usedCombinations.clear();
    logger.info('Estadísticas de rotación reiniciadas');
  }
}

// Crear instancia singleton
const textRotator = new TextRotator();

module.exports = textRotator;