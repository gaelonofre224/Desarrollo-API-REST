const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');     
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Router = require('./routes/Router');

//JWT
const jwt = require('jsonwebtoken'); 
require('dotenv').config();

// APPIKEY
// const apiKEY = require('@vpriem/express-api-key-auth');
// console.log("API KEY cargada desde .env:", process.env.API_KEY);

const app = express();

// JWT
app.post('/login', (req, res) => {
  const { usuario, password } = req.body;
  
  if (usuario === 'admin' && password === '1234') {
    const payload = { nombre: 'Gael Onofre García', rol: 'administrador' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto-super-seguro', { expiresIn: '1h' });
    
    return res.json({ mensaje: 'Autenticación exitosa', token: token });
  }
  return res.status(401).json({ error: 'Credenciales incorrectas' });
});


// Middleware JWT
const verificarJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Se requiere un token Bearer.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto-super-seguro');
    req.usuario = decodificado; 
    next(); 
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'Vistas'));

app.use(cors());          
app.use(morgan('dev'));   
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[LOG] Petición entrante: ${req.method} a ${req.url} - Fecha: ${new Date().toLocaleTimeString()}`);
  next(); 
});

app.post('/subir-archivo', upload.single('archivo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }

  res.json({
    mensaje: 'Archivo recibido con éxito',
    archivo: {
      nombreOriginal: req.file.originalname,
      nombreGuardado: req.file.filename,
      tamanoBytes: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

app.get('/ruta', (req, res, next) => {
  let opciones = {
    titulo: "Monster Hunter",
    subtitulo: "Monstruopedia",
    subsubtitulo: "Hola3"
  }; 
  res.render('plantilla', opciones);
});

// app.use('/monstruos', apiKEY.apiKeyAuth([process.env.API_KEY]), Router.router);

// JWT
app.use('/monstruos', verificarJWT, Router.router);

app.listen(8082, function(err) {
  if (err) console.log(err);
  console.log("Servidor escuchando en puerto 8082");
});