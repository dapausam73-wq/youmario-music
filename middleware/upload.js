const fs = require('fs');
const multer = require('multer');
const path = require('path');

const capaDir = path.join(__dirname, '..', 'uploads', 'capas');
const musicaDir = path.join(__dirname, '..', 'uploads', 'musicas');

fs.mkdirSync(capaDir, { recursive: true });
fs.mkdirSync(musicaDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, file.fieldname === 'capa' ? capaDir : musicaDir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});

function fileFilter(req, file, cb) {
    if (file.fieldname === 'capa' && file.mimetype.startsWith('image/')) {
        return cb(null, true);
    }

    if (file.fieldname === 'musica' && file.mimetype === 'audio/mpeg') {
        return cb(null, true);
    }

    cb(new Error('Tipo de ficheiro invalido.'));
}

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});
