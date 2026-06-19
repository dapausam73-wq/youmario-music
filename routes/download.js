const express = require('express');
const path = require('path');

const db = require('../config/db');

const router = express.Router();

router.get('/:id', (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
        return res.status(400).send('Download invalido');
    }

    db.query('SELECT * FROM musicas WHERE id=?', [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send('Musica nao encontrada');
        }

        const fileName = path.basename(result[0].ficheiro);
        const filePath = path.join(__dirname, '..', 'uploads', 'musicas', fileName);

        db.query('UPDATE musicas SET downloads = COALESCE(downloads, 0) + 1 WHERE id=?', [id]);

        res.download(filePath, fileName);
    });
});

module.exports = router;
