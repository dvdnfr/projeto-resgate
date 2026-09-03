require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const movementRoutes = require('./routes/movementRoutes');
const { ensureDatabaseSchema } = require('./database/migrate');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}`;
const frontendPath = path.join(__dirname);

app.use(express.json());
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'JSON invalido na requisicao.'
    });
  }

  return next(error);
});

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'projeto_resgate_dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 1000 * 60 * 60
    }
  })
);

function requirePageAuth(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect('/');
}

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/doacoes.html', requirePageAuth, (req, res) => {
  res.redirect('/produtos.html');
});

const protectedPages = [
  'dashboard.html',
  'produtos.html',
  'saida-produtos.html',
  'usuarios.html',
  'relatorios.html'
];

protectedPages.forEach((page) => {
  app.get(`/${page}`, requirePageAuth, (req, res) => {
    res.sendFile(path.join(frontendPath, page));
  });
});

app.use(authRoutes);
app.use(dashboardRoutes);
app.use(productRoutes);
app.use(movementRoutes);
app.use(userRoutes);
app.use(reportRoutes);
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

async function startServer() {
  try {
    await ensureDatabaseSchema();

    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Erro ao preparar banco de dados:', error);
    process.exit(1);
  }
}

startServer();
