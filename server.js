/* ===========================
   Maison Yvoir — Server
   Express backend with auth, CMS API, image uploads
   =========================== */

const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Security secrets (generated at first run, persisted) ---
const SECRETS_PATH = path.join(__dirname, 'data', '.secrets.json');

function loadOrCreateSecrets() {
    if (fs.existsSync(SECRETS_PATH)) {
        return JSON.parse(fs.readFileSync(SECRETS_PATH, 'utf-8'));
    }
    const secrets = {
        jwtSecret: crypto.randomBytes(64).toString('hex'),
        csrfSecret: crypto.randomBytes(32).toString('hex')
    };
    fs.writeFileSync(SECRETS_PATH, JSON.stringify(secrets, null, 2));
    return secrets;
}

const secrets = loadOrCreateSecrets();
const JWT_SECRET = secrets.jwtSecret;

// --- Users file ---
const USERS_PATH = path.join(__dirname, 'data', 'users.json');
const CONTENT_PATH = path.join(__dirname, 'data', 'content.json');

function loadUsers() {
    if (!fs.existsSync(USERS_PATH)) {
        // Create default admin user: admin / MaisonYvoir2026!
        const hash = bcrypt.hashSync('MaisonYvoir2026!', 12);
        const users = [{ id: 1, username: 'admin', passwordHash: hash, role: 'admin' }];
        fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
        return users;
    }
    return JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function loadContent() {
    return JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf-8'));
}

function saveContent(content) {
    // Keep a backup before saving
    const backupDir = path.join(__dirname, 'data', 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(CONTENT_PATH, path.join(backupDir, `content-${timestamp}.json`));
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2));
}

// --- Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'"]
        }
    }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);

// --- Image upload config ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = crypto.randomBytes(16).toString('hex') + ext;
        cb(null, safeName);
    }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: function (req, file, cb) {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
            return cb(new Error('Type de fichier non autorisé. Utilisez JPEG, PNG, WebP ou AVIF.'));
        }
        cb(null, true);
    }
});

// --- Auth middleware ---
function authenticate(req, res, next) {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
        return res.status(401).json({ error: 'Non authentifié' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.status(401).json({ error: 'Session expirée' });
    }
}

// --- Static files ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', authenticate, express.static(path.join(__dirname, 'admin')));

// Serve admin login page (no auth needed)
app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// ==================
//  AUTH API
// ==================

app.post('/api/auth/login', authLimiter, (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username === username);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });

    res.json({ success: true, user: { username: user.username, role: user.role } });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

app.get('/api/auth/me', authenticate, (req, res) => {
    res.json({ user: { username: req.user.username, role: req.user.role } });
});

app.post('/api/auth/change-password', authenticate, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Les deux mots de passe sont requis' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' });
    }

    const users = loadUsers();
    const user = users.find(u => u.id === req.user.id);

    if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
        return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 12);
    saveUsers(users);

    res.json({ success: true, message: 'Mot de passe modifié avec succès' });
});

// ==================
//  CONTENT API
// ==================

// Public: get content (for the frontend)
app.get('/api/content', (req, res) => {
    try {
        const content = loadContent();
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors du chargement du contenu' });
    }
});

// Admin: update a content section
app.put('/api/content/:section', authenticate, (req, res) => {
    try {
        const content = loadContent();
        const { section } = req.params;

        if (!content.hasOwnProperty(section)) {
            return res.status(404).json({ error: 'Section non trouvée' });
        }

        content[section] = req.body;
        saveContent(content);

        res.json({ success: true, section, data: content[section] });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// Admin: update entire content
app.put('/api/content', authenticate, (req, res) => {
    try {
        saveContent(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
    }
});

// ==================
//  IMAGE API
// ==================

// Admin: upload image
app.post('/api/images/upload', authenticate, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    res.json({
        success: true,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size
    });
});

// Admin: list uploaded images
app.get('/api/images', authenticate, (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        return res.json({ images: [] });
    }
    const files = fs.readdirSync(uploadDir)
        .filter(f => /\.(jpg|jpeg|png|webp|avif)$/i.test(f))
        .map(f => {
            const stat = fs.statSync(path.join(uploadDir, f));
            return {
                filename: f,
                url: `/uploads/${f}`,
                size: stat.size,
                uploaded: stat.mtime
            };
        })
        .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded));

    res.json({ images: files });
});

// Admin: delete image
app.delete('/api/images/:filename', authenticate, (req, res) => {
    const { filename } = req.params;
    // Sanitize filename to prevent path traversal
    const safeName = path.basename(filename);
    const filePath = path.join(__dirname, 'uploads', safeName);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image non trouvée' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true });
});

// ==================
//  FRONTEND ROUTES
// ==================

// Admin dashboard (protected — static middleware above handles auth)
app.get('/admin', authenticate, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Catch-all: serve frontend
app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Error handler ---
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fichier trop volumineux (max 10 MB)' });
        }
        return res.status(400).json({ error: err.message });
    }
    if (err.message && err.message.includes('Type de fichier')) {
        return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur interne' });
});

// --- Start ---
app.listen(PORT, () => {
    console.log(`\n  🏡 Maison Yvoir — Serveur démarré`);
    console.log(`  ➜ Site:    http://localhost:${PORT}`);
    console.log(`  ➜ Admin:   http://localhost:${PORT}/admin/login`);
    console.log(`  ➜ API:     http://localhost:${PORT}/api/content`);
    console.log(`\n  Identifiants par défaut:`);
    console.log(`  ➜ Utilisateur: admin`);
    console.log(`  ➜ Mot de passe: MaisonYvoir2026!\n`);
});
