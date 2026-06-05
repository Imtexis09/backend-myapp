const db = require('../database/db');
const { generarUUID } = require('../utils/uuid');
const { NOM251_QUESTIONS } = require('../utils/constants');
const { generarQRCode } = require('../services/qrService');
const { recalcularScore } = require('../services/scoreService');

// 1. Registrar un negocio
exports.registerBusiness = (req, res) => {
    const { name, rfc, address, business_type } = req.body;
    const merchantId = req.userId; // Obtenido del token

    if (!name || !rfc || !address || !business_type) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const businessId = generarUUID();
    const query = `
        INSERT INTO businesses (id, merchant_id, name, rfc, address, business_type, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    db.run(query, [businessId, merchantId, name, rfc, address, business_type], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'El RFC ya está registrado' });
            }
            return res.status(500).json({ error: 'Error al registrar el negocio' });
        }
        res.status(201).json({ mensaje: 'Negocio registrado (Pendiente de diagnóstico)', businessId });
    });
};

// 2. Obtener preguntas de la NOM-251
exports.getQuestions = (req, res) => {
    res.json({ questions: NOM251_QUESTIONS });
};

// 3. Enviar respuestas de autodiagnóstico
exports.submitDiagnostic = async (req, res) => {
    const { business_id, answers } = req.body; // answers: { q1: true, q2: false... }

    if (!business_id || !answers) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    try {
        // Guardar cada respuesta en la base de datos
        const stmt = db.prepare(`INSERT INTO diagnostic_answers (id, business_id, question_id, answer) VALUES (?, ?, ?, ?)`);
        
        for (const [questionId, answerValue] of Object.entries(answers)) {
            stmt.run(generarUUID(), business_id, questionId, answerValue ? 1 : 0);
        }
        stmt.finalize();

        // Calcular score inicial y generar código QR
        await recalcularScore(business_id);
        const qrImage = await generarQRCode(business_id);

        // Actualizar negocio a activo y guardar su QR
        db.run(`UPDATE businesses SET status = 'active', qr_code = ? WHERE id = ?`, [qrImage, business_id], async (err) => {
            if (err) return res.status(500).json({ error: 'Error al activar el negocio' });
            
            res.json({ 
                mensaje: 'Diagnóstico guardado con éxito. Negocio Activado.',
                qr_code_base64: qrImage
            });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error en el proceso del diagnóstico' });
    }
};

// 4. Responder a un incidente reportado por los clientes
exports.respondIncident = (req, res) => {
    const incidentId = req.params.id;
    const { response_text } = req.body;
    const merchantId = req.userId;

    if (!response_text) {
        return res.status(400).json({ error: 'La respuesta no puede estar vacía' });
    }

    // Verificar propiedad del negocio del incidente
    const checkQuery = `
        SELECT i.business_id, b.merchant_id FROM incidents i
        JOIN businesses b ON i.business_id = b.id
        WHERE i.id = ?
    `;

    db.get(checkQuery, [incidentId], async (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Incidente no encontrado' });
        if (row.merchant_id !== merchantId) return res.status(403).json({ error: 'No tienes permiso sobre este negocio' });

        const updateQuery = `
            UPDATE incidents 
            SET status = 'resolved', merchant_response = ?, responded_at = datetime('now')
            WHERE id = ?
        `;

        db.run(updateQuery, [response_text, incidentId], async function(err) {
            if (err) return res.status(500).json({ error: 'Error al responder el incidente' });

            // Recalcular Score de inmediato por la resolución
            await recalcularScore(row.business_id);

            // Si quedan menos de 3 pendientes, desactivar alertas
            db.get(`SELECT COUNT(*) as pendientes FROM incidents WHERE business_id = ? AND status = 'pending'`, [row.business_id], (err, r) => {
                if (!err && r.pendientes < 3) {
                    db.run(`UPDATE alerts SET is_active = 0, resolved_at = datetime('now') WHERE business_id = ? AND is_active = 1`, [row.business_id]);
                }
            });

            res.json({ mensaje: 'Incidente resuelto y respondido correctamente' });
        });
    });
};