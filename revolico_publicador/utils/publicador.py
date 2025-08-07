from __future__ import annotations

import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, sync_playwright

MOBILE_USER_AGENTS = [
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 9; Mi A2 Lite) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1",
]


class CaptchaDetected(Exception):
    pass


@dataclass
class PublicadorConfig:
    headless: bool = False
    delay_min: int = 3
    delay_max: int = 7
    base_url: str = "https://www.revolico.com/publicar"


class Publicador:
    """Encapsula la automatización con Playwright para publicar un anuncio."""

    def __init__(self, headless: bool = False, delay_min: int = 3, delay_max: int = 7, base_url: Optional[str] = None) -> None:
        self.config = PublicadorConfig(
            headless=headless,
            delay_min=delay_min,
            delay_max=delay_max,
            base_url=base_url or PublicadorConfig.base_url,
        )
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None
        self._ensure_browser()

    def _ensure_browser(self) -> None:
        if self._page is not None:
            return
        self._playwright = sync_playwright().start()
        ua = random.choice(MOBILE_USER_AGENTS)
        self._browser = self._playwright.chromium.launch(headless=self.config.headless)
        self._context = self._browser.new_context(user_agent=ua, viewport={"width": 390, "height": 844})
        self._page = self._context.new_page()

    def _rand_sleep(self) -> None:
        delay = random.uniform(self.config.delay_min, self.config.delay_max)
        time.sleep(delay)

    def _check_captcha(self, page: Page) -> None:
        # Heuristic: check for recaptcha or captcha iframe/div
        selectors = [
            "iframe[src*='recaptcha']",
            "div.g-recaptcha",
            "div[id*='recaptcha']",
            "div[class*='captcha']",
        ]
        for sel in selectors:
            try:
                el = page.query_selector(sel)
                if el is not None:
                    raise CaptchaDetected("CAPTCHA DETECTADO – PAUSADO")
            except Exception:
                continue

    def publicar(self, anuncio: Dict[str, object]) -> bool:
        if self._page is None:
            raise RuntimeError("Browser no inicializado")
        page = self._page

        page.goto(self.config.base_url, wait_until="domcontentloaded")
        self._check_captcha(page)

        # Rellenar campos. Los selectores son placeholders robustos; ajústalos según el DOM real.
        # Preferimos data-testid si existe; si no, usamos labels o name/id.
        mappings = {
            "Categoria": "select[name='category'], [data-testid='category-select']",
            "Subcategoria": "select[name='subcategory'], [data-testid='subcategory-select']",
            "Titulo": "input[name='title'], [data-testid='title-input']",
            "Descripcion": "textarea[name='description'], [data-testid='description-textarea']",
            "Precio": "input[name='price'], [data-testid='price-input']",
            "Moneda": "select[name='currency'], [data-testid='currency-select']",
            "Provincia": "select[name='province'], [data-testid='province-select']",
            "Municipio": "select[name='municipality'], [data-testid='municipality-select']",
            "Telefono": "input[name='phone'], [data-testid='phone-input']",
            "Email": "input[name='email'], [data-testid='email-input']",
            # Imagen: input type=file
            "Fotos": "input[type='file'][name='image'], input[type='file'][data-testid='image-input']",
        }

        # Imagen primero para detectar preview OK
        foto_path = anuncio.get("Fotos")
        if isinstance(foto_path, (str, Path)) and str(foto_path).strip():
            file_input = page.query_selector(mappings["Fotos"])  # type: ignore[arg-type]
            if file_input is None:
                raise RuntimeError("No se encontró input de archivo para la imagen")
            file_input.set_input_files(str(foto_path))
            self._rand_sleep()

        # Campos de texto/selects
        def fill_selector(selector: str, value: object) -> None:
            if value is None:
                return
            el = page.query_selector(selector)
            if el is None:
                return
            tag = el.evaluate("el => el.tagName.toLowerCase()")
            if tag == "select":
                el.select_option(label=str(value))
            else:
                el.fill(str(value))

        for key, selector in mappings.items():
            if key == "Fotos":
                continue
            if key in anuncio:
                fill_selector(selector, anuncio[key])
                self._rand_sleep()

        # Enviar formulario
        submit_selector = "button[type='submit'], [data-testid='submit-button']"
        submit = page.query_selector(submit_selector)
        if submit is None:
            raise RuntimeError("No se encontró botón de envío")
        submit.click()

        # Esperar resultado
        page.wait_for_load_state("networkidle", timeout=15000)
        self._check_captcha(page)

        # Detectar éxito/error
        success = page.query_selector("text=/Publicado|Éxito|Success|Gracias/i, [data-testid='publish-success']")
        error = page.query_selector(".error, [data-testid='publish-error'], text=/Error|falló/i")
        if success is not None and error is None:
            return True
        return False

    def cerrar(self) -> None:
        try:
            if self._context is not None:
                self._context.close()
            if self._browser is not None:
                self._browser.close()
        finally:
            if self._playwright is not None:
                self._playwright.stop()
                self._playwright = None
                self._browser = None
                self._context = None
                self._page = None