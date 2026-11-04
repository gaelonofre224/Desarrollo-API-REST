const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');     
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Router = require('./routes/Router');
const https = require('https');

// modulos swagger 1
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

require('dotenv').config();

// --- API KEY ---
// const apiKEY = require('@vpriem/express-api-key-auth');
// console.log("API KEY cargada desde .env:", process.env.API_KEY);

// --- JWT ---
// const jwt = require('jsonwebtoken'); 
// app.post('/login', (req, res) => { ... });
// const verificarJWT = (req, res, next) => { ... };

// --- VALIDACIÓN CON ZOD ---
// const { z } = require('zod');
// const esquemaMonstruo = z.object({ ... });
// const validar = (schema) => (req, res, next) => { ... };
// app.post('/monstruos', validar(esquemaMonstruo), (req, res) => { ... });

// Configuración HTTPS
const opcionesHttps = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),  
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')) 
};

const app = express();

//swagger 2
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Servidorsito - Monstruopedia',
      description: 'Documentación Swagger',
      contact: {
        name: 'Gael Onofre García'
      }
    },
    servers: [
      {
        url: 'https://localhost:8082',
      }
    ]
  },
  apis: [
    path.join(__dirname, 'index.js'),
    path.join(__dirname, './routes/Router.js')
  ]
};

// swagger
const swaggerDocs = swaggerJsDoc(swaggerOptions);

//middleware
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs)); //3

app.get('/api-spec', (req, res) => {
  res.json(swaggerDocs);
});

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Vistas
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

app.get('/ruta', (req, res) => {
  let opciones = {
    titulo: "Monster Hunter",
    subtitulo: "Monstruopedia",
    subsubtitulo: "Hola3"
  }; 
  res.render('plantilla', opciones);
});

// Rutas base
app.use('/monstruos', Router.router);

// Servidor HTTPS
https.createServer(opcionesHttps, app).listen(8082, () => {
  console.log(" https://localhost:8082");
  console.log(" https://localhost:8082/api-docs");
});