const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const textRotator = require('./textRotator');

class RevolicoBot {
  constructor() {
    this.browser = null;
    this.page = null;
    this.currentAccount = null;
    this.isInitialized = false;
    this.baseUrl = process.env.REVOLICO_BASE_URL || 'https://www.revolico.com';
    
    // Configuración para simular comportamiento humano
    this.humanBehavior = {
      typingSpeedMin: 50,
      typingSpeedMax: 150,
      waitMin: parseInt(process.env.DEFAULT_WAIT_MIN) || 2000,
      waitMax: parseInt(process.env.DEFAULT_WAIT_MAX) || 5000,
      scrollPauseMin: 500,
      scrollPauseMax: 1500
    };

    // Configuración de Puppeteer optimizada para conexiones lentas
    this.puppeteerConfig = {
      headless: process.env.NODE_ENV === 'production' ? 'new' : false,
      slowMo: 100, // Ralentizar para simular humano
      defaultViewport: {
        width: 1366,
        height: 768
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    };

    // Selectores de Revolico (estos pueden cambiar y necesitar actualización)
    this.selectors = {
      loginButton: '.login-btn, a[href*="login"], #login-link',
      loginForm: '#login-form, .login-form, form[action*="login"]',
      usernameField: 'input[name="username"], input[name="email"], #username, #email',
      passwordField: 'input[name="password"], #password',
      submitLoginButton: 'input[type="submit"], button[type="submit"], .login-submit',
      publishButton: '.publish-btn, a[href*="publish"], .post-ad-btn',
      titleField: 'input[name="title"], #title, .title-input',
      descriptionField: 'textarea[name="description"], #description, .description-textarea',
      categorySelect: 'select[name="category"], #category, .category-select',
      locationSelect: 'select[name="location"], #location, .location-select',
      priceField: 'input[name="price"], #price, .price-input',
      phoneField: 'input[name="phone"], #phone, .phone-input',
      imageUpload: 'input[type="file"], .image-upload, #image-upload',
      publishSubmitButton: 'button[type="submit"], .publish-submit, #submit-ad',
      successMessage: '.success-message, .alert-success, .confirmation'
    };
  }

  // Inicializar el bot
  async initialize() {
    try {
      logger.info('Inicializando Revolico Bot...');

      this.browser = await puppeteer.launch(this.puppeteerConfig);
      this.page = await this.browser.newPage();

      // Configurar navegador para simular dispositivo real
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Configurar timeouts para conexiones lentas
      await this.page.setDefaultTimeout(30000);
      await this.page.setDefaultNavigationTimeout(60000);

      // Interceptar requests para optimizar carga
      await this.page.setRequestInterception(true);
      this.page.on('request', (request) => {
        // Bloquear recursos innecesarios para ahorrar ancho de banda
        const resourceType = request.resourceType();
        if (['font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      this.isInitialized = true;
      logger.info('Revolico Bot inicializado correctamente');

    } catch (error) {
      logger.error('Error al inicializar Revolico Bot:', error);
      throw error;
    }
  }

  // Cargar cookies de cuenta
  async loadAccountCookies(account) {
    try {
      if (!account || !account.cookiesFile) {
        throw new Error('Información de cuenta inválida');
      }

      const cookiesPath = path.join('./cookies', account.cookiesFile);
      if (!(await fs.pathExists(cookiesPath))) {
        throw new Error(`Archivo de cookies no encontrado: ${cookiesPath}`);
      }

      const cookiesData = await fs.readFile(cookiesPath, 'utf8');
      let cookies;

      try {
        cookies = JSON.parse(cookiesData);
      } catch (parseError) {
        // Si no es JSON válido, asumir que es formato de exportación de browser
        cookies = this.parseBrowserCookies(cookiesData);
      }

      if (!Array.isArray(cookies) || cookies.length === 0) {
        throw new Error('Formato de cookies inválido');
      }

      await this.page.setCookie(...cookies);
      logger.info(`Cookies cargadas para cuenta: ${account.name}`);
      return true;

    } catch (error) {
      logger.error(`Error al cargar cookies para ${account.name}:`, error);
      throw error;
    }
  }

  // Parsear cookies en formato de exportación de browser
  parseBrowserCookies(cookiesText) {
    const lines = cookiesText.split('\n');
    const cookies = [];

    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const parts = line.split('\t');
        if (parts.length >= 7) {
          cookies.push({
            name: parts[5],
            value: parts[6],
            domain: parts[0],
            path: parts[2],
            expires: parts[4] ? parseFloat(parts[4]) : undefined,
            httpOnly: parts[1] === 'TRUE',
            secure: parts[3] === 'TRUE'
          });
        }
      }
    });

    return cookies;
  }

  // Cambiar a una cuenta específica
  async switchAccount(account) {
    try {
      if (!this.isInitialized) {
        throw new Error('Bot no inicializado');
      }

      logger.info(`Cambiando a cuenta: ${account.name}`);

      // Limpiar cookies actuales
      const client = await this.page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');

      // Cargar cookies de la nueva cuenta
      await this.loadAccountCookies(account);

      // Navegar a la página principal para verificar sesión
      await this.page.goto(`${this.baseUrl}`, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      await this.randomWait();

      this.currentAccount = account;
      logger.info(`Cuenta activa: ${account.name}`);

      return true;

    } catch (error) {
      logger.error(`Error al cambiar a cuenta ${account.name}:`, error);
      throw error;
    }
  }

  // Publicar un producto
  async publishProduct(product, account) {
    try {
      if (!this.currentAccount || this.currentAccount.name !== account.name) {
        await this.switchAccount(account);
      }

      logger.info(`Iniciando publicación: ${product.nombre}`);

      // Generar variación del texto
      const variation = textRotator.generateVariation(product);

      // Navegar a página de publicación
      await this.navigateToPublishPage();

      // Llenar formulario
      await this.fillPublishForm(variation);

      // Enviar formulario
      const success = await this.submitPublishForm();

      if (success) {
        await logger.logPublication(product, account, 'success');
        logger.info(`Producto publicado exitosamente: ${product.nombre}`);
        return { success: true };
      } else {
        await logger.logPublication(product, account, 'error', 'No se pudo completar la publicación');
        return { success: false, error: 'No se pudo completar la publicación' };
      }

    } catch (error) {
      const errorMessage = error.message;
      await logger.logPublication(product, account, 'error', errorMessage);
      logger.error(`Error al publicar ${product.nombre}:`, error);
      return { success: false, error: errorMessage };
    }
  }

  // Navegar a página de publicación
  async navigateToPublishPage() {
    try {
      // Intentar encontrar botón de publicar
      const publishButton = await this.findElement(this.selectors.publishButton);
      
      if (publishButton) {
        await this.humanClick(publishButton);
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      } else {
        // Si no encuentra el botón, navegar directamente
        await this.page.goto(`${this.baseUrl}/publish`, { 
          waitUntil: 'networkidle2',
          timeout: 60000 
        });
      }

      await this.randomWait();
      logger.debug('Navegación a página de publicación completada');

    } catch (error) {
      logger.error('Error al navegar a página de publicación:', error);
      throw error;
    }
  }

  // Llenar formulario de publicación
  async fillPublishForm(variation) {
    try {
      const product = variation.originalProduct;

      // Título
      const titleField = await this.findElement(this.selectors.titleField);
      if (titleField) {
        await this.humanType(titleField, variation.title);
        await this.randomWait(500, 1000);
      }

      // Descripción
      const descriptionField = await this.findElement(this.selectors.descriptionField);
      if (descriptionField) {
        await this.humanType(descriptionField, variation.description);
        await this.randomWait(500, 1000);
      }

      // Categoría
      if (product.categoria) {
        const categorySelect = await this.findElement(this.selectors.categorySelect);
        if (categorySelect) {
          await this.selectOption(categorySelect, product.categoria);
          await this.randomWait(300, 800);
        }
      }

      // Ubicación
      if (product.ubicacion) {
        const locationSelect = await this.findElement(this.selectors.locationSelect);
        if (locationSelect) {
          await this.selectOption(locationSelect, product.ubicacion);
          await this.randomWait(300, 800);
        }
      }

      // Precio
      if (product.precio) {
        const priceField = await this.findElement(this.selectors.priceField);
        if (priceField) {
          await this.humanType(priceField, product.precio.toString());
          await this.randomWait(300, 800);
        }
      }

      // Teléfono
      if (product.contacto) {
        const phoneField = await this.findElement(this.selectors.phoneField);
        if (phoneField) {
          await this.humanType(phoneField, product.contacto);
          await this.randomWait(300, 800);
        }
      }

      // Imagen (si está disponible)
      if (product.imagenURL) {
        await this.handleImageUpload(product.imagenURL);
      }

      logger.debug('Formulario completado');

    } catch (error) {
      logger.error('Error al llenar formulario:', error);
      throw error;
    }
  }

  // Enviar formulario de publicación
  async submitPublishForm() {
    try {
      // Scroll para asegurar que el botón sea visible
      await this.randomScroll();

      const submitButton = await this.findElement(this.selectors.publishSubmitButton);
      if (!submitButton) {
        throw new Error('No se encontró el botón de envío');
      }

      await this.humanClick(submitButton);

      // Esperar por confirmación o redirección
      try {
        await this.page.waitForNavigation({ 
          waitUntil: 'networkidle2', 
          timeout: 30000 
        });
      } catch (navigationError) {
        // A veces no hay navegación, verificar mensaje de éxito
        logger.debug('No hubo navegación, verificando mensaje de éxito');
      }

      await this.randomWait(2000, 4000);

      // Verificar si la publicación fue exitosa
      const successIndicators = [
        this.selectors.successMessage,
        'text=publicado',
        'text=exitoso',
        'text=success'
      ];

      for (const indicator of successIndicators) {
        try {
          const element = await this.page.$(indicator);
          if (element) {
            logger.debug('Indicador de éxito encontrado');
            return true;
          }
        } catch (e) {
          // Continuar con el siguiente indicador
        }
      }

      // Si no hay indicadores claros, asumir éxito si no hay errores
      logger.debug('No se encontraron indicadores claros, asumiendo éxito');
      return true;

    } catch (error) {
      logger.error('Error al enviar formulario:', error);
      return false;
    }
  }

  // Manejar subida de imagen
  async handleImageUpload(imageURL) {
    try {
      // Por simplicidad, saltamos la subida de imágenes por ahora
      // En una implementación completa, aquí se descargaría la imagen
      // y se subiría al formulario
      logger.debug(`Imagen omitida: ${imageURL}`);
    } catch (error) {
      logger.warn('Error al manejar imagen:', error);
    }
  }

  // Encontrar elemento con múltiples selectores
  async findElement(selectors) {
    const selectorList = selectors.split(', ');
    
    for (const selector of selectorList) {
      try {
        const element = await this.page.$(selector.trim());
        if (element) {
          return element;
        }
      } catch (e) {
        // Continuar con el siguiente selector
      }
    }
    
    return null;
  }

  // Simular escritura humana
  async humanType(element, text) {
    await element.click({ clickCount: 3 }); // Seleccionar todo el contenido
    await this.randomWait(100, 300);
    
    for (const char of text) {
      await element.type(char, { 
        delay: Math.random() * (this.humanBehavior.typingSpeedMax - this.humanBehavior.typingSpeedMin) + this.humanBehavior.typingSpeedMin 
      });
    }
  }

  // Simular click humano
  async humanClick(element) {
    // Mover el mouse al elemento de forma natural
    const box = await element.boundingBox();
    if (box) {
      const x = box.x + box.width / 2 + (Math.random() - 0.5) * 10;
      const y = box.y + box.height / 2 + (Math.random() - 0.5) * 10;
      
      await this.page.mouse.move(x, y, { steps: 10 });
      await this.randomWait(100, 300);
    }
    
    await element.click();
    await this.randomWait(200, 500);
  }

  // Seleccionar opción en dropdown
  async selectOption(selectElement, value) {
    try {
      // Intentar seleccionar por valor exacto
      await selectElement.select(value);
    } catch (error) {
      // Si falla, intentar por texto parcial
      try {
        const options = await selectElement.$$('option');
        for (const option of options) {
          const text = await option.evaluate(el => el.textContent.toLowerCase());
          if (text.includes(value.toLowerCase())) {
            const optionValue = await option.evaluate(el => el.value);
            await selectElement.select(optionValue);
            return;
          }
        }
      } catch (fallbackError) {
        logger.warn(`No se pudo seleccionar opción: ${value}`);
      }
    }
  }

  // Scroll aleatorio para simular lectura
  async randomScroll() {
    const scrollDistance = Math.random() * 500 + 200;
    await this.page.evaluate((distance) => {
      window.scrollBy(0, distance);
    }, scrollDistance);
    
    await this.randomWait(this.humanBehavior.scrollPauseMin, this.humanBehavior.scrollPauseMax);
  }

  // Espera aleatoria para simular comportamiento humano
  async randomWait(min = null, max = null) {
    const waitMin = min || this.humanBehavior.waitMin;
    const waitMax = max || this.humanBehavior.waitMax;
    const waitTime = Math.random() * (waitMax - waitMin) + waitMin;
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Verificar si la sesión está activa
  async isSessionActive() {
    try {
      // Verificar si hay elementos que indican sesión activa
      const loginButton = await this.findElement(this.selectors.loginButton);
      return !loginButton; // Si no hay botón de login, la sesión está activa
    } catch (error) {
      return false;
    }
  }

  // Limpiar recursos
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      
      this.isInitialized = false;
      this.currentAccount = null;
      
      logger.info('Revolico Bot limpiado correctamente');
    } catch (error) {
      logger.error('Error al limpiar Revolico Bot:', error);
    }
  }

  // Obtener estado actual del bot
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentAccount: this.currentAccount?.name || null,
      browserActive: !!this.browser,
      pageActive: !!this.page
    };
  }
}

// Crear instancia singleton
const revolicoBot = new RevolicoBot();

module.exports = revolicoBot;