# Guía de instalación — SPSystem

## Requisitos del sistema

- Windows 10/11 con **Docker Desktop** instalado
  - Docker Desktop requiere **WSL2** en Windows
  - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Mínimo **4 GB de RAM**
- **10 GB de espacio libre** en disco

## Paso 1: Obtener el proyecto

Opción A — Código fuente comprimido:
```
Descomprimí la carpeta pulperia-system en C:\spsystem
```

Opción B — Git (si tenés acceso al repositorio):
```bash
git clone https://github.com/SilvioPM/Nuevaversioncondockertspsystem.git
cd Nuevaversioncondockertspsystem
```

## Paso 2: Configurar respaldos automáticos (opcional)

Abrí el archivo `docker-compose.yml` y verificá que exista esta línea en `volumes:` del servicio `app`:

```yaml
- C:\respaldos-spsystem:/app/respaldos
```

Podés cambiar `C:\respaldos-spsystem` por la ruta que prefieras, por ejemplo:
```yaml
- D:\Backups\SPSystem:/app/respaldos
```

## Paso 3: Iniciar el sistema

```bash
cd C:\spsystem
docker compose up -d --build
```

**Primer inicio (puede tardar 5-10 minutos):**
1. Descarga la imagen de PostgreSQL 16
2. Construye la aplicación Node.js
3. Ejecuta la migración de base de datos automática
4. Carga los datos iniciales (usuario admin)

Verificá que ambos contenedores estén corriendo:
```bash
docker compose ps
```

Debe mostrar dos servicios: `db` y `app`, ambos con estado `Up`.

## Paso 4: Acceder al sistema

- **URL:** http://localhost:3000
- **Usuario:** admin
- **Contraseña:** admin123

## Paso 5: Configurar licencia

1. Iniciá sesión como admin
2. Andá a **Configuración → Licencia**
3. Copiá el **Machine ID** que aparece en pantalla
4. Ejecutá el generador de licencia interactivo:
```bash
cd C:\spsystem
node scripts/generar-licencia.js --interactivo
```
5. Seguí las instrucciones: pegá el Machine ID, seleccioná duración
6. Se generará un archivo `.lic`
7. En la pantalla de Licencia del sistema, seleccioná el archivo generado

También podés editar `docker-compose.yml` para cambiar la duración de la sesión u otras variables de entorno.

## Mantenimiento

### Detener el sistema
```bash
docker compose down
```

### Actualizar el sistema
```bash
git pull                              # si usás Git, o reemplazá la carpeta
docker compose up -d --build          # reconstruye y reinicia
```

### Ver logs
```bash
docker compose logs -f app
```

### Respaldos automáticos

El sistema genera un respaldo automático **cada domingo a las 2:00 AM** en `C:\respaldos-spsystem`.
Se mantienen solo los últimos 4 respaldos.

Configurá Google Drive (o cualquier servicio de sincronización) para que sincronice esa carpeta
y tener backups automáticos en la nube.

### Restaurar un respaldo

1. Entrá al sistema como admin
2. Andá a **Sistema → Respaldos**
3. En la sección "Restaurar respaldo", seleccioná el archivo `.sql`
4. Hacé clic en "Restaurar respaldo"
5. La sesión se cerrará automáticamente; volvé a iniciar sesión

## Posibles problemas

**Error "no se puede conectar a la base de datos"**
```bash
docker compose restart db
docker compose restart app
```

**Error de pg_dump al descargar respaldo**
Asegurate de estar accediendo desde http://localhost:3000 mientras los contenedores Docker están corriendo.

**Reconstruir desde cero**
```bash
docker compose down -v    # elimina también los volúmenes (DATOS!)
docker compose up -d --build
```
⚠️ Esto borra toda la base de datos y vuelve a los datos iniciales.

## Credenciales por defecto

| Usuario   | Contraseña | Rol          |
|-----------|-----------|--------------|
| admin     | admin123  | Administrador |
| spantoja  | 12345     | Supervisor    |

Se recomienda cambiar la contraseña de admin en el primer inicio.
