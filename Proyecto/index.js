const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const https = require('https');
const swaggerUI = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const rutasMonstruos = require('./src/routes/Router');

const app = express();
const PORT = 8082;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Monster Hunter Guild API',
      version: '1.0.0',
      description: 'API del gremio para clasificacion de monstruos'
    },
    servers: [{ url: `https://localhost:${PORT}` }]
  },
  apis: [path.join(__dirname, 'src/routes/*.js')]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.get('/api-spec', (req, res) => res.json(swaggerDocs));

// Rutas
app.use('/monstruos', rutasMonstruos);

// Levantar HTTPS
if (fs.existsSync(path.join(__dirname, 'key.pem')) && fs.existsSync(path.join(__dirname, 'cert.pem'))) {
  const opcionesHttps = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
  };
  https.createServer(opcionesHttps, app).listen(PORT, () => {
    console.log(`Servidor activo en: https://localhost:${PORT}`);
    console.log(`Documentacion Swagger: https://localhost:${PORT}/api-docs`);
  });
} else {
  app.listen(PORT, () => console.log(`Servidor HTTP activo en puerto ${PORT}`));
}

module.exports = app;