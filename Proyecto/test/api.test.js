const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../index');

test('GET /monstruos responde 200 y entrega arreglo JSON con monstruos', async () => {
  const res = await request(app)
    .get('/monstruos')
    .expect(200)
    .expect('Content-Type', /json/);

  assert.strictEqual(Array.isArray(res.body), true);
  assert.strictEqual(res.body.length > 0, true);
  assert.strictEqual(res.body[0].nombre, 'Rathalos');
});