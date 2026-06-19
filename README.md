# Youmario Music

Site de musicas com painel admin, biblioteca local, player fixo e pesquisa/conversao MP3 via `yt-dlp` para conteudo autorizado.

## Requisitos no Kali Linux

```bash
sudo apt update
sudo apt install nodejs npm mariadb-server nginx ffmpeg yt-dlp
```

## Configuracao

```bash
cp .env.example .env
npm install
```

Edita o `.env` com a senha real da base de dados.

## Base de dados

```sql
CREATE DATABASE youmario_music CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'youmario'@'localhost' IDENTIFIED BY 'SenhaForte123';
GRANT ALL PRIVILEGES ON youmario_music.* TO 'youmario'@'localhost';
FLUSH PRIVILEGES;

USE youmario_music;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

CREATE TABLE musicas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(180) NOT NULL,
  artista VARCHAR(180),
  genero VARCHAR(120),
  descricao TEXT,
  capa VARCHAR(255),
  ficheiro VARCHAR(255) NOT NULL,
  downloads INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Cria o primeiro admin com uma senha temporaria. No primeiro login, o sistema troca automaticamente para hash `bcrypt`.

```sql
INSERT INTO admins (username, password) VALUES ('admin', '12345');
```

## Rodar

```bash
npm start
```

Abre:

```text
http://localhost:3000
```

## Nginx

Exemplo de proxy:

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 80M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Observacao legal

A conversao YouTube MP3 deve ser usada apenas com conteudo proprio, livre, Creative Commons, dominio publico ou com permissao do autor.
