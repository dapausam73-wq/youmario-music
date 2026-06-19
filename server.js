const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const db = require('./config/db');
const adminRoutes = require('./routes/admin');
const downloadRoutes = require('./routes/download');
const youtubeRoutes = require('./routes/youtube');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'troque_esta_chave_no_servidor',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/admin', adminRoutes);
app.use('/download', downloadRoutes);
app.use('/youtube', youtubeRoutes);

app.get('/', (req, res) => {
    db.query('SELECT * FROM musicas ORDER BY id DESC', (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao carregar musicas');
        }

        res.render('index', {
            musicas: result,
            total: result.length
        });
    });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
    console.log(`Youmario Music iniciado na porta ${PORT}`);
});
