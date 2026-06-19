const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const router = express.Router();
const ytdlpPath = process.env.YTDLP_PATH || 'yt-dlp';
const youtubeDir = path.join(__dirname, '..', 'uploads', 'youtube');

fs.mkdirSync(youtubeDir, { recursive: true });

function runYtDlp(args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(ytdlpPath, args, {
            shell: false,
            windowsHide: true,
            ...options
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', reject);

        child.on('close', (code) => {
            if (code !== 0) {
                const error = new Error(stderr || 'Falha ao executar yt-dlp.');
                error.code = code;
                return reject(error);
            }

            resolve(stdout);
        });
    });
}

function cleanFileName(value) {
    return String(value || 'musica')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 90) || 'musica';
}

function videoUrl(id) {
    return `https://www.youtube.com/watch?v=${id}`;
}

function extractVideoId(value) {
    const text = String(value || '');
    const patterns = [
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?[^ ]*v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) return match[1];
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(text) ? text : null;
}

router.get('/search', async (req, res) => {
    const q = String(req.query.q || '').trim();

    if (q.length < 2) {
        return res.json({ sucesso: true, resultados: [] });
    }

    try {
        const directId = extractVideoId(q);
        const searchTarget = directId ? videoUrl(directId) : `ytsearch8:${q}`;
        const stdout = await runYtDlp([
            '--dump-json',
            '--flat-playlist',
            searchTarget
        ]);

        const resultados = stdout
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line))
            .filter((item) => item.id)
            .map((item) => ({
                id: item.id,
                titulo: item.title || 'Sem titulo',
                canal: item.uploader || item.channel || 'YouTube',
                duracao: item.duration_string || '',
                thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
                url: videoUrl(item.id)
            }));

        res.json({ sucesso: true, resultados });
    } catch (erro) {
        console.error(erro.message);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Instala o yt-dlp no servidor para pesquisar no YouTube.'
        });
    }
});

router.post('/download', async (req, res) => {
    const { id, titulo } = req.body || {};

    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return res.status(400).json({
            sucesso: false,
            mensagem: 'Video invalido.'
        });
    }

    const safeTitle = cleanFileName(titulo || id);
    const stamp = Date.now();
    const outputTemplate = path.join(youtubeDir, `${stamp}-${safeTitle}.%(ext)s`);
    const finalName = `${stamp}-${safeTitle}.mp3`;
    const finalPath = path.join(youtubeDir, finalName);

    try {
        await runYtDlp([
            videoUrl(id),
            '--no-playlist',
            '-x',
            '--audio-format',
            'mp3',
            '--audio-quality',
            '0',
            '-o',
            outputTemplate
        ]);

        if (!fs.existsSync(finalPath)) {
            const created = fs.readdirSync(youtubeDir)
                .find((file) => file.startsWith(`${stamp}-${safeTitle}`) && file.endsWith('.mp3'));

            if (!created) {
                return res.status(500).json({
                    sucesso: false,
                    mensagem: 'O MP3 nao foi criado. Confirma se o ffmpeg esta instalado.'
                });
            }

            return res.json({
                sucesso: true,
                ficheiro: created,
                url: `/uploads/youtube/${encodeURIComponent(created)}`
            });
        }

        res.json({
            sucesso: true,
            ficheiro: finalName,
            url: `/uploads/youtube/${encodeURIComponent(finalName)}`
        });
    } catch (erro) {
        console.error(erro.message);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Falha ao converter. Confirma yt-dlp, ffmpeg e permissao para este conteudo.'
        });
    }
});

module.exports = router;
