# Excel Template Structure for SPIN_REVO

## Required Columns (exact names):

| Column Name | Type | Required | Description | Example |
|-------------|------|----------|-------------|---------|
| titulo | Text | ✅ Yes | Product title | "iPhone 13 Pro Max 256GB" |
| descripcion | Text | ✅ Yes | Product description | "iPhone en excelente estado..." |
| precio | Number | ✅ Yes | Price (numbers only) | 850 |
| moneda | Text | ⚠️ Optional | Currency code | "USD", "EUR", "CUP" |
| categoria | Text | ✅ Yes | Main category | "Tecnología", "Carros", "Casa" |
| subcategoria | Text | ⚠️ Optional | Subcategory | "Celulares", "Computadoras" |
| provincia | Text | ✅ Yes | Province | "La Habana", "Santiago" |
| municipio | Text | ⚠️ Optional | Municipality | "Playa", "Centro Habana" |
| telefono | Text | ✅ Yes | Phone number | "53123456" |
| email | Text | ⚠️ Optional | Contact email | "contacto@email.com" |
| imagen1 | Text | ⚠️ Optional | Image 1 path | "photos/product1.jpg" |
| imagen2 | Text | ⚠️ Optional | Image 2 path | "photos/product1_2.jpg" |
| imagen3 | Text | ⚠️ Optional | Image 3 path | "photos/product1_3.jpg" |

## Category Mapping:

**Available Categories:**
- Tecnología → Celulares, Computadoras, Accesorios
- Carros → Carros, Motos, Repuestos
- Casa → Muebles, Electrodomésticos, Herramientas
- Ropa → Ropa Hombre, Ropa Mujer, Zapatos
- Servicios → Reparaciones, Clases, Otros

## Tips:

1. **Save as .xlsx format** (Excel 2007+)
2. **No empty rows** between data
3. **First row must be headers** (column names)
4. **Image paths** should be relative to SPIN_REVO folder
5. **Phone numbers** can include country code (53)
6. **Prices** should be numbers only (no currency symbols)

## Common Issues:

❌ **Wrong column names** (case sensitive!)
❌ **Missing required fields** (titulo, descripcion, precio, categoria, provincia, telefono)
❌ **Empty required cells**
❌ **Wrong file format** (.xls instead of .xlsx)
❌ **Special characters** in file path

✅ **Correct format example:**
```
titulo,descripcion,precio,moneda,categoria,subcategoria,provincia,municipio,telefono,email,imagen1,imagen2,imagen3
iPhone 13,Excelente estado,850,USD,Tecnología,Celulares,La Habana,Playa,53123456,test@email.com,phone.jpg,,
```