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

// Configuration du transporteur SMTP Gmail adaptée à Render (Port 465 SSL explicite)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL/TLS sur port 465 pour éviter la déconnexion sur Render
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS
    }
});

// Connexion Aiven Cloud MySQL sécurisée
const db = mysql.createPool({
    host: process.env.DB_HOST || 'mysql-38bb9285-abouibrahim401-e4cd.i.aivencloud.com',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 26721,
    user: process.env.DB_USER || 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialisation de la table dans MySQL
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

// Route d'inscription
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
        // 1. Sauvegarde dans MySQL / Aiven Cloud
        const query = 'INSERT INTO membres (nom, email, pays, telephone, niveau, message) VALUES (?, ?, ?, ?, ?, ?)';
        await db.execute(query, [nom, email, pays, telephone, niveau, message]);
        console.log('Inscription enregistrée avec succès dans la base de données.');

        // 2. Préparation du mail de confirmation
        const mailOptions = {
            from: '"V.E.D DAGI" <' + (process.env.BREVO_USER || 'abouibrahim401@gmail.com') + '>',
            to: email,
            subject: 'Confirmation de votre inscription - V.E.D DAGI',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #2e7d32; text-align: center;">Vision Étudiante de Dagi (V.E.D DAGI)</h2>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p>Bonjour <strong>${nom}</strong>,</p>
                    <p>Nous avons bien reçu votre formulaire d'inscription au sein de notre association.</p>
                    <p><strong>Récapitulatif de vos informations :</strong></p>
                    <ul>
                        <li><strong>Pays :</strong> ${pays}</li>
                        <li><strong>Téléphone :</strong> ${telephone}</li>
                        <li><strong>Niveau d'étude :</strong> ${niveau}</li>
                    </ul>
                    <p>Notre équipe examinera votre demande et prendra contact avec vous très prochainement.</p>
                    <br>
                    <p>Cordialement,<br><strong>L'équipe V.E.D DAGI</strong></p>
                </div>
            `
        };

        // 3. Envoi asynchrone de l'e-mail via Gmail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Erreur d'envoi d'e-mail via Gmail :", error);
            } else {
                console.log("E-mail de confirmation envoyé :", info.messageId);
            }
        });

        // 4. Réponse au client
        return res.status(200).json({ success: true, message: 'Inscription réussie et e-mail de confirmation envoyé !' });

    } catch (error) {
        console.error('Erreur détaillée lors de l\'enregistrement :', error);
        return res.status(500).json({ success: false, message: 'Erreur interne lors de l\'enregistrement.' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});