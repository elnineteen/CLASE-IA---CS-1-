#!/usr/bin/env python3
"""
Ejemplos de uso de la aplicación de automatización de Revolico
"""

from revolico_automation import RevolicoAutomation
import json
import time

def ejemplo_busqueda_iphone():
    """Ejemplo: Buscar iPhones en un rango de precio específico"""
    print("🔍 Ejemplo 1: Buscando iPhones...")
    
    # Configuración personalizada para iPhones
    config = {
        "search_terms": ["iphone 12", "iphone 13", "iphone 14"],
        "max_price": 800,
        "min_price": 300,
        "locations": ["havana", "matanzas"],
        "categories": ["electronica", "celulares"],
        "check_interval": 300,
        "notifications": {
            "email": {"enabled": False}
        },
        "filters": {
            "exclude_keywords": ["dañado", "roto", "replica"],
            "require_keywords": ["original"]
        }
    }
    
    # Guardar configuración temporal
    with open('config_iphone.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    # Ejecutar búsqueda
    automation = RevolicoAutomation('config_iphone.json')
    productos = automation.run_search()
    
    print(f"✅ Encontrados {len(productos)} iPhones")
    for producto in productos[:3]:  # Mostrar solo los primeros 3
        print(f"   📱 {producto.title} - {producto.price}")

def ejemplo_busqueda_autos():
    """Ejemplo: Buscar autos japoneses en La Habana"""
    print("\n🚗 Ejemplo 2: Buscando autos japoneses...")
    
    config = {
        "search_terms": ["toyota", "honda", "nissan", "mazda"],
        "max_price": 20000,
        "min_price": 5000,
        "locations": ["havana"],
        "categories": ["autos"],
        "check_interval": 600,
        "notifications": {
            "email": {"enabled": False}
        },
        "filters": {
            "exclude_keywords": ["accidentado", "chocado", "fundido"],
            "require_keywords": []
        }
    }
    
    with open('config_autos.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    automation = RevolicoAutomation('config_autos.json')
    productos = automation.run_search()
    
    print(f"✅ Encontrados {len(productos)} autos japoneses")
    for producto in productos[:2]:
        print(f"   🚗 {producto.title} - {producto.price} - {producto.location}")

def ejemplo_busqueda_laptops():
    """Ejemplo: Buscar laptops para trabajo"""
    print("\n💻 Ejemplo 3: Buscando laptops para trabajo...")
    
    config = {
        "search_terms": ["laptop", "macbook", "thinkpad", "dell"],
        "max_price": 1500,
        "min_price": 400,
        "locations": ["havana", "matanzas", "villa clara"],
        "categories": ["electronica", "computadoras"],
        "check_interval": 450,
        "notifications": {
            "email": {"enabled": False}
        },
        "filters": {
            "exclude_keywords": ["lento", "virus", "pantalla rota"],
            "require_keywords": ["ssd", "intel"]
        }
    }
    
    with open('config_laptops.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    automation = RevolicoAutomation('config_laptops.json')
    productos = automation.run_search()
    
    print(f"✅ Encontradas {len(productos)} laptops")
    for producto in productos[:2]:
        print(f"   💻 {producto.title} - {producto.price}")

def ejemplo_configuracion_email():
    """Ejemplo: Configurar notificaciones por email"""
    print("\n📧 Ejemplo 4: Configuración de notificaciones por email")
    
    config_email = {
        "search_terms": ["iphone"],
        "max_price": 600,
        "min_price": 200,
        "check_interval": 300,
        "notifications": {
            "email": {
                "enabled": True,  # ⚠️ Cambiar a True para activar
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "username": "tu_email@gmail.com",  # ⚠️ Cambiar por tu email
                "password": "tu_contraseña_de_app",  # ⚠️ Usar contraseña de aplicación
                "to_email": "destinatario@gmail.com"  # ⚠️ Email de destino
            }
        },
        "filters": {
            "exclude_keywords": ["dañado"],
            "require_keywords": []
        }
    }
    
    print("📋 Configuración para notificaciones por email:")
    print("   1. Habilita autenticación de 2 factores en Gmail")
    print("   2. Genera una 'contraseña de aplicación'")
    print("   3. Actualiza los campos de email en config.json")
    print("   4. Cambia 'enabled' a true")
    
    # Guardar ejemplo de configuración
    with open('config_email_ejemplo.json', 'w', encoding='utf-8') as f:
        json.dump(config_email, f, ensure_ascii=False, indent=2)
    
    print("   ✅ Archivo de ejemplo guardado: config_email_ejemplo.json")

def ejemplo_monitoreo_continuo():
    """Ejemplo: Simular monitoreo continuo (versión demo)"""
    print("\n⏰ Ejemplo 5: Monitoreo continuo (demo de 3 ciclos)")
    
    config = {
        "search_terms": ["celular"],
        "max_price": 500,
        "min_price": 100,
        "check_interval": 10,  # Solo 10 segundos para la demo
        "notifications": {
            "email": {"enabled": False}
        },
        "filters": {
            "exclude_keywords": ["dañado"],
            "require_keywords": []
        }
    }
    
    with open('config_demo.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    
    automation = RevolicoAutomation('config_demo.json')
    
    print("🔄 Iniciando monitoreo demo (3 ciclos)...")
    for i in range(3):
        print(f"\n   📡 Ciclo {i+1}/3")
        productos = automation.run_search()
        print(f"   ✅ Encontrados {len(productos)} productos")
        
        if i < 2:  # No esperar en el último ciclo
            print("   ⏳ Esperando 10 segundos...")
            time.sleep(10)
    
    print("\n✅ Demo de monitoreo completada")

def ejemplo_analisis_resultados():
    """Ejemplo: Analizar resultados guardados"""
    print("\n📊 Ejemplo 6: Analizando resultados anteriores...")
    
    # Ejecutar una búsqueda rápida para tener datos
    automation = RevolicoAutomation()
    productos = automation.run_search()
    
    if productos:
        filename = f"analisis_resultados_{int(time.time())}.json"
        automation.save_results(productos, filename)
        
        # Leer y analizar
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"📈 Análisis del archivo: {filename}")
        print(f"   • Total de productos: {data['total_products']}")
        
        if data['products']:
            precios = []
            ubicaciones = {}
            
            for producto in data['products']:
                # Extraer precio numérico
                precio_str = producto['price']
                numeros = [int(x) for x in precio_str.split() if x.isdigit()]
                if numeros:
                    precios.append(numeros[0])
                
                # Contar ubicaciones
                ubicacion = producto['location']
                ubicaciones[ubicacion] = ubicaciones.get(ubicacion, 0) + 1
            
            if precios:
                print(f"   • Precio promedio: ${sum(precios)/len(precios):.2f}")
                print(f"   • Precio más bajo: ${min(precios)}")
                print(f"   • Precio más alto: ${max(precios)}")
            
            if ubicaciones:
                print("   • Distribución por ubicación:")
                for lugar, cantidad in sorted(ubicaciones.items(), key=lambda x: x[1], reverse=True):
                    print(f"     - {lugar}: {cantidad} productos")
    else:
        print("   ℹ️ No hay productos para analizar en este momento")

def main():
    """Ejecutar todos los ejemplos"""
    print("🚀 Revolico Automation - Ejemplos de Uso")
    print("=" * 50)
    
    try:
        ejemplo_busqueda_iphone()
        ejemplo_busqueda_autos()
        ejemplo_busqueda_laptops()
        ejemplo_configuracion_email()
        ejemplo_monitoreo_continuo()
        ejemplo_analisis_resultados()
        
        print("\n" + "=" * 50)
        print("✅ Todos los ejemplos completados")
        print("\n📚 Para usar en la vida real:")
        print("   1. Edita config.json con tus preferencias")
        print("   2. Ejecuta: python revolico_automation.py --mode search")
        print("   3. Para monitoreo: python revolico_automation.py --mode monitor")
        
    except Exception as e:
        print(f"\n❌ Error ejecutando ejemplos: {e}")
        print("💡 Asegúrate de tener conexión a internet")

if __name__ == "__main__":
    main()