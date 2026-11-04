/**
 * @file utilidades.js - Módulo de funciones auxiliares y utilidades generales.
 * @author Gael Onofre García
 * @version 1.0.0
 */

/**
 * Calcula el daño total estimado de un ataque considerando la defensa del objetivo.
 *
 * @param {number} ataqueBase - Valor de poder de ataque base del cazador o arma.
 * @param {number} defensaObjetivo - Valor de armadura o resistencia del monstruo.
 * @param {number} [multiplicadorCritico=1.25] - Multiplicador de impacto crítico opcional.
 * @returns {number} Daño total infligido redondeado al entero más cercano.
 * 
 * @example
 * const danio = calcularDanio(120, 40, 1.5);
 * console.log(danio); // 120
 */
function calcularDanio(ataqueBase, defensaObjetivo, multiplicadorCritico = 1.25) {
  const reduccion = defensaObjetivo / (defensaObjetivo + 100);
  const danioFinal = (ataqueBase * (1 - reduccion)) * multiplicadorCritico;
  return Math.round(danioFinal);
}

/**
 * Filtra y devuelve los monstruos que coincidan con un elemento específico.
 *
 * @param {Array<Object>} listaMonstruos - Lista de objetos de monstruos a evaluar.
 * @param {string} elementoBuscado - Elemento elemental a filtrar (ej. 'fuego', 'agua').
 * @returns {Array<Object>} Arreglo con los monstruos que contienen dicho elemento.
 * 
 * @example
 * const filtrados = filtrarPorElemento([{ nombre: 'Rathalos', elemento: 'fuego' }], 'fuego');
 */
function filtrarPorElemento(listaMonstruos, elementoBuscado) {
  if (!Array.isArray(listaMonstruos) || !elementoBuscado) {
    return [];
  }
  return listaMonstruos.filter(monstruo => 
    monstruo.elemento && monstruo.elemento.toLowerCase() === elementoBuscado.toLowerCase()
  );
}

/**
 * Determina si el nivel de peligro de un objetivo requiere advertencia especial.
 *
 * @param {number} nivelPeligro - Nivel numérico del 1 al 10.
 * @returns {boolean} `true` si el peligro es 7 o superior, `false` en caso contrario.
 */
function esMonstruoPeligroso(nivelPeligro) {
  return nivelPeligro >= 7;
}

// Exportamos las funciones del módulo
module.exports = {
  calcularDanio,
  filtrarPorElemento,
  esMonstruoPeligroso
};