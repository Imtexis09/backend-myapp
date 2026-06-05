const QRCode = require('qrcode');

// Genera un string en Base64 listo para pintar en el Frontend móvil
exports.generarQRCode = async (businessId) => {
    try {
        const urlRedireccion = `http://localhost:3000/scan/${businessId}`;
        
        // Genera el código QR en un formato de texto de datos de imagen (DataURL)
        const qrImageBase64 = await QRCode.toDataURL(urlRedireccion);
        return qrImageBase64;
    } catch (err) {
        console.error('❌ Error al generar el código QR:', err.message);
        throw new Error('No se pudo generar el QR');
    }
};