# GUÍA DE INSTALACIÓN, ACTUALIZACIÓN Y LICENCIAS

Esta guía explica cómo instalar el sistema por primera vez, cómo actualizar sistemas
ya instalados SIN romper su licencia, y cómo emitir licencias para clientes.

---

## Conceptos clave (leer primero)

- **`.env`**: archivo de secretos de cada instalación (JWT_SECRET y APP_LICENSE_SECRET).
  - Está excluido de GitHub (`.gitignore`), así que `git pull` NUNCA lo toca ni lo borra.
  - **Si existe, tiene prioridad** sobre los valores por defecto de `docker-compose.yml`.
  - **NO se borra, NO se regenera, NO se sube a GitHub.**
- **`APP_LICENSE_SECRET`**: firma la licencia del sistema. Si cambia en una máquina,
  la licencia queda inválida y hay que emitir una nueva.
- **`docker-compose.yml`**: los secretos que aparecen ahí son SOLO valores por defecto
  de compatibilidad para instalaciones existentes.

---

## A) INSTALACIÓN NUEVA (primera vez)

### Paso 1 — Copiar el proyecto
Copiar la carpeta del proyecto a la máquina del cliente.

### Paso 2 — Generar secretos únicos y arrancar
Abrir PowerShell en la carpeta del proyecto y ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File instalar.ps1
```

Lo que hace:
1. Genera un `JWT_SECRET` y un `APP_LICENSE_SECRET` **únicos para esa instalación**.
2. Los guarda en `.env`.
3. Construye y levanta los contenedores.
4. Al final muestra el `APP_LICENSE_SECRET` generado.

> **IMPORTANTE:** anotar el `APP_LICENSE_SECRET` de la pantalla y guardarlo en el
> registro de clientes. Sin él NO se puede emitir la licencia de esa máquina.

### Paso 3 — Pedir el Machine-ID
- El cliente entra al sistema en `http://localhost:3000` con el usuario admin.
- Abre el módulo **Licencia** y envía el **Machine-ID** que aparece ahí.

### Paso 4 — Emitir la licencia (en la máquina del proveedor)
En la máquina del proveedor, dentro de la carpeta del proyecto:

```powershell
node scripts/generar-licencia.js <machineId> <dias> --secreto <secretoDelCliente>
```

Ejemplo:

```powershell
node scripts/generar-licencia.js 71317bc8aa0012ff 365 --secreto 9f2c... (el secreto del cliente)
```

Se genera un archivo `licencia_XXXXXXXX_YYYY-MM-DD.lic`.

### Paso 5 — Cargar la licencia
- El cliente abre el módulo **Licencia** y carga el archivo `.lic`.
- El sistema lo valida con SU secreto (el que quedó en su `.env`). Si la firma no
  coincide, rechaza el archivo.

---

## B) ACTUALIZACIÓN DE UN SISTEMA YA INSTALADO (producción)

### Preparación (una sola vez por máquina)
La primera vez que se actualice un sistema existente, crear el `.env` con los secretos
que la máquina YA está usando hoy:

```powershell
powershell -ExecutionPolicy Bypass -File preparar-existente.ps1
```

- Si la máquina **no tiene `.env`**, este script lo crea con los valores que el sistema
  usa actualmente (compatibilidad). La licencia sigue válida.
- Si la máquina **ya tiene `.env`**, el script no toca nada.

> Nota: si algún cliente editó manualmente los secretos en su `docker-compose.yml`,
> copiar ESOS valores en el `.env` en lugar de usar el script.

### Actualización (de aquí en adelante, siempre igual)
En la carpeta del proyecto de la máquina del cliente:

```powershell
git pull
docker compose build app
docker compose up -d
```

(o `docker compose up -d --build` en un solo paso)

**Eso es todo.** El `.env` no se toca, la licencia no se invalida, la base de datos
no se pierde.

---

## C) REGLAS QUE NUNCA SE DEBEN ROMPER

| Regla | Por qué |
|---|---|
| NO borrar el `.env` del cliente | Se perderían los secretos y la licencia quedaría inválida |
| NO correr `docker compose down -v` en producción | Borra la base de datos (volúmenes) |
| NO cambiar `APP_LICENSE_SECRET` en una máquina instalada | Invalida la licencia de ese cliente |
| NO subir el `.env` a GitHub | Expone los secretos |
| NO usar `deploy.ps1` para actualizar | Es solo para instalaciones nuevas |

---

## D) EMISIÓN DE LICENCIAS — RESUMEN

| Situación | Comando |
|---|---|
| Cliente nuevo (tiene secreto propio) | `node scripts/generar-licencia.js <machineId> <dias> --secreto <secretoDelCliente>` |
| Instalación vieja (usa el secreto por defecto) | `node scripts/generar-licencia.js <machineId> <dias>` (usa el APP_LICENSE_SECRET del `.env` local) |
| Licencia interactiva | `node scripts/generar-licencia.js --interactivo [--secreto <secretoDelCliente>]` |

Guardar por cada cliente: **nombre, Machine-ID, APP_LICENSE_SECRET** en un registro
local (fuera del repositorio de GitHub).

---

## E) PROBLEMAS COMUNES

**"La app no arranca / dice que falta JWT_SECRET"**
→ El `.env` no existe o está incompleto. Correr `preparar-existente.ps1` (existente) o
`instalar.ps1` (nuevo).

**"Licencia inválida" después de un cambio**
→ Se cambió el `APP_LICENSE_SECRET` de esa máquina. Restaurar el `.env` original o
emitir una nueva licencia con el secreto actual.

**"No recuerdo el secreto de un cliente"**
→ Leer el `.env` de esa máquina (valor de `APP_LICENSE_SECRET`).

**Base de datos perdida (no debe pasar)**
→ Si se ejecutó `docker compose down -v`, los datos NO están en el contenedor: están
en el volumen `pgdata`. Restaurar desde respaldos (`respaldos/`).
