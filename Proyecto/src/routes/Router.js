const express = require('express');
const router = express.Router();
let monstruos = require('../../Data/monstruos');

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
 *         nombre:
 *           type: string
 *           example: "Rathalos"
 *         especie:
 *           type: string
 *           example: "Wyvern Volador"
 *         peligro:
 *           type: integer
 *           example: 8
 *         elementos:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Fuego"]
 *         descripcion:
 *           type: string
 *           example: "El Rey de los Cielos."
 */

/**
 * @swagger
 * /monstruos:
 *   get:
 *     summary: Obtener catalogo de monstruos
 *     tags: [Monstruos]
 *     parameters:
 *       - in: query
 *         name: especie
 *         schema:
 *           type: string
 *         description: Filtrar por especie
 *     responses:
 *       200:
 *         description: Lista de monstruos devuelta con exito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Monstruo'
 */
router.get('/', (req, res) => {
  const { especie } = req.query;
  if (especie) {
    const filtrados = monstruos.filter(m => m.especie.toLowerCase().includes(especie.toLowerCase()));
    return res.json(filtrados);
  }
  res.json(monstruos);
});

/**
 * @swagger
 * /monstruos/{id}:
 *   get:
 *     summary: Obtener monstruo por ID
 *     tags: [Monstruos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Monstruo encontrado
 *       404:
 *         description: Monstruo no encontrado
 */
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const monstruo = monstruos.find(m => m.id === id);
  if (!monstruo) return res.status(404).json({ error: "Monstruo no encontrado" });
  res.json(monstruo);
});

module.exports = router;