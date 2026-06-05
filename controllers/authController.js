const db = require('../database/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { generarUUID } = require('../utils/uuid');

// 1. REGISTRO DE USUARIOS
exports.register = async (req, res) => {
    const { email, password, full_name, phone, role } = req.body;

    // Validación básica de campos
    if (!email || !password || !full_name || !role) {
        return res.status(400).json({ error: 'Todos los campos obligatorios deben estar llenos' });
    }

    try {
        // Encriptar la contraseña (10 rondas de seguridad)
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = generarUUID();

        const query = `
            INSERT INTO users (id, email, password, role, full_name, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(query, [userId, email, hashedPassword, role, full_name, phone], function(err) {
            if (err) {
                 console.error("ERROR REAL DE SQLITE: ",err.message);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
                }
                return res.status(500).json({ error: 'Error al registrar al usuario en la base de datos' });
             
            }
            
            res.status(201).json({ 
                mensaje: 'Usuario registrado con éxito',
                userId: userId
            });
        });

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// 2. LOGIN DE USUARIOS
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const query = `SELECT * FROM users WHERE email = ?`;

    db.get(query, [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas (usuario no encontrado)' });
        }

        // Comparar la contraseña ingresada con la encriptada en la BD
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales incorrectas (contraseña incorrecta)' });
        }

        // Crear el Token JWT (expira en 24 horas)
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Quitar la contraseña del objeto antes de enviarlo por seguridad
        delete user.password;

        res.json({
            token: token,
            user: user
        });
    });
};