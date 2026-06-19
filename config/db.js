const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'youmario',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'youmario_music'
});

db.connect((err) => {
    if (err) {
        console.error('Erro MariaDB:', err.message);
        return;
    }

    console.log('MariaDB conectado');
});

module.exports = db;
