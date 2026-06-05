const cron = require('node-cron');
const db = require('../database/db');
const { recalcularScore, verificarAlertaNaranja } = require('./scoreService');

function iniciarCronJobs() {
    console.log('⏰ Sistema de Tareas Programadas (Cron Jobs) Inicializado.');

    // TAREA 1 - Cada hora ('0 * * * *'): Recalcular scores de negocios con actividad reciente
    cron.schedule('0 * * * *', () => {
        console.log('🔄 [CRON] Iniciando recalculo horario de scores...');
        
        const query = `
            SELECT DISTINCT business_id FROM incidents 
            WHERE reported_at > datetime('now', '-1 day')
        `;

        db.all(query, [], async (err, rows) => {
            if (err || !rows) return;
            
            for (const row of rows) {
                try {
                    await recalcularScore(row.business_id);
                } catch (error) {
                    console.error(`❌ [CRON] Error al recalcular score para ${row.business_id}`);
                }
            }
        });
    });

    // TAREA 2 - Cada 15 minutos ('*/15 * * * *'): Verificar alertas activas por falta de respuesta
    cron.schedule('*/15 * * * *', () => {
        console.log('🕵️‍♂️ [CRON] Verificando incidentes pendientes para alertas...');
        
        const query = `
            SELECT DISTINCT business_id FROM incidents 
            WHERE status = 'pending'
        `;

        db.all(query, [], (err, rows) => {
            if (err || !rows) return;
            
            for (const row of rows) {
                verificarAlertaNaranja(row.business_id);
            }
        });
    });
}

module.exports = { iniciarCronJobs };