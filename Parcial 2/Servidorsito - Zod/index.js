const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');     
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Router = require('./routes/Router');
const https = require('https');
const { z } = require('zod'); //zod

require('dotenv').config();

// --- API KEY ---
// const apiKEY = require('@vpriem/express-api-key-auth');
// console.log("API KEY cargada desde .env:", process.env.API_KEY);

// --- JWT ---
// const jwt = require('jsonwebtoken'); 

// app.post('/login', (req, res) => {
//   const { usuario, password } = req.body;
//   if (usuario === 'admin' && password === '1234') {
//     const payload = { nombre: 'Gael Onofre García', rol: 'administrador' };
//     const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto-super-seguro', { expiresIn: '1h' });
//     return res.json({ mensaje: 'Autenticación exitosa', token: token });
//   }
//   return res.status(401).json({ error: 'Credenciales incorrectas' });
// });

// const verificarJWT = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Acceso denegado. Se requiere un token Bearer.' });
//   }
//   const token = authHeader.split(' ')[1];
//   try {
//     const decodificado = jwt.verify(token, process.env.JWT_SECRET || 'secreto-super-seguro');
//     req.usuario = decodificado; 
//     next(); 
//   } catch (error) {
//     return res.status(403).json({ error: 'Token inválido o expirado.' });
//   }
// };

// Configuración HTTPS
const opcionesHttps = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),  
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')) 
};

const app = express();

// zod
const esquemaMonstruo = z.object({
  nombre: z.string({
    required_error: "El nombre es obligatorio",
    invalid_type_error: "El nombre debe ser una cadena de texto"
  }).min(3, "El nombre es demasiado corto! debe tener al menos 3 caracteres"),

  especie: z.string({
    required_error: "La especie es obligatoria"
  }),

  nivelPeligro: z.number({
    invalid_type_error: "El nivel de peligro debe ser un número entero"
  }).int().min(1, "El peligro mínimo es 1").max(10, "El peligro máximo es 10").optional(),

  elementos: z.array(z.string(), {
    invalid_type_error: "Los elementos deben ser un arreglo de textos"
  }).optional()
});

// Middleware
const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    const errores = resultado.error.issues.map(err => ({
      campo: err.path.join('.'),
      mensaje: err.message
    }));
    return res.status(400).json({ error: 'Validación fallida con Zod', errores });
  }

  req.body = resultado.data;
  next();
};

// Multer
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

// Vista Pug
app.get('/ruta', (req, res, next) => {
  let opciones = {
    titulo: "Monster Hunter",
    subtitulo: "Monstruopedia",
    subsubtitulo: "Hola3"
  }; 
  res.render('plantilla', opciones);
});

// zod
app.post('/monstruos', validar(esquemaMonstruo), (req, res) => {
  res.status(201).json({
    mensaje: '¡Monstruo validado y registrado exitosamente con Zod!',
    datos: req.body
  });
});

app.use('/monstruos', Router.router);

// app.use('/monstruos', apiKEY.apiKeyAuth([process.env.API_KEY]), Router.router);
// app.use('/monstruos', verificarJWT, Router.router);

// Servidor HTTPS
https.createServer(opcionesHttps, app).listen(8082, () => {
  console.log("Servidor seguro HTTPS escuchando en: https://localhost:8082");
});

// app.listen(8082, function(err) {
//   if (err) console.log(err);
//   console.log("Servidor escuchando en puerto 8082");
// });