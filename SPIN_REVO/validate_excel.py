#!/usr/bin/env python3
"""
Excel Validation Tool for SPIN_REVO
Checks if your Excel file is compatible with the bot
"""
import sys
import pandas as pd
from pathlib import Path

def validate_excel_file(file_path):
    """Validate Excel file structure and data"""
    print(f"🔍 Validating Excel file: {file_path}")
    
    # Required columns
    required_columns = ['titulo', 'descripcion', 'precio', 'categoria', 'provincia', 'telefono']
    optional_columns = ['moneda', 'subcategoria', 'municipio', 'email', 'imagen1', 'imagen2', 'imagen3']
    
    try:
        # Load Excel file
        if not Path(file_path).exists():
            print(f"❌ File not found: {file_path}")
            return False
            
        # Try to read the file
        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            print(f"❌ Cannot read Excel file: {e}")
            print("💡 Make sure it's saved as .xlsx format")
            return False
        
        print(f"📊 Found {len(df)} rows of data")
        
        # Check if file is empty
        if len(df) == 0:
            print("❌ Excel file is empty")
            return False
        
        # Check required columns
        missing_required = []
        for col in required_columns:
            if col not in df.columns:
                missing_required.append(col)
        
        if missing_required:
            print(f"❌ Missing required columns: {missing_required}")
            print(f"📋 Required columns: {required_columns}")
            return False
        
        print("✅ All required columns present")
        
        # Check for empty required fields
        issues = []
        for col in required_columns:
            empty_count = df[col].isna().sum() + (df[col] == '').sum()
            if empty_count > 0:
                issues.append(f"Column '{col}' has {empty_count} empty cells")
        
        if issues:
            print("⚠️ Data quality issues:")
            for issue in issues:
                print(f"   - {issue}")
        
        # Check data types
        if not pd.api.types.is_numeric_dtype(df['precio']):
            non_numeric = df[~pd.to_numeric(df['precio'], errors='coerce').notna()]
            if len(non_numeric) > 0:
                print(f"⚠️ Non-numeric prices found in {len(non_numeric)} rows")
                print("💡 Prices should be numbers only (no currency symbols)")
        
        # Check categories
        valid_categories = ['Tecnología', 'Carros', 'Casa', 'Ropa', 'Servicios']
        invalid_categories = df[~df['categoria'].isin(valid_categories)]['categoria'].unique()
        if len(invalid_categories) > 0:
            print(f"⚠️ Invalid categories found: {list(invalid_categories)}")
            print(f"💡 Valid categories: {valid_categories}")
        
        # Show column summary
        print("\n📋 Column Summary:")
        for col in df.columns:
            non_empty = df[col].notna().sum() - (df[col] == '').sum()
            status = "✅ Required" if col in required_columns else "⚪ Optional"
            print(f"   {col}: {non_empty}/{len(df)} filled - {status}")
        
        # Sample preview
        print(f"\n👀 First 3 rows preview:")
        print(df[required_columns].head(3).to_string(index=False))
        
        if not issues and len(invalid_categories) == 0:
            print(f"\n🎉 Excel file looks good! Ready to use with SPIN_REVO")
            return True
        else:
            print(f"\n⚠️ Excel file has some issues but might still work")
            print("💡 Fix the issues above for best results")
            return True
            
    except Exception as e:
        print(f"❌ Error validating file: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 validate_excel.py <excel_file_path>")
        print("Example: python3 validate_excel.py my_products.xlsx")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = validate_excel_file(file_path)
    
    if success:
        print(f"\n🚀 To use this file with SPIN_REVO:")
        print(f"   python3 main.py --excel {file_path}")
    else:
        print(f"\n🔧 Fix the issues above and try again")
        sys.exit(1)

if __name__ == "__main__":
    main()