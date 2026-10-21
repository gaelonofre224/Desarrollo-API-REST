const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = 8082;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const queryGraphQL = `
{
  Page {
    media {
      siteUrl
      title {
        english
        native
      }
      description
    }
  }
}
`;

app.get('/anilist', async (req, res) => {
  try {
    // API ANILIST
    const respuesta = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: queryGraphQL
      })
    });

    const datos = await respuesta.json();


    if (datos.errors) {
      return res.status(400).json({
        mensaje: 'Error en la consulta GraphQL',
        errores: datos.errors
      });
    }

    res.json({
      mensaje: 'Consulta GraphQL a AniList realizada con éxito',
      totalAnimes: datos.data.Page.media.length,
      resultado: datos.data.Page.media
    });

  } catch (error) {
    console.error('Error al consultar AniList:', error);
    res.status(500).json({ 
      error: 'Hubo un problema al procesar la petición',
      detalle: error.message 
    });
  }
});


app.get('/', (req, res) => {
  res.send('Servidor Express listo para consultas GraphQL. Visita /anilist para probar.');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`Ruta GraphQL lista en: http://localhost:${PORT}/anilist`);
});