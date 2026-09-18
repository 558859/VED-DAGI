const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connexion Aiven Cloud MySQL sécurisée
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-38bb9285-abouibrahim401-e4cd.i.aivencloud.com',
    port: process.env.DB_PORT || 26721,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
async function initDB() {
    try {
        const connection = await db.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS membres (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                pays VARCHAR(100) NOT NULL,
                telephone VARCHAR(50) NOT NULL,
                niveau VARCHAR(50) NOT NULL,
                message TEXT,
                date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        connection.release();
        console.log('Base de données MySQL initialisée avec succès.');
    } catch (err) {
        console.error('Erreur lors de l\'initialisation MySQL :', err.message);
    }
}
initDB();

app.post('/api/inscription', async (req, res) => {
    const nom = req.body.nom || '';
    const email = req.body.email || '';
    const pays = req.body.pays || '';
    const telephone = req.body.telephone || '';
    const niveau = req.body.niveau || '';
    const message = req.body.message || '';

    if (!nom || !email || !pays || !telephone || !niveau) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tous les champs obligatoires doivent être remplis.' 
        });
    }

    try {
        const query = 'INSERT INTO membres (nom, email, pays, telephone, niveau, message) VALUES (?, ?, ?, ?, ?, ?)';
        await db.execute(query, [nom, email, pays, telephone, niveau, message]);
        res.status(200).json({ success: true, message: 'Inscription réussie !' });
    } catch (error) {
        console.error('Erreur serveur / SQL :', error);
        res.status(500).json({ success: false, message: 'Erreur interne lors de l\'enregistrement.' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});