#!/bin/bash
# SPIN_REVO Installation Script

echo "🚀 Installing SPIN_REVO..."

# Check if running in restricted environment
echo "📋 Checking Python environment..."
if python3 -c "import pip" 2>/dev/null; then
    echo "✅ pip available"
    
    # Try installing with user flag first
    echo "📦 Installing Python packages..."
    python3 -m pip install --user playwright pandas openpyxl loguru || {
        echo "⚠️ User install failed, trying with --break-system-packages..."
        python3 -m pip install --break-system-packages playwright pandas openpyxl loguru
    }
    
    # Install Playwright browsers
    echo "🌐 Installing Playwright browsers..."
    python3 -m playwright install chromium || {
        echo "⚠️ Playwright install failed - you may need to install manually"
    }
    
    echo "✅ Installation complete!"
    
else
    echo "❌ pip not available. Manual installation required:"
    echo "   1. Install python3-pip: apt install python3-pip"
    echo "   2. Install packages: pip install playwright pandas openpyxl loguru"
    echo "   3. Install browsers: playwright install"
fi

# Create sample Excel file
echo "📄 Creating sample Excel file..."
python3 -c "
import pandas as pd
import sys

try:
    sample_data = {
        'titulo': ['iPhone 13 Pro Max 256GB', 'MacBook Air M2 2022', 'AirPods Pro 2da Generación'],
        'descripcion': ['iPhone 13 Pro Max en excelente estado, 256GB de almacenamiento, batería al 95%', 'MacBook Air con chip M2, 8GB RAM, 256GB SSD, como nuevo', 'AirPods Pro 2da generación con cancelación de ruido activa'],
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
    df.to_excel('excel_data.xlsx', index=False)
    print('✅ Sample Excel file created: excel_data.xlsx')
    
except ImportError:
    print('⚠️ Pandas not available yet. Using CSV fallback.')
    print('✅ Use excel_data.csv for now, convert to Excel after installing pandas')
except Exception as e:
    print(f'⚠️ Error creating Excel: {e}')
"

echo ""
echo "🎯 Next steps:"
echo "1. Edit config.json with your Revolico credentials"
echo "2. Update excel_data.xlsx with your products"
echo "3. Run: python3 main.py --help"
echo ""
echo "📖 For detailed instructions, see README.md"