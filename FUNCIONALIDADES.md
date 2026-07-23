# SPSystem — Documentación completa de funcionalidades

> **SPSystem** es un sistema de punto de venta (POS), inventario y facturación diseñado para pulperías, abarrotes y pequeños comercios. Construido con Next.js 15, React 19, Prisma ORM y PostgreSQL.

---

## Índice

1. [Autenticación y seguridad](#1-autenticación-y-seguridad)
2. [Roles y permisos](#2-roles-y-permisos)
3. [Dashboard (Inicio)](#3-dashboard-inicio)
4. [POS — Punto de venta](#4-pos--punto-de-venta)
5. [Productos](#5-productos)
6. [Compras](#6-compras)
7. [Facturas](#7-facturas)
8. [Clientes (CxC)](#8-clientes-cxc)
9. [Proveedores (CxP)](#9-proveedores-cxp)
10. [Caja y arqueo](#10-caja-y-arqueo)
11. [Gastos](#11-gastos)
12. [Proformas](#12-proformas)
13. [Inventario](#13-inventario)
14. [Reportes](#14-reportes)
15. [Configuración](#15-configuración)
16. [Usuarios](#16-usuarios)
17. [Auditoría](#17-auditoría)
18. [Licencia](#18-licencia)
19. [Respaldos](#19-respaldos)
20. [Manual de usuario](#20-manual-de-usuario)
21. [Arquitectura técnica](#21-arquitectura-técnica)

---

## 1. Autenticación y seguridad

### 1.1 Inicio de sesión
- Pantalla de login con campos de **usuario** y **contraseña**
- Las credenciales distinguen entre mayúsculas y minúsculas
- Contraseñas almacenadas con **bcrypt** (hash + salt)
- Sesión manejada mediante **JWT** almacenado en cookie segura (`__session`)
- Opción **"Recordarme"** — extiende la duración de la sesión
- Después de **5 intentos fallidos**, el usuario se bloquea por **5 minutos**
- **30 minutos de inactividad** → cierre de sesión automático (detecta eventos mouse/teclado/touch)

### 1.2 Middleware de protección
- Todas las rutas `/api/*` están protegidas por middleware
- Rutas públicas: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/config`, `/api/licencia`, `/api/logo`
- Protección **CSRF** en métodos POST/PUT/DELETE: valida que `Origin` y `Referer` coincidan con el servidor

### 1.3 Verificación de contraseña para acciones sensibles
- Anular facturas requiere autorización por contraseña
- Solo usuarios con rol admin/supervisor/encargado pueden autorizar
- Cajero debe ingresar contraseña de un superior

---

## 2. Roles y permisos

### 2.1 Roles disponibles

| Rol | Nivel | Acceso |
|-----|-------|--------|
| **Admin** | 🔴 Total | Todos los módulos, configuración, usuarios, licencia, respaldos |
| **Supervisor** | 🟠 Alto | Productos, compras, facturas, anular, reportes. Sin usuarios ni configuración |
| **Encargado** | 🟡 Medio-alto | Similar a supervisor: productos, facturas, caja |
| **Cajero** | 🟢 Bajo | Solo POS y ver stock. No puede crear/editar/eliminar productos ni anular |

### 2.2 Módulos por rol
Cada rol tiene acceso a un subconjunto de 16 módulos. El admin puede personalizar qué módulos ve cada usuario no-admin. Los módulos son:

`inicio`, `pos`, `facturas`, `compras`, `productos`, `clientes`, `proveedores`, `inventario`, `caja`, `cuentas-cobrar`, `deudas`, `proformas`, `gastos`, `reportes`, `configuracion`, `usuarios`

### 2.3 Redirección automática
- Usuarios no-admin (cajero/supervisor/encargado) → redirigidos al POS al iniciar sesión
- Admin → redirigido al Dashboard
- Si se intenta acceder a un módulo sin permiso → redirige al home

---

## 3. Dashboard (Inicio)

Pantalla principal solo visible para administradores. Los no-admin son redirigidos al POS.

### 3.1 Tarjetas de indicadores (grid responsive `minmax(250px, 1fr)`)

| Tarjeta | Datos |
|---------|-------|
| **Ventas hoy** | Total facturado del día (C$) con icono verde |
| **Facturas hoy** | Cantidad de facturas emitidas hoy |
| **Clientes** | Total de clientes registrados |
| **Stock bajo** | Componente `StockAlerta` en modo tarjeta — muestra cantidad de productos con `stock <= stockMinimo`. Al hacer clic abre modal con detalle y barra de progreso |
| **Próximos a vencer** | Lotes con fecha de vencimiento en los próximos 30 días. Muestra producto, código de lote, fecha y cantidad |

### 3.2 Gráficas (grid `minmax(300px, 1fr)`)

| Gráfica | Descripción |
|---------|-------------|
| **Menos consumo (30 días)** | Barras horizontales top 3 — productos con menor cantidad vendida en los últimos 30 días |
| **Menos ganancia (30 días)** | Barras horizontales top 3 — productos con menor ganancia generada en los últimos 30 días |

### 3.3 Accesos rápidos (grid `minmax(320px, 1fr)`)

| Botón | Destino | Descripción |
|-------|---------|-------------|
| **Ir al POS** | `/pos` | Cobrar productos y facturar |
| **Facturas** | `/facturas` | Ver historial de ventas |
| **Caja / Arqueo** | `/caja` | Abrir, cerrar y revisar caja |

### 3.4 StockAlerta
- Componente reutilizable en dos modos: **botón standalone** y **tarjeta de dashboard**
- Muestra productos con `stock <= stockMinimo` ordenados por stock ascendente
- Indicador visual: porcentaje respecto al stock mínimo, color rojo si está en 0, ámbar si está bajo
- Modal emergente con detalle por producto y enlace a Inventario

---

## 4. POS — Punto de venta

### 4.1 Búsqueda de productos
- **Búsqueda textual**: campo de texto con filtro por nombre o código
- **Escáner de código de barras**: acumula caracteres en buffer, al presionar Enter busca automáticamente el código. Resetea el buffer tras 100ms de inactividad
- **Filtro por categoría**: botones de categorías + "Todos". Cada producto tiene icono según su tipo (Ropa, Bebidas, Granos básicos, Chivería, default)
- **Atajo F1**: enfoca el campo de búsqueda

### 4.2 Tarjetas de producto
- Grid responsive `repeat(auto-fill, minmax(160px, 1fr))`
- Cada tarjeta muestra: icono de categoría, nombre, precio, badge mayorista (si aplica), nivel de stock
- Productos con `stock = 0` se muestran al 50% de opacidad con `cursor: not-allowed`
- Productos genéricos (`esGenerico = true`) abren modal especial en lugar de agregarse directo

### 4.3 Cuatro presentaciones de precio
Cada producto puede tener hasta 4 presentaciones de venta:

| Presentación | Campo en DB | Uso |
|-------------|-------------|-----|
| **Base** | `precio`, `costo`, `unidad` | Presentación principal |
| **Venta 2** | `precioVenta2`, `costoVenta2`, `unidadVenta2`, `factorVenta2` | Segunda presentación (ej. bolsa de 5 lb) |
| **Venta 3** | `precioVenta3`, `costoVenta3`, `unidadVenta3`, `factorVenta3` | Tercera presentación |
| **Venta 4** | `precioVenta4`, `costoVenta4`, `unidadVenta4`, `factorVenta4` | Cuarta presentación |

El botón **⟳** en el POS permite alternar entre presentaciones. La función `obtenerPres(producto, pres)` devuelve `{ precio, factor, unidad, costo }` para la presentación seleccionada.

### 4.4 Precio mayorista
- Cada producto tiene **`precioMayor`** y **`cantidadMinimaMayor`**
- Función `aplicarMayorista(producto, pres, cantidad)`:
  - Solo aplica en presentación `'base'`
  - Si `precioMayor > 0`, `cantidadMinimaMayor > 0` y `cantidad >= cantidadMinimaMayor` → se usa `precioMayor`
  - Se actualiza dinámicamente al cambiar cantidad en el carrito
- Badge morado en tarjeta: "Mayorista: C$ XX (desde YY)"

### 4.5 Carrito de compras
- Agrega productos con cantidad, presentación, precio unitario, subtotal
- Control de cantidad: botones `-` / `+`, campo numérico (paso 0.5 para productos por peso)
- Valida stock contra `stockRequerido = cantidad * factorConversion`
- Elimina del carrito con confirmación
- Un mismo producto puede aparecer dos veces con diferentes presentaciones (usa `_pres` como discriminator)
- **Teclado numérico** virtual para entradas táctiles

### 4.6 Teclado virtual táctil (custom)
- Teclado **100% custom** (sin dependencia `react-simple-keyboard`)
- **QWERTY español** con Ñ + teclas acentuadas (11-9-9 layout)
- **Numpad lateral** estilo laptop (7-8-9 / 4-5-6 / 1-2-3 / 0-.)
- Efecto **glass blur** (blur 20px + opacidad 70%)
- Se posiciona automáticamente dentro del área de contenido (usa `ResizeObserver` en `#main-content-area`)
- **Responsive:**
  - En teléfono (≤640px): numpad oculto, teclas 38×44px, layout compacto
  - Botón "123/ABC" para alternar entre modo números y letras
- Se cierra automáticamente al navegar a otra página o cambiar de pestaña
- No interfiere con el sidebar (posicionado correctamente)

### 4.7 Productos genéricos
- Productos con `esGenerico = true` (ej. verduras sueltas, artículos sin código)
- Al tocarlos: modal especial con campos **cantidad** y **total a cobrar (C$)**
- No tienen precio fijo — el cajero define cuánto cobrar
- Se calcula `precioUnitario = total / cantidad`
- **No afectan inventario**: no descuentan stock, se saltan en la validación de stock y en las transacciones FIFO de lotes
- Se pueden desactivar globalmente desde Configuración (`permiteGenericos = false`)
- En el POS, productos genéricos se ocultan completamente si la configuración lo indica

### 4.7 Pagos mixtos
- Botones de método de pago: **Efectivo C$**, **Efectivo $**, **Tarjeta**, **Transferencia**, **Crédito**
- Se pueden seleccionar **múltiples métodos** en una misma venta (pago mixto)
- Cuando hay más de un método, aparece un campo de monto para cada uno
- **Crédito**: si se combina con otros métodos, el crédito cubre el saldo restante
- Si solo crédito, se oculta el campo "pago con" y se requiere seleccionar cliente

### 4.8 Cliente
- Selector de cliente con búsqueda y modal
- Al seleccionar: muestra tarjeta informativa con:
  - **Saldo pendiente** (abonos + facturas a crédito)
  - **Límite de crédito** configurable
  - **Crédito disponible** (límite - pendiente)
- **Crear cliente rápido**: si la búsqueda no encuentra resultado, permite crear cliente al vuelo con nombre, teléfono y dirección
- Validación de límite: si `pendiente + total > limiteCredito` bloquea la venta a crédito

### 4.9 Descuentos
- Botón **Descuento** en pantalla de cobro
- Alterna entre:
  - **Monto fijo (C$)** — resta una cantidad específica
  - **Porcentaje (%)** — resta un porcentaje del subtotal
- Botón **C$ / %** para cambiar entre modos

### 4.10 IVA
- Se activa/desactiva desde Configuración
- Tasa configurable (ej. 15%)
- Se calcula automáticamente sobre el subtotal después de descuento
- Aparece en ticket, proformas y reportes

### 4.11 Ticket de venta
- Al completar la venta: modal con ticket térmico (80mm) con:
  - Nombre del negocio, dirección, teléfono, slogan, logo
  - Número de factura, fecha, cliente
  - Detalle de productos (cantidad, descripción, precio, subtotal)
  - Descuento, IVA, total
  - Método de pago, monto recibido, cambio
  - Mensaje de pie personalizable
- **Imprimir**: envía a impresora térmica vía `print-agent` (servidor Node.js en puerto 5123)
- **Compartir**: abre WhatsApp con resumen de la venta
- **Nueva venta**: limpia carrito para empezar otra

### 4.12 Estacionar ticket (Park)
- Guarda carrito, cliente y método de pago en `CartSession`
- Se puede recuperar desde el botón **Retirar** (F8)
- Lista tickets estacionados con nombre, cantidad de productos y fecha
- Al retirar, se restaura el estado completo y se elimina la sesión

### 4.13 Atajos de teclado

| Tecla | Acción |
|-------|--------|
| F1 | Buscar producto |
| F2 | Ingresar monto (pago con) |
| F3 | Cobrar / finalizar venta |
| F4 | Descuento |
| F5 | Buscar cliente |
| F6 | Factura a crédito |
| F7 | Estacionar venta |
| F8 | Retirar venta estacionada |
| Escape | Limpiar carrito (con confirmación) |

### 4.14 Procesamiento de venta (Cobrar)
1. **Validación**: carrito no vacío, stock suficiente (salvo genéricos), caja abierta
2. Si es crédito: verifica límite del cliente
3. **Numeración**: genera número secuencial `FAC-XXXXX`
4. **Transacción atómica**:
   - Crea factura con `detallesPago` (JSON string para pagos mixtos)
   - Descuenta stock de cada producto (salvo genéricos)
   - Aplica **FIFO sobre lotes**: descuenta primero los lotes con fecha de vencimiento más próxima
   - Registra movimiento de inventario (tipo `salida`, motivo "Venta FAC-XXXXX")
5. **Actualiza caja**: incrementa el campo correspondiente según método de pago (efectivo C$, efectivo USD, tarjeta, transferencia, crédito)
6. **Audita**: registra en auditoría

---

## 5. Productos

### 5.1 Listado y búsqueda
- Tabla paginada con todos los productos
- Búsqueda por nombre o código de barras
- Cada fila muestra: código, nombre, categoría, existencias, precio de venta (presentación base), estado (activo/inactivo)
- Badge **Genérico** para productos con `esGenerico = true`
- Badge **Mayorista** si `precioMayor > 0`
- Botón **Mostrar inactivos** toggle para ver/esconder productos marcados como inactivos

### 5.2 Crear y editar
- Formulario completo con:

| Sección | Campos |
|---------|--------|
| **Información básica** | Código, nombre, categoría, stock inicial, stock mínimo |
| **Precios** | Costo, precio de venta, unidad de medida |
| **Presentaciones alternas** | Hasta 3 presentaciones (venta2, venta3, venta4) cada una con: unidad, precio, costo, factor de conversión |
| **Mayorista** | Precio mayorista, cantidad mínima mayorista |
| **Unidad de compra** | Unidad de compra (puede diferir de la base), factor de conversión |
| **Genérico** | Checkbox "Producto genérico (precio variable)" |
| **Estado** | Activo / Inactivo |

### 5.3 Importar desde Excel
1. Descargar plantilla (.xlsx) con columnas requeridas
2. Completar datos (código, nombre, categoría, existencias, precios, factores)
3. Subir archivo → procesa y crea productos
4. Muestra resultados: cuántos se importaron, cuántos fallaron

### 5.4 Eliminación inteligente
- **Si el producto no tiene movimientos** (ventas, compras, proformas) → se elimina físicamente
- **Si tiene movimientos** → se marca como `activo = false` (inactivo) en lugar de eliminar
- Botón **Reactivar** disponible para restaurar productos inactivos

### 5.5 Control de vencimientos
- Cada producto tiene un campo **`fechaVencimiento`** directo (sin modelo Lote)
- Se puede establecer al crear o editar el producto
- Si se importa desde Excel con `FechaVencimiento`, se aplica automáticamente
- Al registrar una compra, se puede actualizar la fecha de vencimiento del producto
- **Alertas en Dashboard**: productos próximos a vencer en 15/30/60/90 días
- Vista rápida en inventario con filtros por días a vencer y ya vencidos

### 5.6 Códigos alias (múltiples códigos de barras)
- Cada producto puede tener **múltiples códigos de barras** (alias)
- Tabla separada `ProductoCodigo` con código único a nivel de sistema
- **No se permiten duplicados**: un código alias no puede repetirse entre productos ni coincidir con el código principal
- **En POS**: al escanear o buscar, encuentra el producto con cualquiera de sus códigos (principales o alias)
- **En CRUD**: sección "Códigos alias" en crear/editar producto con chips removibles
- **Importación Excel**: columna `CodigosAlias` con códigos separados por coma o punto y coma
- **Búsqueda**: la API busca también en `codigosAlias.codigo` con `contains` case-insensitive

### 5.7 StockAlerta en página Productos
- Badge flotante "Stock bajo" que abre modal con detalle de productos con stock crítico

---

## 6. Compras

### 6.1 Registro de compra
1. Seleccionar **proveedor**
2. Ingresar **número de factura del proveedor** (para referencia)
3. Fecha de compra, **fecha de vencimiento** (para CxP)
4. Agregar productos: seleccionar producto, cantidad, unidad, costo, subtotal
   - Si la unidad de compra coincide con una presentación alterna (venta2, venta3, venta4) → actualiza `costoVenta2/3/4`
   - Si la unidad de compra difiere de la base → calcula costo unitario base dividiendo por factor de conversión
5. **Código de lote** y **fecha de vencimiento** por producto → crea lote automáticamente
6. IVA (opcional)
7. Es crédito / contado
8. Nota opcional

### 6.2 Procesamiento
- Transacción atómica:
  1. Genera número secuencial `COM-XXXXX`
  2. Crea compra con detalles
  3. Por cada producto:
     - Si tiene lote → crea `Lote` con cantidad base
     - Incrementa `stock` del producto
     - Actualiza `costo` del producto (y `costoVenta2/3/4` si aplica)
     - Crea movimiento de inventario (tipo `entrada`, motivo "Compra COM-XXXXX")
  4. Si es crédito → establece `saldoPendiente = total`
- Auditoría: registra en log

### 6.3 Borradores (compras en proceso)
- Al crear o editar una compra, hay dos botones:
  - **"Guardar Borrador"** (amarillo) → guarda con `estado: 'borrador'`, **NO afecta stock ni inventario**
  - **"Registrar Compra"** (verde) → comportamiento normal (actualiza stock, costo, movimientos)
- Los borradores aparecen en una pestaña **"Borradores"** con contador
- En la tabla: badge `BORRADOR` (ambar) + opacidad reducida
- Botón **"Continuar"** → carga todos los datos (proveedor, items, notas) de vuelta al formulario
- Botón **🗑️** → elimina el borrador definitivamente
- Al finalizar un borrador → `PUT /api/compras/[id]` con `esBorrador: false` → actualiza stock y crea movimientos de inventario
- El número de compra (`COM-XXXXX`) se mantiene igual al finalizar
- API:
  - `PUT /api/compras/[id]` → edita solo si `estado === 'borrador'`
  - `DELETE /api/compras/[id]` → elimina solo si `estado === 'borrador'`

### 6.4 Anular compra
- Similar a anular factura:
  - Revierte stock y lotes
  - Marca como anulada
  - Requiere autorización por contraseña

---

## 7. Facturas

### 7.1 Listado
- Tabla paginada con todas las facturas emitidas
- Búsqueda por número de factura o nombre de cliente
- Columnas: número, cliente, fecha, subtotal, descuento, IVA, total, método de pago, estado
- Iconos: crédito (`CreditCard`), anulada (tachada)
- **Imprimir** y **Compartir WhatsApp** desde la lista

### 7.2 Anular factura
- Flujo:
  1. Hacer clic en **Anular**
  2. Sistema solicita **autorización por contraseña**
     - Admin/Supervisor/Encargado: ingresan su propia contraseña
     - Cajero: debe ingresar contraseña de un superior
  3. Validación: solo usuario con rol `admin`, `supervisor` o `encargado` puede anular
- Transacción atómica:
  1. Por cada detalle (salvo genéricos):
     - Restaura stock del producto (`increment`)
     - Aplica **FIFO inverso**: agrega al lote con fecha de vencimiento más lejana
     - Si no existe lote → crea uno con código `DEV-FAC-XXXXX`
     - Crea movimiento de inventario (tipo `entrada`, motivo "Anulación FAC-XXXXX")
  2. Marca factura: `estado = 'anulada'`, `anuladaEn`, `anuladaPor`
  3. Auditoría

---

## 8. Clientes (CxC)

### 8.1 Gestión de clientes
- CRUD completo con: nombre, teléfono, cédula, dirección, límite de crédito
- **Saldo inicial**: permite registrar deudas anteriores al sistema
- Paginación y búsqueda

### 8.2 Cuentas por cobrar (CxC)
- Lista de facturas a crédito con saldo pendiente
- Columnas: factura, cliente, fecha, total, abonado, pendiente, vencimiento
- Filtro: pendientes / pagadas
- **Registrar abono**: modal con monto y nota
  - Al guardar: imprime **comprobante de abono** (ticket térmico)
  - Reduce saldo pendiente de la factura
  - Actualiza caja (abonos se suman a `ventasEfectivoCs`)
- **Ver historial de abonos** por factura
- Saldo inicial: pago desde la ficha del cliente

---

## 9. Proveedores (CxP)

### 9.1 Gestión de proveedores
- CRUD completo con: nombre, teléfono, contacto, dirección, email
- **Saldo inicial CxP**: permite registrar deudas anteriores
- Activo/inactivo
- Paginación y búsqueda

### 9.2 Cuentas por pagar (CxP / Deudas)
- Lista de compras a crédito con saldo pendiente
- Columnas: factura, proveedor, fecha, vencimiento, total, abonado, pendiente
- Incluye saldos iniciales de proveedores
- **Abonar**: modal con monto y nota
- Estado: pendiente / pagada

---

## 10. Caja y arqueo

### 10.1 Apertura de caja
- Requiere caja cerrada previa
- Se registra: usuario que abre, monto inicial en C$
- Solo se puede vender en POS si hay una caja abierta

### 10.2 Movimientos de caja
- **Entrada**: dinero extra que ingresa (préstamo, retiro de abono)
- **Salida**: dinero que sale (pago a proveedor, gasto menor)
- Campos: tipo, moneda (C$/$), monto, concepto
- Cada movimiento actualiza `ingresosExtra` o `egresos` de la caja
- Los movimientos originados en el módulo Gastos (método efectivo) aparecen con badge `Gasto`
- Se pueden eliminar (revirtiendo el total)

### 10.3 Indicadores en caja abierta
| Indicador | Descripción |
|-----------|-------------|
| Abierta por | Usuario que abrió + fecha/hora |
| Monto inicial | C$ |
| Total ingresado | Suma de todos los pagos (sin crédito) |
| Efectivo C$ | Ventas en efectivo córdobas |
| Efectivo USD | Ventas en efectivo dólares |
| Abonos de clientes | Abonos registrados durante la sesión |
| Tarjeta | Ventas con tarjeta |
| Transferencia | Ventas por transferencia |
| Ingresos extra | Movimientos tipo entrada |
| Egresos | Movimientos tipo salida + gastos en efectivo |

### 10.4 Arqueo y cierre
1. Hacer clic en **Cerrar Caja y hacer Arqueo**
2. Desglose de billetes y monedas C$ (1000, 500, 200, 100, 50, 25, 20, 10, 5) y USD (100, 50, 20, 10, 5, 2, 1)
3. Sistema calcula:
   ```
   Esperado C$ = Monto inicial + Ventas efectivo C$ + Abonos + Ingresos extra − Egresos (incluye gastos efectivo)
   Esperado $ = Ventas efectivo USD
   ```
4. Se compara con el **Efectivo real** del arqueo
5. **Diferencia C$** y **Diferencia $** (puede ser positiva, negativa o cero)
6. Observación opcional
7. Al cerrar: no se pueden registrar más ventas hasta nueva apertura

### 10.5 Historial de cierres
- Tabla con todos los cierres anteriores
- Muestra: fecha, quién abrió/cerró, inicial, vendido, ingresos extra, egresos, efectivo real, diferencias

---

## 11. Gastos

### 11.1 Registro de gastos
- Formulario con campos:
  - **Concepto** (obligatorio)
  - **Categoría** (9 opciones): Operativos, Salarios, Servicios, Alquiler, Impuestos, Mantenimiento, Publicidad, Transporte, Otros
  - **Método de pago**:
    - **Efectivo** — descuenta de la caja abierta automáticamente
    - **Transferencia** — solo registro contable
    - **Tarjeta** — solo registro contable
    - **Otro** — solo registro contable
  - **Monto** en C$
  - **Fecha**
  - **Nota** (opcional)

### 11.2 Integración con caja
- Si `metodoPago = 'efectivo'` y hay caja abierta:
  - Crea `MovimientoCaja` con tipo `'salida'`, moneda `'C$'`, concepto `'Gasto #ID: concepto'`
  - Incrementa `caja.egresos`
  - Aparece en el arqueo (se descuenta del esperado)
  - En movimientos de caja se muestra con badge `Gasto`
- Si `metodoPago ≠ 'efectivo'`: no afecta caja

### 11.3 Eliminación
- Al eliminar un gasto en efectivo: revierte automáticamente el egreso de caja
- Al eliminar un gasto de transferencia/tarjeta/otro: solo elimina el registro contable

### 11.4 Reporte mensual
- Filtro por mes en la UI
- Total acumulado del mes
- Tabla con fecha, concepto, categoría, método de pago, monto, nota

### 11.5 Gastos en reportes
- Todos los gastos (sin importar método de pago) se incluyen en:
  - **Ganancias y Pérdidas** (reporte P&L)
  - **Comparativo de períodos**

---

## 12. Proformas

### 12.1 Creación
- Similar al POS: agregar productos con cantidad
- IVA configurable
- Selección de cliente (opcional)
- Nota, validez

### 12.2 Salida
- PDF con formato ticket térmico o carta
- Imprimir
- Compartir WhatsApp

### 12.3 Gestión
- Listado paginado con búsqueda
- Estados: pendiente / convertida / vencida
- No afecta stock ni caja

---

## 13. Inventario

### 13.1 Movimientos de inventario
- Tabla con historial completo de entradas y salidas
- Columnas: fecha, producto, tipo (entrada/salida), cantidad, motivo, stock resultante
- Búsqueda por producto
- **Saldo corrido**: calcula el stock en cada movimiento basado en el orden cronológico

### 13.2 Ajustes manuales
- Formulario para registrar ajustes: producto, tipo (entrada/salida), cantidad, motivo
- Se crea `MovInventario` con el tipo y motivo especificados
- Motivos predefinidos: Merma, Vencimiento, Robo, Pérdida, Daño, Ajuste, Otros

### 13.3 Alertas
- `StockAlerta` componente reutilizable
- Resalta productos con `stock <= stockMinimo`
- Modal con detalle y acceso rápido a inventario

---

## 14. Reportes

### 14.1 Arquitectura
- Módulo unificado con **18 tipos de consulta**
- Selección desplegable de módulo, rango de fechas (cuando aplica), botón Buscar
- 8 tipos usan API especial `/api/reportes?tipo=XXX`
- 10 tipos consultan APIs estándar (facturas, productos, etc.)

### 14.2 Tipos de reporte

| # | Módulo | API | Requiere fechas | Vista personalizada |
|---|--------|-----|-----------------|---------------------|
| 1 | **Resumen general** | `/api/reportes` (sin tipo) | No | 4 cards + gráfica ventas (día/mes toggle) + top 5 productos + medios de pago + inventario valorizado + CxC + CxP |
| 2 | **Facturas** | `/api/facturas` | Sí | Tabla con totales |
| 3 | **Ventas totales** | `/api/facturas` (detalle expandido) | Sí | Cada detalle de factura como fila individual (producto, cant., precio, subtotal) |
| 4 | **Ganancias** | `/api/facturas` (detalle expandido) | Sí | Cada detalle con costo, ganancia, margen. Totales: suma ventas, costo, ganancia |
| 5 | **Compras** | `/api/compras` | Sí | Tabla con totales |
| 6 | **Productos** | `/api/productos` | No | Tabla maestra |
| 7 | **Clientes** | `/api/clientes` | No | Tabla maestra |
| 8 | **Proveedores** | `/api/proveedores` | No | Tabla maestra |
| 9 | **Inventario** | `/api/productos` | No | Existencias actuales valorizadas |
| 10 | **Proformas** | `/api/proformas` | Sí | Tabla |
| 11 | **Rentabilidad** | `/api/reportes?tipo=rentabilidad` | Sí | 3 cards + toggle producto/categoría + tabla con margen coloreado (>30% verde, >10% amarillo, ≤10% rojo) |
| 12 | **Morosos** | `/api/reportes?tipo=morosos` | No | 4 buckets de mora (0-30, 31-60, 61-90, >90d) + tabla con cliente, teléfono, factura, total, pendiente, días, vencida |
| 13 | **Rotación** | `/api/reportes?tipo=rotacion` | Sí | 4 cards + filtro (todas/sin movimiento/lenta/normal) + tabla con rotación anualizada |
| 14 | **Comparativo** | `/api/reportes?tipo=comparativo` | Sí | Tabla lado a lado: período actual vs anterior vs diferencia con % |
| 15 | **Flujo de caja** | `/api/reportes?tipo=flujo-caja` | No | Selector de días (7/15/30/60) + 3 cards (CxC, CxP, saldo neto) + tablas de cobros y pagos próximos |
| 16 | **Mermas** | `/api/reportes?tipo=mermas` | Sí | 3 cards + tabla por producto + detalle de movimientos |
| 17 | **Reporte fiscal** | `/api/reportes?tipo=fiscal` | Sí | 4 cards + desglose mensual (ventas, IVA, contado/crédito) + totales globales |
| 18 | **Ganancias/Pérdidas** | `/api/reportes?tipo=ganancias` | Sí | 5 KPI cards + toggle día/quincena/mes + tabla con ventas, costo, ganancia bruta, gastos, ganancia neta, márgenes |

### 14.3 Resumen general (detalle)
Cuando se selecciona el módulo "Resumen general":
- **Métricas**: ventas totales, ticket promedio, ganancia total, margen
- **Gráfica de ventas**: componente `BarChart` (Recharts) con toggle día/mes
- **CxC**: total de cuentas por cobrar
- **CxP**: total de cuentas por pagar
- **Top 5 productos**: ranking por cantidad vendida
- **Métodos de pago**: gráfica de barras por método (efectivo C$, efectivo $, tarjeta, transferencia, crédito)
- **Inventario valorizado**: stock × costo y stock × precio de cada producto

### 14.4 Exportar
- **PDF**: usando `react-to-print` sobre componente `ReportePDF`. Para resumen genera tabla de métricas; para otros, tabla de datos con totales
- **Excel**: usando librería `xlsx`:
  - Para resumen: múltiples pestañas (Resumen, Ventas por día, Top productos, Métodos de pago, Inventario)
  - Para otros: una hoja con columnas definidas + fila de totales para ventas/ganancias

### 14.5 Ganancias y Pérdidas (P&L) — detalle
Agrupa datos de facturas + gastos en tres niveles:
- **Por día**: cada fila es un día del período
- **Por quincena**: agrupa días 1-15 y 16-fin de cada mes
- **Por mes**: agrupa por mes completo

Cada fila: `ventas` − `costo` = `ganancia bruta` (con margen %) − `gastos` (del módulo Gastos) = `ganancia neta` (con margen neto %)

5 tarjetas de resumen: ventas totales, costo total, ganancia bruta, gastos totales, ganancia neta
Colores: verde si ganancia ≥ 0, rojo si pérdida

---

## 15. Configuración

### 15.1 General
| Campo | Descripción |
|-------|-------------|
| Nombre del negocio | Aparece en tickets, reportes, dashboard |
| Teléfono | En comprobantes |
| Dirección | En comprobantes |
| Slogan | En tickets |
| Logo | Imagen en tickets y dashboard |
| Tasa de cambio C$/$ | Para cálculos |
| Mensaje al pie | Texto personalizado en tickets |

### 15.2 IVA
- **Interruptor** activar/desactivar
- Tasa configurable (ej. 15%)
- Cuando está desactivado: POS, proformas y tickets no muestran IVA

### 15.3 DGI — e-Factura Nicaragua
- Campos: NRC, CAI, rango de facturación autorizado
- Generador de XML para e-factura (integración con DGI requiere credenciales oficiales)

### 15.4 Productos genéricos
- Interruptor `permiteGenericos` (true/false)
- Cuando está desactivado: productos genéricos no aparecen en POS
- Cuando está activado: al tocar un genérico en POS se abre modal para precio variable

### 15.5 Usuarios
- Crear, editar, desactivar usuarios
- Asignar rol: admin, supervisor, encargado, cajero
- Asignar módulos permitidos individualmente

### 15.6 Licencia
- Estado de la licencia actual
- Fecha de expiración
- Carga de archivo .lic

### 15.7 Respaldos
- Descargar respaldo (.sql)
- Restaurar respaldo
- Configuración de respaldos automáticos

---

## 16. Usuarios

### 16.1 CRUD
- Lista de usuarios con: username, nombre, rol, módulos, activo, bloqueado
- Crear: username, nombre, contraseña, rol, módulos
- Editar: nombre, rol, contraseña (opcional), módulos, activo
- Desbloquear usuario (si excedió intentos fallidos)
- Validaciones:
  - Username único
  - Username sin espacios al inicio/final
  - Contraseña mínima 4 caracteres

### 16.2 Roles y módulos
- Asignación granular de módulos por usuario no-admin
- Admin tiene acceso total (ignora asignación de módulos)

---

## 17. Auditoría

### 17.1 Log de actividad
- Registro automático de todas las acciones importantes
- Columnas: fecha/hora, usuario, acción (crear/editar/eliminar/anular), entidad (factura/producto/cliente etc.), detalle
- Búsqueda por usuario, entidad, fecha

### 17.2 Acciones auditadas
- Facturas: creación, anulación
- Productos: crear, editar, eliminar
- Clientes: crear, editar
- Compras: crear, anular
- Caja: apertura, cierre, movimientos
- Usuarios: crear, editar, desbloquear
- Configuración: cambios

---

## 18. Licencia

### 18.1 Sistema de licencias
- El sistema requiere licencia para funcionar
- Licencia vinculada al hardware del servidor (`machine-id`)
- Archivo `.lic` con firma criptográfica
- Si la licencia vence o es inválida: pantalla de advertencia bloqueando el acceso

### 18.2 Generación
- Script `scripts/generar-licencia.js` para generar archivos `.lic`
- Parámetros: machine-id, fecha de expiración
- Usa `APP_LICENSE_SECRET` del entorno para firmar

---

## 19. Respaldos

### 19.1 Manuales
- **Descargar respaldo**: genera archivo `.sql` con `pg_dump` (PostgreSQL) o copia de `dev.db` (SQLite)
- **Restaurar respaldo**: subir archivo `.sql` previo para recuperar

### 19.2 Automáticos
- Programación: **cada domingo a las 2:00 AM** vía `node-cron`
- Script: `lib/backup-cron.mjs`
- Directorio: `C:\respaldos-spsystem` (configurable en `.env`)
- Retención: solo los últimos **4 respaldos** (elimina los más antiguos)
- Sincronización recomendada: Google Drive sobre la carpeta de respaldos

---

## 20. Manual de usuario

- Página interactiva `/manual` con toda la documentación del sistema
- 15 secciones numeradas con índice, tabla de contenidos y enlaces de navegación
- Incluye atajos de teclado en tabla
- Botón **Guardar como PDF** (usa `window.print()`)
- Estilo optimizado para impresión (`print-color-adjust`, márgenes)

---

## 21. Arquitectura técnica

### 21.1 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Next.js 15 (App Router) |
| Estilos | Tailwind CSS 4 + estilos inline |
| Iconos | Lucide React |
| Gráficos | Recharts |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL (producción) / SQLite (desarrollo) |
| Autenticación | JWT (jose) + bcryptjs + cookies |
| Exportación | ExcelJS, xlsx |
| Impresión | react-to-print + node-thermal-printer |
| Respaldos | node-cron |
| Contenedor | Docker, Docker Compose |

### 21.2 Estructura del proyecto

```
├── app/
│   ├── api/            → 43 rutas API (Next.js Route Handlers)
│   ├── components/     → 14 componentes React reutilizables
│   ├── context/        → AuthContext (estado global de autenticación)
│   ├── hooks/          → useToast (notificaciones)
│   └── */page.js       → 21 páginas (dashboard, POS, módulos, etc.)
├── lib/                → 6 módulos de utilidades (auth, prisma, auditoría, DGI, backup)
├── prisma/
│   ├── schema.prisma   → 23 modelos de datos
│   ├── migrations/     → 5 migraciones SQL
│   └── seed.js         → datos de prueba
├── print-agent/        → Servidor de impresión térmica (Node.js, puerto 5123)
├── scripts/            → generador de licencias
├── middleware.js        → Protección de rutas API + CSRF
└── Dockerfile + docker-compose.yml
```

### 21.3 Modelos de datos (23)

`Categoria`, `Producto`, `ProductoCodigo`, `Cliente`, `Factura`, `DetalleFac`, `MovInventario`, `Abono`, `Proveedor`, `Compra`, `DetalleCompra`, `Gasto`, `AbonoCompra`, `Proforma`, `DetalleProforma`, `CartSession`, `Config`, `Usuario`, `Auditoria`, `Caja`, `ArqueoDetalle`, `MovimientoCaja`, `UnidadMedida`

### 21.4 Flujo de datos transaccionales

**Venta (facturación):**
```
POS → POST /api/facturas → $transaction {
  1. Generar número FAC-XXXXX
  2. Crear Factura + Detalles
  3. Por cada detalle:
     a. Descontar stock (decrement)
     b. FIFO: descontar lotes por vencimiento ASC
     c. Crear MovInventario (salida)
  4. Auditoría
} → Actualizar Caja (por método de pago)
```

**Compra (directa):**
```
Compras → POST /api/compras (esBorrador: false) → $transaction {
  1. Generar número COM-XXXXX
  2. Crear Compra + Detalles
  3. Por cada detalle:
     a. Incrementar stock
     b. Actualizar costo (incluyendo costoVenta2/3/4 si aplica)
     c. Crear MovInventario (entrada)
}
```

**Compra (borrador → finalizar):**
```
Compras → PUT /api/compras/[id] (esBorrador: false) → $transaction {
  1. Eliminar Detalles viejos
  2. Actualizar Compra con nuevos datos
  3. Crear nuevos Detalles
  4. Por cada detalle:
     a. Incrementar stock
     b. Actualizar costo
     c. Crear MovInventario (entrada)
}
```

**Anulación de factura:**
```
Facturas → POST /api/facturas/[id]/anular → Verificar contraseña → $transaction {
  1. Por cada detalle:
     a. Restaurar stock
     b. FIFO inverso: restaurar al lote más lejano
     c. Crear MovInventario (entrada)
  2. Marcar factura como anulada
}
```

### 21.5 Seguridad
- JWT en cookie `__session` con flag `httpOnly`
- CSRF: validación de origen en escritura
- Passwords: bcrypt (salt rounds)
- Bloqueo por intentos fallidos
- Timeout de sesión por inactividad (30 min)
- Licencia por hardware

---

> **Última actualización:** Julio 2026 — v2.0: Códigos alias, borradores de compra, teclado virtual custom
> **Versión:** 0.1.0
> **Licencia:** Propietaria — requiere archivo .lic válido
