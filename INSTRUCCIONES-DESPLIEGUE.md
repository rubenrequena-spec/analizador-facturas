# Despliegue en Vercel — Analizador de Facturas

## Lo que necesitas
- Cuenta en Vercel (gratis): vercel.com
- Cuenta en GitHub (gratis): github.com
- API key de Anthropic: console.anthropic.com

## Pasos (10 minutos)

### 1. Sube el proyecto a GitHub
1. Ve a github.com → "New repository"
2. Ponle nombre: `analizador-facturas-fh`
3. Sube los archivos de esta carpeta

### 2. Conecta con Vercel
1. Ve a vercel.com → "Add New Project"
2. Importa el repositorio de GitHub
3. Deja la configuración por defecto
4. Antes de desplegar, añade la variable de entorno:
   - **Nombre:** `ANTHROPIC_API_KEY`
   - **Valor:** tu API key de Anthropic
5. Pulsa "Deploy"

### 3. ¡Listo!
Vercel te dará una URL tipo `analizador-facturas-fh.vercel.app`
Esa URL es la que compartes con los comerciales.

## Dominio personalizado (opcional)
Si tienes un dominio (ej: app.finanzashealthy.es), puedes conectarlo
en Vercel → Settings → Domains.

## Actualizaciones
Cada vez que actualices los archivos en GitHub, Vercel despliega
automáticamente en 1-2 minutos.
