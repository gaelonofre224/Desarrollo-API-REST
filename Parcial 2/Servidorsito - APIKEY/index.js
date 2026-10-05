const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');     
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Router = require('./routes/Router');
const apiKEY = require('@vpriem/express-api-key-auth');
require('dotenv').config();

console.log("API KEY", process.env.API_KEY);

const app = express();

//Multer
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

// Vista
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'Vistas'));

app.use(cors());          
app.use(morgan('dev'));   
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[LOG] Petición entrante: ${req.method} a ${req.url} - Fecha: ${new Date().toLocaleTimeString()}`);
  next(); 
});

// Ruta para recibir archivos
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

// Uso vista
app.get('/ruta', (req, res, next) => {
  let opciones = {
    titulo: "Monster Hunter",
    subtitulo: "Monstruopedia",
    subsubtitulo: "Hola3"
  }; 
  res.render('plantilla', opciones);
});

app.use('/monstruos', apiKEY.apiKeyAuth([process.env.API_KEY]), Router.router);

app.listen(8082, function(err) {
  if (err) console.log(err);
  console.log("Servidor escuchando en puerto 8082");
});