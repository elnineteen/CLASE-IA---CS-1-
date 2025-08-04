"""
SPIN_REVO Utils - Helper functions for Revolico automation
"""
import json
import random
import time
import re
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
from loguru import logger
from playwright.sync_api import BrowserContext


def load_excel(path: str) -> pd.DataFrame:
    """Load products from Excel file"""
    try:
        df = pd.read_excel(path)
        logger.info(f"Loaded {len(df)} products from {path}")
        return df
    except Exception as e:
        logger.error(f"Error loading Excel file {path}: {e}")
        raise


def random_delay(min_seconds: int, max_seconds: int) -> None:
    """Wait for a random amount of time between min and max seconds"""
    delay = random.uniform(min_seconds, max_seconds)
    logger.debug(f"Waiting {delay:.2f} seconds...")
    time.sleep(delay)


def init_logger(log_file: str = "logs/publicaciones.log") -> None:
    """Initialize loguru logger with custom format"""
    # Remove default logger
    logger.remove()
    
    # Add file logger
    logger.add(
        log_file,
        format="[{time:YYYY-MM-DD HH:mm}] {level} {message}",
        level="INFO",
        rotation="1 MB",
        retention="1 month"
    )
    
    # Add console logger
    logger.add(
        lambda msg: print(msg, end=""),
        format="[{time:HH:mm:ss}] {level} {message}",
        level="INFO",
        colorize=True
    )
    
    logger.info("Logger initialized")


def save_cookies(context: BrowserContext, cookies_file: str = "cookies.json") -> None:
    """Save browser cookies to JSON file"""
    try:
        cookies = context.cookies()
        with open(cookies_file, 'w') as f:
            json.dump(cookies, f, indent=2)
        logger.info(f"Cookies saved to {cookies_file}")
    except Exception as e:
        logger.error(f"Error saving cookies: {e}")


def load_cookies(context: BrowserContext, cookies_file: str = "cookies.json") -> bool:
    """Load cookies from JSON file into browser context"""
    try:
        if not Path(cookies_file).exists():
            logger.warning(f"Cookies file {cookies_file} not found")
            return False
            
        with open(cookies_file, 'r') as f:
            cookies = json.load(f)
        
        context.add_cookies(cookies)
        logger.info(f"Cookies loaded from {cookies_file}")
        return True
    except Exception as e:
        logger.error(f"Error loading cookies: {e}")
        return False


def slugify(text: str) -> str:
    """Clean and sanitize text for safe usage"""
    if not text:
        return ""
    
    # Remove special characters and normalize
    text = re.sub(r'[^\w\s-]', '', str(text).strip())
    text = re.sub(r'[-\s]+', '-', text)
    return text.lower()


def spin_text(text: str) -> str:
    """Basic text spinning to avoid duplicate content detection"""
    if not text:
        return text
    
    # Simple word replacements to vary content
    replacements = {
        'excelente': ['bueno', 'óptimo', 'magnífico'],
        'precio': ['costo', 'valor', 'importe'],
        'producto': ['artículo', 'item', 'mercancía'],
        'venta': ['oferta', 'oportunidad'],
        'nuevo': ['flamante', 'reciente'],
        'usado': ['seminuevo', 'de segunda mano'],
    }
    
    words = text.split()
    spun_words = []
    
    for word in words:
        word_lower = word.lower().strip('.,!?')
        if word_lower in replacements:
            # 30% chance to replace
            if random.random() < 0.3:
                replacement = random.choice(replacements[word_lower])
                # Preserve original capitalization
                if word[0].isupper():
                    replacement = replacement.capitalize()
                spun_words.append(replacement)
            else:
                spun_words.append(word)
        else:
            spun_words.append(word)
    
    return ' '.join(spun_words)


def load_config(config_file: str = "config.json") -> Dict[str, Any]:
    """Load configuration from JSON file"""
    try:
        with open(config_file, 'r') as f:
            config = json.load(f)
        logger.info(f"Configuration loaded from {config_file}")
        return config
    except Exception as e:
        logger.error(f"Error loading config: {e}")
        raise


def log_publication(title: str, post_id: Optional[str] = None, url: Optional[str] = None) -> None:
    """Log successful publication"""
    if post_id and url:
        logger.info(f"✔ Publicado: {title} | ID {post_id} ({url})")
    else:
        logger.info(f"✔ Publicado: {title}")


def create_sample_excel(filename: str = "excel_data.xlsx") -> None:
    """Create a sample Excel file with product data structure"""
    sample_data = {
        'titulo': [
            'iPhone 13 Pro Max 256GB',
            'MacBook Air M2 2022',
            'AirPods Pro 2da Generación'
        ],
        'descripcion': [
            'iPhone 13 Pro Max en excelente estado, 256GB de almacenamiento, batería al 95%',
            'MacBook Air con chip M2, 8GB RAM, 256GB SSD, como nuevo',
            'AirPods Pro 2da generación con cancelación de ruido activa'
        ],
        'precio': [850, 1200, 180],
        'moneda': ['USD', 'USD', 'USD'],
        'categoria': ['Tecnología', 'Tecnología', 'Tecnología'],
        'subcategoria': ['Celulares', 'Computadoras', 'Accesorios'],
        'provincia': ['La Habana', 'La Habana', 'La Habana'],
        'municipio': ['Playa', 'Centro Habana', 'Vedado'],
        'telefono': ['53123456', '53234567', '53345678'],
        'email': ['contacto1@email.com', 'contacto2@email.com', 'contacto3@email.com'],
        'imagen1': ['iphone13.jpg', 'macbook.jpg', 'airpods.jpg'],
        'imagen2': ['iphone13_2.jpg', 'macbook_2.jpg', ''],
        'imagen3': ['', '', '']
    }
    
    df = pd.DataFrame(sample_data)
    df.to_excel(filename, index=False)
    logger.info(f"Sample Excel file created: {filename}")


def simulate_human_behavior(page) -> None:
    """Simulate human-like behavior with random scrolling and mouse movements"""
    try:
        # Random scroll
        scroll_amount = random.randint(100, 500)
        page.mouse.wheel(0, scroll_amount)
        time.sleep(random.uniform(0.5, 1.5))
        
        # Random mouse movement
        viewport_size = page.viewport_size
        if viewport_size:
            x = random.randint(100, viewport_size['width'] - 100)
            y = random.randint(100, viewport_size['height'] - 100)
            page.mouse.move(x, y)
            time.sleep(random.uniform(0.2, 0.8))
            
    except Exception as e:
        logger.debug(f"Error simulating human behavior: {e}")


def validate_product_data(product: Dict[str, Any]) -> bool:
    """Validate that product has required fields"""
    required_fields = ['titulo', 'descripcion', 'precio', 'categoria', 'provincia', 'telefono']
    
    for field in required_fields:
        if field not in product or pd.isna(product[field]) or product[field] == '':
            logger.warning(f"Product missing required field: {field}")
            return False
    
    return True