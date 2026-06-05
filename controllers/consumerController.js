const db = require('../database/db');
const { generarUUID } = require('../utils/uuid');
const { recalcularScore, verificarAlertaNaranja } = require('../services/scoreService');

// 1. Escanear un QR (Extrae el ID del link recibido)
exports.scanQR = (req, res) => {
    const { qr_code } = req.body; // Se recibe el string http://localhost:3000/scan/ID_DE_NEGOCIO
    
    if (!qr_code) return res.status(400).json({ error: 'Código QR requerido' });

    const partes = qr_code.split('/');
    const businessId = partes[partes.length - 1]; // Toma el último segmento de la URL

    db.get(`SELECT id, name, score FROM businesses WHERE id = ?`, [businessId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Negocio no válido o no encontrado' });
        res.json({ business_id: row.id, name: row.name, score: row.score });
    });
};

// 2. Obtener detalles de un negocio para el cliente
exports.getBusinessDetail = (req, res) => {
    const businessId = req.params.id;

    db.get(`SELECT * FROM businesses WHERE id = ?`, [businessId], (err, negocio) => {
        if (err || !negocio) return res.status(404).json({ error: 'Negocio no encontrado' });

        // Obtener alerta activa si existe
        db.get(`SELECT alert_type FROM alerts WHERE business_id = ? AND is_active = 1 ORDER BY triggered_at DESC LIMIT 1`, [businessId], (err, alerta) => {
            const alert_status = alerta ? alerta.alert_type : 'green';

            // Obtener sus últimos 10 incidentes
            db.all(`SELECT * FROM incidents WHERE business_id = ? ORDER BY reported_at DESC LIMIT 10`, [businessId], (err, incidentes) => {
                res.json({
                    id: negocio.id,
                    name: negocio.name,
                    address: negocio.address,
                    score: negocio.score,
                    alert_status: alert_status,
                    incidents: incidentes || []
                });
            });
        });
    });
};

// 3. Reportar un incidente (puede ser anónimo si no viene token)
exports.reportIncident = (req, res) => {
    const businessId = req.params.id;
    const { category, description } = req.body;
    
    // Si la ruta tiene token, usamos el ID, si no, se guarda como anónimo
    const reportedBy = req.userId || null; 

    if (!category || !description) {
        return res.status(400).json({ error: 'Categoría y descripción son obligatorias' });
    }

    const incidentId = generarUUID();
    const query = `
        INSERT INTO incidents (id, business_id, reported_by, category, description, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
    `;

    db.run(query, [incidentId, businessId, reportedBy, category, description], async function(err) {
        if (err) return res.status(500).json({ error: 'Error al registrar tu reporte' });

        // Operaciones en cascada automáticas:
        try {
            await recalcularScore(businessId);
            verificarAlertaNaranja(businessId);
            res.status(201).json({ mensaje: 'Reporte registrado de forma exitosa', incident_id: incidentId });
        } catch (error) {
            res.status(201).json({ mensaje: 'Reporte guardado, fallo en recalcular score instantáneo' });
        }
    });
};

// 4. Obtener el historial de reportes hechos por el usuario autenticado
exports.getUserReportsHistory = (req, res) => {
    // El ID del usuario viene del token decodificado en el middleware verifyToken
    const userId = req.userId; 

    if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado o token inválido' });
    }

    // Consulta con INNER JOIN para traer los datos del reporte junto con el nombre del negocio
    const query = `
        SELECT 
            i.id AS incident_id,
            i.category,
            i.description,
            i.status,
            i.reported_at,
            b.name AS business_name,
            b.address AS business_address
        FROM incidents i
        INNER JOIN businesses b ON i.business_id = b.id
        WHERE i.reported_by = ?
        ORDER BY i.reported_at DESC
    `;

    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Error al obtener el historial de reportes' });
        }

        res.json({
            total_reportes: rows.length,
            reportes: rows
        });
    });
};