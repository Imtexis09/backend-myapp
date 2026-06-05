const db = require('../database/db');
const { generarUUID } = require('../utils/uuid');

// 1. RECALCULAR SCORE DE UN NEGOCIO
exports.recalcularScore = (businessId) => {
    return new Promise((resolve, reject) => {
        // A. Obtener respuestas de diagnóstico del negocio
        const diagQuery = `SELECT answer FROM diagnostic_answers WHERE business_id = ?`;
        
        db.all(diagQuery, [businessId], (err, rows) => {
            if (err) return reject(err);
            
            const totalPreguntas = 10; // Según NOM-251 fijadas en tu plano
            const respuestasSi = rows.filter(r => r.answer === 1 || r.answer === true || r.answer === 'true').length;
            const puntajeDiagnostico = totalPreguntas > 0 ? (respuestasSi / totalPreguntas) * 100 : 0;

            // B. Calcular penalización por incidentes activos (pending o verified)
            const incQuery = `
                SELECT COUNT(*) as activos FROM incidents 
                WHERE business_id = ? AND status IN ('pending', 'verified')
            `;
            
            db.get(incQuery, [businessId], (err, row) => {
                if (err) return reject(err);
                
                const incidentesActivos = row.activos || 0;
                const penalizacion = Math.min(incidentesActivos * 5, 60); // Máximo 60 puntos de penalización
                const puntajeIncidentes = 100 - penalizacion;

                // C. Calcular Score Final
                const nuevoScore = Math.round((puntajeDiagnostico + puntajeIncidentes) / 2);

                // D. Actualizar el score en la tabla de negocios
                const updateQuery = `UPDATE businesses SET score = ? WHERE id = ?`;
                db.run(updateQuery, [nuevoScore, businessId], (err) => {
                    if (err) return reject(err);
                    console.log(`📊 Score actualizado para negocio ${businessId}: ${nuevoScore}`);
                    resolve(nuevoScore);
                });
            });
        });
    });
};

// 2. VERIFICAR Y ACTIVAR ALERTA NARANJA
exports.verificarAlertaNaranja = (businessId) => {
    const queryIncidentes = `
        SELECT COUNT(*) as recientes FROM incidents 
        WHERE business_id = ? 
        AND status = 'pending' 
        AND reported_at > datetime('now', '-48 hours')
    `;

    db.get(queryIncidentes, [businessId], (err, row) => {
        if (err || !row) return;

        if (row.recientes >= 3) {
            // Verificar si ya tiene una alerta naranja activa
            const queryAlertaExistente = `
                SELECT * FROM alerts 
                WHERE business_id = ? AND alert_type = 'orange' AND is_active = 1
            `;
            
            db.get(queryAlertaExistente, [businessId], (err, alerta) => {
                if (!alerta) {
                    const alertaId = generarUUID();
                    const insertAlerta = `
                        INSERT INTO alerts (id, business_id, alert_type, is_active) 
                        VALUES (?, ?, 'orange', 1)
                    `;
                    db.run(insertAlerta, [alertaId, businessId], (err) => {
                        if (err) return;
                        console.log(`⚠️ ALERTA NARANJA ACTIVADA: El negocio ${businessId} acumuló ${row.recientes} reportes recientes.`);
                        
                        // Configurar disparador automático para alerta roja tras 24 horas si no responde
                        setTimeout(() => {
                            exports.verificarAlertaRoja(businessId);
                        }, 24 * 60 * 60 * 1000); 
                    });
                }
            });
        }
    });
};

// 3. VERIFICAR Y ACTIVAR ALERTA ROJA (24 horas después)
exports.verificarAlertaRoja = (businessId) => {
    const queryAlertaNaranja = `
        SELECT * FROM alerts 
        WHERE business_id = ? AND alert_type = 'orange' AND is_active = 1
    `;

    db.get(queryAlertaNaranja, [businessId], (err, alerta) => {
        if (err || !alerta) return; // Si ya solucionó la naranja, no pasa a roja

        const queryPendientes = `
            SELECT COUNT(*) as pendientes FROM incidents 
            WHERE business_id = ? AND status = 'pending'
        `;

        db.get(queryPendientes, [businessId], (err, row) => {
            if (err || !row) return;

            if (row.pendientes >= 3) {
                const alertaRojaId = generarUUID();
                const insertRoja = `
                    INSERT INTO alerts (id, business_id, alert_type, is_active) 
                    VALUES (?, ?, 'red', 1)
                `;
                db.run(insertRoja, [alertaRojaId, businessId], (err) => {
                    if (!err) console.log(`🚨 ALERTA ROJA ACTIVADA: El negocio ${businessId} ignoró reportes por 24 horas.`);
                });
            }
        });
    });
};