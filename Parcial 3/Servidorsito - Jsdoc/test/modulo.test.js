import assert from 'node:assert';
import test from 'node:test';
import * as hunter from '../src/modulo.js';

test('ataque 100 y armadura 30 el danio debe ser 70', () => {
  let resultado = hunter.calcularDanio(100, 30);
  assert.strictEqual(resultado, 70);
});

test('ataque 50 y armadura 0 el danio debe ser 50', () => {
  let resultado = hunter.calcularDanio(50, 0);
  assert.strictEqual(resultado, 50);
});

test('ataque y armadura iguales el danio debe ser 0', () => {
  let resultado = hunter.calcularDanio(40, 40);
  assert.strictEqual(resultado, 0);
});