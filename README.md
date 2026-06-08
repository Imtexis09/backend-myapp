# SafeScore QR - Backend API 🚀

Este repositorio contiene el sistema backend para **SafeScore QR**, una plataforma de monitoreo de cumplimiento higiénico comercial basado en la normativa **NOM-251**. El sistema permite a los comerciantes evaluar sus establecimientos, generar códigos QR de estado y faculta a los ciudadanos para consultar el histórico de higiene y reportar incidencias en tiempo real.

El proyecto está diseñado bajo una arquitectura REST, construido con **Node.js** y **Express**, y desplegado en la nube utilizando **Railway** con persistencia de datos en **SQLite**.

---

## 🛠️ Tecnologías Utilizadas

* **Entorno de Ejecución:** Node.js (v22+)
* **Framework Web:** Express.js
* **Base de Datos:** SQLite3 (Configurado con volumen persistente en la nube)
* **Autenticación:** JSON Web Tokens (JWT) & Bcrypt
* **Automatización:** Cron Jobs independientes (ejecución cada 15 minutos)
* **Despliegue:** Railway CLI & GitHub Actions

---

## 🎯 Características Principales

1.  **Autenticación y Seguridad (RBAC):** Control de acceso basado en roles (Comerciante / Consumidor) cifrado con tokens JWT.
2.  **Evaluación NOM-251:** Motor de reglas que califica el cuestionario del establecimiento y genera un **Score de Higiene** inicial.
3.  **Generación y Escaneo de QR:** Flujo optimizado para parsear URLs dinámicas de códigos QR y retornar instantáneamente el perfil del negocio al frontend móvil.
4.  **Reportes Ciudadanos en Cascada:** Al recibir una denuncia, el backend recalculó de forma síncrona el Score e intercepta si corresponde un cambio a Alerta Naranja.
5.  **Cron Jobs de Auditoría:** Tareas programadas en la nube que despiertan cada 15 minutos para degradar y auditar la vigencia de las alertas de forma autónoma.

---

## 🗺️ Arquitectura de Endpoints (API de Consumo)

### Rutas del Consumidor (`/api`)

| Método | Endpoint | Descripción | Autenticación |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scan` | Procesa el string del QR escaneado y extrae el ID del negocio. | Pública |
| `GET` | `/api/business/:id` | Obtiene el perfil del negocio, estatus de alerta e historial de incidentes. | Pública |
| `POST` | `/api/business/:id/report` | Registra una denuncia o anomalía higiénica (Permite modo anónimo). | Opcional |
| `GET` | `/api/reports/history` | Obtiene el historial de reportes realizados por el cliente autenticado. | **Requerida (JWT)** |

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para clonar y ejecutar el servidor en tu entorno de desarrollo local:

### 1. Clonar el repositorio

`git clone [https://github.com/tu-usuario/tu-repositorio-backend.git](https://github.com/tu-usuario/tu-repositorio-backend.git)
cd tu-repositorio-backend`

### 2. Instalar dependencias

`npm install`

### 3. Configurar variables de entorno
Crea un archivo .env en la raiz del proyecto y define las siguientes variables:

`PORT=3000
JWT_SECRET=tu_palabra_secreta_super_segura
NODE_ENV=development`

### 4. Levantar el servidor Local
El servidor iniciará en http://localhost:3000 con recarga automática mediante nodemon.
`npm run dev`


### 5. ☁️ Despliegue en Producción (Railway)
Este backend está listo para ser desplegado en Railway. Debido al uso de SQLite en entornos Linux basados en contenedores, el archivo package.json incluye scripts automatizados de compilación nativa:
`"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "install": "npm rebuild sqlite3 --build-from-source"
}`

## 🚀 Pasos para actualizar producción:

### 1. Asegúrate de configurar las Variables de Entorno (Variables en el dashboard de Railway).

### 2. Vincula un volumen persistente de tipo Volume montado en la ruta de tu base de datos para evitar pérdida de datos en los reinicios del contenedor.

### 3. Realiza un push directo a tu rama principal:

`git add .
git commit -m "feat: listo para producción"
git push origin main`

Railway detectará el cambio y compilará automáticamente usando los recursos óptimos de la nube.


