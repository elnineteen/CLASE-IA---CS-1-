#!/usr/bin/env python3
"""
Revolico Automation App
Automatiza la búsqueda de productos en Revolico.cu
"""

import requests
from bs4 import BeautifulSoup
import time
import json
import re
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
import argparse
from dataclasses import dataclass
from typing import List, Dict, Optional
import os

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('revolico_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class Product:
    """Clase para representar un producto de Revolico"""
    title: str
    price: str
    location: str
    description: str
    contact: str
    url: str
    date: str
    
    def to_dict(self) -> Dict:
        return {
            'title': self.title,
            'price': self.price,
            'location': self.location,
            'description': self.description,
            'contact': self.contact,
            'url': self.url,
            'date': self.date
        }

class RevolicoAutomation:
    """Clase principal para automatización de Revolico"""
    
    def __init__(self, config_file: str = 'config.json'):
        self.config = self.load_config(config_file)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.found_products = []
        self.seen_products = set()
        
    def load_config(self, config_file: str) -> Dict:
        """Cargar configuración desde archivo JSON"""
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Archivo de configuración {config_file} no encontrado")
            return self.get_default_config()
        except json.JSONDecodeError:
            logger.error(f"Error al decodificar {config_file}")
            return self.get_default_config()
    
    def get_default_config(self) -> Dict:
        """Configuración por defecto"""
        return {
            "search_terms": ["iphone", "laptop"],
            "max_price": 1000,
            "min_price": 0,
            "locations": ["havana", "matanzas"],
            "categories": ["electronica", "celulares"],
            "check_interval": 300,  # 5 minutos
            "notifications": {
                "email": {
                    "enabled": False,
                    "smtp_server": "smtp.gmail.com",
                    "smtp_port": 587,
                    "username": "",
                    "password": "",
                    "to_email": ""
                }
            },
            "filters": {
                "exclude_keywords": ["dañado", "roto", "no funciona"],
                "require_keywords": []
            }
        }
    
    def search_revolico(self, search_term: str, category: str = "") -> List[Product]:
        """Buscar productos en Revolico"""
        products = []
        
        try:
            # Construir URL de búsqueda
            base_url = "https://www.revolico.com"
            search_url = f"{base_url}/search"
            
            params = {
                'q': search_term,
                'category': category
            }
            
            logger.info(f"Buscando: {search_term} en categoría: {category}")
            response = self.session.get(search_url, params=params, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Buscar elementos de productos (adaptado a la estructura de Revolico)
            product_elements = soup.find_all('div', class_=['listing-item', 'item', 'product-item'])
            
            for element in product_elements:
                try:
                    product = self.extract_product_info(element, base_url)
                    if product and self.filter_product(product):
                        products.append(product)
                except Exception as e:
                    logger.warning(f"Error extrayendo producto: {e}")
                    continue
                    
        except requests.RequestException as e:
            logger.error(f"Error de conexión: {e}")
        except Exception as e:
            logger.error(f"Error inesperado: {e}")
            
        return products
    
    def extract_product_info(self, element, base_url: str) -> Optional[Product]:
        """Extraer información de un producto del HTML"""
        try:
            # Título
            title_elem = element.find(['h2', 'h3', 'a'], class_=['title', 'listing-title'])
            title = title_elem.get_text(strip=True) if title_elem else "Sin título"
            
            # Precio
            price_elem = element.find(['span', 'div'], class_=['price', 'cost'])
            price = price_elem.get_text(strip=True) if price_elem else "No especificado"
            
            # Ubicación
            location_elem = element.find(['span', 'div'], class_=['location', 'place'])
            location = location_elem.get_text(strip=True) if location_elem else "No especificado"
            
            # Descripción
            desc_elem = element.find(['p', 'div'], class_=['description', 'content'])
            description = desc_elem.get_text(strip=True) if desc_elem else ""
            
            # Contacto
            contact_elem = element.find(['span', 'div'], class_=['contact', 'phone'])
            contact = contact_elem.get_text(strip=True) if contact_elem else "No especificado"
            
            # URL
            url_elem = element.find('a', href=True)
            url = base_url + url_elem['href'] if url_elem and url_elem['href'].startswith('/') else (url_elem['href'] if url_elem else "")
            
            # Fecha
            date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            return Product(
                title=title,
                price=price,
                location=location,
                description=description,
                contact=contact,
                url=url,
                date=date
            )
            
        except Exception as e:
            logger.warning(f"Error extrayendo información del producto: {e}")
            return None
    
    def filter_product(self, product: Product) -> bool:
        """Filtrar productos según criterios configurados"""
        try:
            # Verificar si ya fue visto
            product_id = f"{product.title}_{product.price}_{product.location}"
            if product_id in self.seen_products:
                return False
            
            # Filtro de precio
            price_numbers = re.findall(r'\d+', product.price)
            if price_numbers:
                price_value = int(price_numbers[0])
                if price_value < self.config['min_price'] or price_value > self.config['max_price']:
                    return False
            
            # Filtro de palabras excluidas
            exclude_keywords = self.config['filters']['exclude_keywords']
            text_to_check = f"{product.title} {product.description}".lower()
            
            for keyword in exclude_keywords:
                if keyword.lower() in text_to_check:
                    return False
            
            # Filtro de palabras requeridas
            require_keywords = self.config['filters']['require_keywords']
            if require_keywords:
                for keyword in require_keywords:
                    if keyword.lower() not in text_to_check:
                        return False
            
            # Agregar a productos vistos
            self.seen_products.add(product_id)
            return True
            
        except Exception as e:
            logger.warning(f"Error filtrando producto: {e}")
            return False
    
    def send_notification(self, products: List[Product]):
        """Enviar notificación por email"""
        if not self.config['notifications']['email']['enabled']:
            return
        
        try:
            email_config = self.config['notifications']['email']
            
            msg = MIMEMultipart()
            msg['From'] = email_config['username']
            msg['To'] = email_config['to_email']
            msg['Subject'] = f"Revolico: {len(products)} nuevos productos encontrados"
            
            # Crear cuerpo del email
            body = "Se encontraron nuevos productos en Revolico:\n\n"
            for product in products:
                body += f"Título: {product.title}\n"
                body += f"Precio: {product.price}\n"
                body += f"Ubicación: {product.location}\n"
                body += f"Contacto: {product.contact}\n"
                body += f"URL: {product.url}\n"
                body += "-" * 50 + "\n"
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Enviar email
            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['username'], email_config['password'])
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Notificación enviada: {len(products)} productos")
            
        except Exception as e:
            logger.error(f"Error enviando notificación: {e}")
    
    def save_results(self, products: List[Product], filename: str = None):
        """Guardar resultados en archivo JSON"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"revolico_results_{timestamp}.json"
        
        try:
            data = {
                'timestamp': datetime.now().isoformat(),
                'total_products': len(products),
                'products': [product.to_dict() for product in products]
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Resultados guardados en {filename}")
            
        except Exception as e:
            logger.error(f"Error guardando resultados: {e}")
    
    def run_search(self) -> List[Product]:
        """Ejecutar búsqueda única"""
        all_products = []
        
        for search_term in self.config['search_terms']:
            for category in self.config.get('categories', ['']):
                products = self.search_revolico(search_term, category)
                all_products.extend(products)
                time.sleep(2)  # Pausa entre búsquedas
        
        if all_products:
            logger.info(f"Encontrados {len(all_products)} productos nuevos")
            self.save_results(all_products)
            self.send_notification(all_products)
        
        return all_products
    
    def run_continuous(self):
        """Ejecutar monitoreo continuo"""
        logger.info("Iniciando monitoreo continuo de Revolico")
        
        try:
            while True:
                logger.info("Ejecutando búsqueda...")
                products = self.run_search()
                
                if products:
                    print(f"\n¡{len(products)} nuevos productos encontrados!")
                    for product in products[:5]:  # Mostrar solo los primeros 5
                        print(f"- {product.title} ({product.price}) - {product.location}")
                
                interval = self.config['check_interval']
                logger.info(f"Esperando {interval} segundos hasta la próxima búsqueda...")
                time.sleep(interval)
                
        except KeyboardInterrupt:
            logger.info("Monitoreo detenido por el usuario")
        except Exception as e:
            logger.error(f"Error en monitoreo continuo: {e}")

def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Automatización de Revolico')
    parser.add_argument('--config', default='config.json', help='Archivo de configuración')
    parser.add_argument('--mode', choices=['search', 'monitor'], default='search', 
                       help='Modo: búsqueda única o monitoreo continuo')
    parser.add_argument('--output', help='Archivo de salida para resultados')
    
    args = parser.parse_args()
    
    # Crear instancia de automatización
    automation = RevolicoAutomation(args.config)
    
    if args.mode == 'search':
        products = automation.run_search()
        if args.output:
            automation.save_results(products, args.output)
        
        print(f"\nBúsqueda completada. Encontrados {len(products)} productos.")
        for product in products:
            print(f"- {product.title} ({product.price}) - {product.location}")
    
    elif args.mode == 'monitor':
        automation.run_continuous()

if __name__ == "__main__":
    main()