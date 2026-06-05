const crypto = require('crypto');

// Genera un ID único y aleatorio (UUID v4)
function generarUUID() {
    return crypto.randomUUID();
}

module.exports = { generarUUID };