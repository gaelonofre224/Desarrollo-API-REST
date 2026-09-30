const express = require('express');
const halson = require('halson'); // Importar halson para la tarea de HATEOAS
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const respuesta = await fetch('https://mhw-db.com/monsters');
    const monstruos = await respuesta.json();

    const { especie } = req.query;

    if (especie) {
      const filtrados = monstruos.filter(
        m => m.species && m.species.toLowerCase().includes(especie.toLowerCase())
      );
      return res.json(filtrados);
    }

    res.json(monstruos);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const respuesta = await fetch(`https://mhw-db.com/monsters/${id}`);

    if (!respuesta.ok) {
      return res.status(404).json({ mensaje: 'Monstruo no encontrado' });
    }

    const monstruo = await respuesta.json();
    
    // --- TAREA: RESPUESTA HATEOAS ---
    const recursoHateoas = halson(monstruo)
      .addLink('self', `/monstruos/${id}`)                               
      .addLink('actualizar', { href: `/monstruos/${id}`, method: 'PUT' }) 
      .addLink('coleccion', `/monstruos`);                               

    res.json(recursoHateoas);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  res.json({ mensaje: 'Monstruo registrado con éxito en tu servidor local' });
});

router.put('/:id', (req, res, next) => {
  res.json({ mensaje: `Monstruo con ID ${req.params.id} actualizado` });
});

module.exports.router = router;