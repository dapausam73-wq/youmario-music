const express = require('express');
const bcrypt = require('bcrypt');

const db = require('../config/db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query(
        'SELECT * FROM admins WHERE username=? LIMIT 1',
        [username],
        async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).render('login', { erro: 'Erro no servidor.' });
            }

            if (result.length === 0) {
                return res.status(401).render('login', { erro: 'Login invalido.' });
            }

            const admin = result[0];
            const storedPassword = String(admin.password || '');
            const isHash = storedPassword.startsWith('$2a$') ||
                storedPassword.startsWith('$2b$') ||
                storedPassword.startsWith('$2y$');

            const validPassword = isHash
                ? await bcrypt.compare(password, storedPassword)
                : password === storedPassword;

            if (!validPassword) {
                return res.status(401).render('login', { erro: 'Login invalido.' });
            }

            if (!isHash) {
                const hash = await bcrypt.hash(password, 12);
                db.query('UPDATE admins SET password=? WHERE id=?', [hash, admin.id]);
            }

            req.session.admin = {
                id: admin.id,
                username: admin.username
            };

            res.redirect('/admin/dashboard');
        }
    );
});

router.post('/logout', auth, (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

router.get('/dashboard', auth, (req, res) => {
    res.render('dashboard', { admin: req.session.admin });
});

router.get('/upload', auth, (req, res) => {
    res.render('upload', { erro: null });
});

router.post(
    '/upload',
    auth,
    upload.fields([
        { name: 'capa', maxCount: 1 },
        { name: 'musica', maxCount: 1 }
    ]),
    (req, res) => {
        const { titulo, artista, genero, descricao } = req.body;

        if (!req.files || !req.files.musica) {
            return res.status(400).render('upload', { erro: 'Seleciona um ficheiro MP3.' });
        }

        const capa = req.files.capa ? req.files.capa[0].filename : null;
        const musica = req.files.musica[0].filename;

        db.query(
            `INSERT INTO musicas
            (titulo, artista, genero, descricao, capa, ficheiro)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                titulo,
                artista || 'Desconhecido',
                genero || 'Nao definido',
                descricao || '',
                capa,
                musica
            ],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).render('upload', { erro: 'Erro ao guardar musica.' });
                }

                res.redirect('/');
            }
        );
    }
);

module.exports = router;
