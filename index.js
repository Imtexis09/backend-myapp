const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const db = require('./database/db');
const authRoutes = require('./routes/auth');
const merchantRoutes = require('./routes/merchant');
const consumerRoutes = require('./routes/consumer');
const {iniciarCronJobs} = require ('./services/cronService');

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', merchantRoutes);
app.use('/api', consumerRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: "¡Hola! Mi backend en Node.js está funcionando" });
});

// Usamos el puerto del archivo .env o el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    //Encender el reloj de tareas
    iniciarCronJobs();
});