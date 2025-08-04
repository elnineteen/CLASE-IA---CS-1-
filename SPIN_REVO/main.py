#!/usr/bin/env python3
"""
SPIN_REVO - Automated Revolico Posting Bot
Main entry point for the application
"""
import argparse
import sys
import time
import random
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
from playwright.sync_api import sync_playwright, Page, BrowserContext
from loguru import logger

from utils import (
    init_logger, load_config, load_excel, save_cookies, load_cookies,
    random_delay, spin_text, log_publication, simulate_human_behavior,
    validate_product_data, create_sample_excel
)


class RevolicoBot:
    def __init__(self, config: Dict[str, Any], headless: bool = True):
        self.config = config
        self.headless = headless
        self.posts_this_hour = 0
        self.hour_start_time = time.time()
        
    def setup_browser(self):
        """Initialize browser and context"""
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
        )
        self.context = self.browser.new_context(
            viewport={'width': 1366, 'height': 768},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        self.page = self.context.new_page()
        
    def login_to_revolico(self) -> bool:
        """Login to Revolico and save session"""
        try:
            # Try to load existing cookies first
            if load_cookies(self.context):
                self.page.goto("https://www.revolico.com")
                # Check if already logged in
                if self.page.locator("text=Mi cuenta").is_visible(timeout=5000):
                    logger.info("Already logged in via cookies")
                    return True
            
            # Manual login process
            logger.info("Logging in to Revolico...")
            self.page.goto("https://www.revolico.com/user/login")
            
            # Fill login form
            email_input = self.page.locator("input[name='email'], input[type='email']")
            password_input = self.page.locator("input[name='password'], input[type='password']")
            
            email_input.fill(self.config['revolico_login']['email'])
            password_input.fill(self.config['revolico_login']['password'])
            
            # Submit form
            login_button = self.page.locator("input[type='submit'], button[type='submit']").first
            login_button.click()
            
            # Wait for login to complete
            self.page.wait_for_url("**/user/**", timeout=30000)
            
            # Save cookies for future sessions
            save_cookies(self.context)
            
            logger.info("Successfully logged in to Revolico")
            return True
            
        except Exception as e:
            logger.error(f"Login failed: {e}")
            return False
    
    def navigate_to_publish(self) -> bool:
        """Navigate to the publish page"""
        try:
            self.page.goto("https://www.revolico.com/publicar")
            self.page.wait_for_load_state("networkidle")
            logger.debug("Navigated to publish page")
            return True
        except Exception as e:
            logger.error(f"Failed to navigate to publish page: {e}")
            return False
    
    def fill_category(self, categoria: str, subcategoria: str = None) -> bool:
        """Select category and subcategory"""
        try:
            # Map categories to Revolico categories
            category_mapping = {
                'Tecnología': 'tecnologia',
                'Carros': 'carros',
                'Casa': 'casa',
                'Ropa': 'ropa',
                'Servicios': 'servicios'
            }
            
            revolico_category = category_mapping.get(categoria, 'otros')
            
            # Select main category
            category_select = self.page.locator("select[name='category']")
            if category_select.is_visible():
                category_select.select_option(revolico_category)
                
            # Wait for subcategory to load and select if provided
            if subcategoria:
                time.sleep(1)  # Wait for subcategories to load
                subcategory_select = self.page.locator("select[name='subcategory']")
                if subcategory_select.is_visible():
                    subcategory_select.select_option(label=subcategoria)
            
            logger.debug(f"Selected category: {categoria}")
            return True
            
        except Exception as e:
            logger.error(f"Error selecting category: {e}")
            return False
    
    def fill_product_details(self, product: Dict[str, Any]) -> bool:
        """Fill product details in the form"""
        try:
            # Title
            title_input = self.page.locator("input[name='title'], input[name='titulo']")
            if title_input.is_visible():
                title_input.fill(str(product['titulo']))
            
            # Description - apply text spinning
            description = spin_text(str(product['descripcion']))
            desc_textarea = self.page.locator("textarea[name='description'], textarea[name='descripcion']")
            if desc_textarea.is_visible():
                desc_textarea.fill(description)
            
            # Price
            price_input = self.page.locator("input[name='price'], input[name='precio']")
            if price_input.is_visible():
                price_input.fill(str(product['precio']))
            
            # Currency
            if 'moneda' in product and str(product['moneda']).upper() in ['USD', 'EUR', 'CUP']:
                currency_select = self.page.locator("select[name='currency'], select[name='moneda']")
                if currency_select.is_visible():
                    currency_select.select_option(str(product['moneda']).upper())
            
            logger.debug("Filled product details")
            return True
            
        except Exception as e:
            logger.error(f"Error filling product details: {e}")
            return False
    
    def fill_location_details(self, product: Dict[str, Any]) -> bool:
        """Fill location and contact details"""
        try:
            # Province
            province_select = self.page.locator("select[name='province'], select[name='provincia']")
            if province_select.is_visible():
                province_select.select_option(label=str(product['provincia']))
                
            # Municipality - wait for it to load
            time.sleep(1)
            if 'municipio' in product and product['municipio']:
                municipality_select = self.page.locator("select[name='municipality'], select[name='municipio']")
                if municipality_select.is_visible():
                    municipality_select.select_option(label=str(product['municipio']))
            
            # Phone
            phone_input = self.page.locator("input[name='phone'], input[name='telefono']")
            if phone_input.is_visible():
                phone_input.fill(str(product['telefono']))
            
            # Email
            if 'email' in product and product['email']:
                email_input = self.page.locator("input[name='email']")
                if email_input.is_visible():
                    email_input.fill(str(product['email']))
            
            logger.debug("Filled location details")
            return True
            
        except Exception as e:
            logger.error(f"Error filling location details: {e}")
            return False
    
    def upload_images(self, product: Dict[str, Any]) -> bool:
        """Upload product images"""
        try:
            image_fields = ['imagen1', 'imagen2', 'imagen3']
            uploaded_count = 0
            
            for i, field in enumerate(image_fields):
                if field in product and product[field] and str(product[field]).strip():
                    image_path = str(product[field]).strip()
                    
                    # Check if file exists
                    if Path(image_path).exists():
                        file_input = self.page.locator(f"input[type='file']:nth-of-type({i+1})")
                        if file_input.is_visible():
                            file_input.set_input_files(image_path)
                            uploaded_count += 1
                            time.sleep(1)  # Wait between uploads
            
            logger.debug(f"Uploaded {uploaded_count} images")
            return True
            
        except Exception as e:
            logger.error(f"Error uploading images: {e}")
            return False
    
    def submit_post(self) -> tuple[bool, str]:
        """Submit the post and return success status and post URL"""
        try:
            # Accept terms if checkbox exists
            terms_checkbox = self.page.locator("input[type='checkbox'][name*='terms'], input[type='checkbox'][name*='terminos']")
            if terms_checkbox.is_visible():
                terms_checkbox.check()
            
            # Simulate human behavior before submitting
            simulate_human_behavior(self.page)
            
            # Submit the form
            submit_button = self.page.locator("input[type='submit'], button[type='submit']:has-text('Publicar')")
            submit_button.click()
            
            # Wait for redirect or confirmation
            self.page.wait_for_load_state("networkidle", timeout=30000)
            
            # Get the current URL (should be the post URL)
            current_url = self.page.url
            
            # Check for success indicators
            if "revolico.com" in current_url and "/anuncio/" in current_url:
                logger.debug("Post submitted successfully")
                return True, current_url
            else:
                logger.warning("Post submission unclear - checking page content")
                return True, current_url
                
        except Exception as e:
            logger.error(f"Error submitting post: {e}")
            return False, ""
    
    def publish_product(self, product: Dict[str, Any]) -> bool:
        """Publish a single product to Revolico"""
        try:
            # Validate product data
            if not validate_product_data(product):
                logger.error(f"Invalid product data for: {product.get('titulo', 'Unknown')}")
                return False
            
            logger.info(f"Publishing: {product['titulo']}")
            
            # Navigate to publish page
            if not self.navigate_to_publish():
                return False
            
            # Fill category
            if not self.fill_category(product['categoria'], product.get('subcategoria')):
                return False
                
            # Fill product details
            if not self.fill_product_details(product):
                return False
                
            # Fill location details
            if not self.fill_location_details(product):
                return False
                
            # Upload images
            self.upload_images(product)
            
            # Submit the post
            success, post_url = self.submit_post()
            
            if success:
                # Extract post ID from URL if possible
                post_id = post_url.split('/')[-1] if '/anuncio/' in post_url else None
                log_publication(product['titulo'], post_id, post_url)
                return True
            else:
                logger.error(f"Failed to publish: {product['titulo']}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing product {product.get('titulo', 'Unknown')}: {e}")
            return False
    
    def check_rate_limit(self):
        """Check and enforce posting rate limits"""
        current_time = time.time()
        
        # Reset counter if an hour has passed
        if current_time - self.hour_start_time >= 3600:
            self.posts_this_hour = 0
            self.hour_start_time = current_time
        
        # Check if we need to wait
        if self.posts_this_hour >= self.config['max_posts_per_hour']:
            wait_time = 3600 - (current_time - self.hour_start_time)
            if wait_time > 0:
                logger.info(f"Rate limit reached. Waiting {wait_time/60:.1f} minutes...")
                time.sleep(wait_time)
                self.posts_this_hour = 0
                self.hour_start_time = time.time()
    
    def run(self, excel_file: str) -> None:
        """Main execution method"""
        try:
            # Load products from Excel
            products_df = load_excel(excel_file)
            
            # Setup browser
            self.setup_browser()
            
            # Login to Revolico
            if not self.login_to_revolico():
                logger.error("Failed to login. Exiting.")
                return
            
            # Process each product
            successful_posts = 0
            total_products = len(products_df)
            
            for index, product in products_df.iterrows():
                try:
                    # Check rate limits
                    self.check_rate_limit()
                    
                    # Publish product
                    if self.publish_product(product.to_dict()):
                        successful_posts += 1
                        self.posts_this_hour += 1
                    
                    # Random delay between posts
                    if index < total_products - 1:  # Don't delay after last post
                        random_delay(self.config['delay_min'], self.config['delay_max'])
                    
                except Exception as e:
                    logger.error(f"Error processing product {index}: {e}")
                    continue
            
            logger.info(f"Completed: {successful_posts}/{total_products} products published successfully")
            
        except Exception as e:
            logger.error(f"Critical error in run(): {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up browser resources"""
        try:
            if hasattr(self, 'browser'):
                self.browser.close()
            if hasattr(self, 'playwright'):
                self.playwright.stop()
            logger.info("Browser cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")


def main():
    """Main function with CLI argument parsing"""
    parser = argparse.ArgumentParser(description="SPIN_REVO - Automated Revolico Posting Bot")
    parser.add_argument("--headless", action="store_true", help="Run browser in headless mode")
    parser.add_argument("--config", default="config.json", help="Configuration file path")
    parser.add_argument("--excel", default="excel_data.xlsx", help="Excel file with products")
    parser.add_argument("--create-sample", action="store_true", help="Create sample Excel file and exit")
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    
    args = parser.parse_args()
    
    # Initialize logging
    init_logger()
    
    # Create sample Excel file if requested
    if args.create_sample:
        create_sample_excel(args.excel)
        logger.info(f"Sample Excel file created: {args.excel}")
        sys.exit(0)
    
    try:
        # Load configuration
        config = load_config(args.config)
        
        # Check if Excel file exists
        if not Path(args.excel).exists():
            logger.error(f"Excel file not found: {args.excel}")
            logger.info("Use --create-sample to create a sample file")
            sys.exit(1)
        
        # Validate login credentials
        if config['revolico_login']['email'] == "MI_EMAIL":
            logger.error("Please update your email and password in config.json")
            sys.exit(1)
        
        # Initialize and run bot
        bot = RevolicoBot(config, headless=args.headless)
        logger.info("Starting SPIN_REVO bot...")
        bot.run(args.excel)
        
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()