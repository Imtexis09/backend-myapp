const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Rutas a los archivos usando el archivo .env o valores por defecto
const dbDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.RENDER_DISK_MOUNT_PATH || __dirname;
const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// Verificar si la base de datos ya existe antes de crearla
const dbExiste = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error al conectar con SQLite:', err.message);
    } else {
        console.log('💾 Conectado con éxito a la base de datos SQLite.');
        
        // Si no existía el archivo, ejecutamos el script SQL para crear las tablas
        if (!dbExiste) {
            console.log('🆕 Base de datos nueva detectada. Creando tablas desde schema.sql...');
            inicializarTablas();
        }
    }
});

function inicializarTablas() {
    try {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        
        // Ejecuta todo el bloque de comandos SQL del archivo schema.sql
        db.exec(sql, (err) => {
            if (err) {
                console.error('❌ Error al crear las tablas:', err.message);
            } else {
                console.log('✅ Todas las tablas se crearon correctamente.');
            }
        });
    } catch (error) {
        console.error('❌ No se pudo leer el archivo schema.sql:', error.message);
    }
}

module.exports = db;