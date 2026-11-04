const express = require('express');
const halson = require('halson');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Monstruo:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Rathalos"
 *         species:
 *           type: string
 *           example: "flying wyvern"
 *         description:
 *           type: string
 *           example: "Apex monster of the Ancient Forest. Territorial predator that descends upon invaders from the sky."
 *         elements:
 *           type: array
 *           items:
 *             type: string
 *           example: ["fire"]
 */

/**
 * @swagger
 * /monstruos:
 *   get:
 *     summary: Obtener lista de monstruos
 *     description: Retorna la lista completa de monstruos disponibles en la API o filtrados por especie
 *     tags:
 *       - Monstruos
 *     parameters:
 *       - in: string
 *         name: especie
 *         schema:
 *         description: Filtra los monstruos por el nombre de su especie
 *     responses:
 *       200:
 *         description: Lista de monstruos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Monstruo'
 *       500:
 *         description: Error interno del servidor al consultar la fuente de datos
 */
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
    
    // HATEOAS
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