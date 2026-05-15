# 🛒 Sistema de Facturación - Pulpería Nicaragua
## Estado del Proyecto al 12/05/2026

---

## 🛠️ Stack Tecnológico
- **Framework:** Next.js 15 + React 19
- **Base de datos:** SQLite + Prisma 5
- **Estilos:** Tailwind CSS + CSS inline
- **PDF/Impresión:** react-to-print
- **Excel:** xlsx (SheetJS)
- **Gráficas:** Recharts
- **Carpeta del proyecto:** `C:\Users\DELL\pulperia-system`

---

## ✅ Módulos Completados

### 🏪 POS (app/page.js)
- Pantalla de ventas completa
- Búsqueda por nombre y código (para scanner)
- Filtro por categorías
- Carrito con cantidades decimales (ej: 1.5 libras)
- Selector de cliente con creación rápida
- Conversión de unidades (libra/quintal, litro/galón, etc.)
- Cada producto tiene botón por unidad base Y unidad mayor
- Cálculo automático de cambio
- IVA configurable (actualmente en 0% para esta pulpería)
- Método de pago: efectivo, tarjeta, transferencia
- Al cobrar → imprime ticket automáticamente
- Modal de venta exitosa con opción de reimprimir

### 📦 Productos (app/productos/page.js)
- Tabla con todos los productos
- Búsqueda por nombre
- Tabs: Productos / Categorías
- Crear, editar y eliminar productos
- Campos: nombre, código, precio por unidad base, precio por unidad mayor,
  costo, stock, stock mínimo, unidad base, unidad compra, factor conversión, categoría
- Alertas de stock bajo y agotado
- Importar productos masivamente desde Excel
- Descargar plantilla Excel de ejemplo

### 🏬 Inventario (app/inventario/page.js)
- Historial de movimientos (entradas y salidas)
- Registrar movimiento manual con selector de unidad
- Conversión automática: entrada en quintales → guarda en libras
- Tarjetas resumen: total entradas, salidas, alertas
- Alertas de stock bajo en tiempo real

### 🧾 Facturas (app/facturas/page.js)
- Historial completo de ventas
- Búsqueda por número o cliente
- Tarjetas resumen: ventas hoy, total hoy, total facturas
- Ver detalle de cada factura
- Imprimir ticket 80mm (formato pulpería)
- Compartir por WhatsApp (mensaje formateado listo para enviar)

### 👥 Clientes (app/clientes/page.js)
- Registro de clientes
- Búsqueda por nombre, teléfono o cédula
- Avatar con inicial del nombre
- Ver historial de compras por cliente
- Total gastado por cliente

### 📊 Reportes (app/reportes/page.js)
- Métricas: ventas hoy, total acumulado, ticket promedio, stock bajo
- Gráfica de barras: ventas últimos 7 días
- Top 5 productos más vendidos
- Métodos de pago con barra de progreso

### ⚙️ Configuración (app/configuracion/page.js)
- Logo del negocio (subir imagen)
- Nombre, slogan, dirección, teléfono, RUC
- Mensaje pie de ticket
- IVA configurable (0% o 15%)

---

## 🗄️ Base de Datos (prisma/schema.prisma)

### Modelos:
- **Categoria** → id, nombre
- **Producto** → id, nombre, codigo, precio, precioMayor, costo, stock, stockMinimo,
  unidadBase, unidadCompra, factorConversion, categoriaId, activo
- **Cliente** → id, nombre, telefono, cedula, direccion
- **Factura** → id, numero, clienteId, subtotal, iva, total, pagoCon, cambio, metodoPago, estado
- **DetalleFac** → id, facturaId, productoId, cantidad, precio, subtotal
- **MovInventario** → id, productoId, tipo, cantidad, cantidadOriginal, unidadOriginal, motivo
- **Config** → id, clave, valor (clave-valor para configuraciones)

---

## 🔲 Pendiente (en orden de prioridad)

### 🔴 Alta Prioridad:
| # | Tarea |
|---|-------|
| 1 | Ventas al crédito desde el POS |
| 2 | Módulo de Cuentas por Cobrar |
| 3 | Módulo de Proveedores |
| 4 | Módulo de Compras (contado y crédito) |
| 5 | Módulo de Cuentas por Pagar |
| 6 | Tickets en espera en el POS |
| 7 | Reportes en PDF exportable |
| 8 | Reportes en Excel exportable |
| 9 | Reporte de margen de ganancia mensual |
| 10 | Reporte IVA para declaración DGI |
| 11 | PWA — funcionar como app en celular |

### 🟡 Media Prioridad:
| # | Tarea |
|---|-------|
| 12 | Descuentos en el POS |
| 13 | Cotizaciones y Proformas |
| 14 | Editar clientes |
| 15 | Dashboard mejorado |
| 16 | IA integrada con Claude API |
| 17 | Funcionar offline |

### 🟢 Baja Prioridad / Futuro:
| # | Tarea |
|---|-------|
| 18 | Modo oscuro |
| 19 | Adaptar para farmacia (lotes, vencimientos, recetas, controlados) |

---

## 📋 Notas Importantes

### Conversión de unidades:
- El stock SIEMPRE se guarda en unidad base (libras, litros, etc.)
- Al entrar 2 quintales → sistema guarda 200 libras
- Al vender 1 quintal → descuenta 100 libras
- Al vender 1.5 libras → descuenta 1.5 libras
- Factor conversión: quintal=100, galón=3.785, docena=12, caja=24

### IVA:
- Esta pulpería tiene IVA en 0%
- Se configura desde ⚙️ Configuración
- El ticket no muestra IVA cuando es 0%

### Multi-sucursal (decisión tomada):
- El cliente tiene 2 puntos de venta
- Por ahora se maneja con traslados de inventario manuales
- Multi-sucursal real queda para versión 2.0

### Comandos útiles:
```bash
# Desarrollo
npm run dev

# Producción (más rápido)
npm run build
npm run start

# Ver base de datos visualmente
npx prisma studio

# Migrar cambios en schema
npx prisma migrate dev --name nombre-del-cambio
```

---

## 🎯 Para continuar el proyecto
Cuando retomes este chat decile a Claude:
> "Continuamos el sistema de pulpería de Nicaragua.
>  Lee el archivo PROYECTO.md para ubicarte.
>  Seguimos con: Ventas al crédito"
