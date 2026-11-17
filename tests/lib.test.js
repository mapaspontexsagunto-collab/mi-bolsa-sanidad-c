const assert = require('assert'), L = require('../lib.js');
// formato basado en la página pública histórica (celdas con prefijo "Puesto:1")
const cap = { v: 1, headers: ['Puesto', 'Nombre', 'Situación', 'Categoría', 'Departamento'],
  rows: [['Puesto:1', 'Nombre:PEREZ LOPEZ ANA', 'Situación:ACTIVO', 'Categoría:TÉCNICO/A EN CUIDADOS AUXILIARES DE ENFERMERÍA', 'Departamento:LA FE'],
         ['Puesto:2', 'Nombre:GARCIA RUIZ SARA', 'Situación:DISPONIBLE', 'Categoría:', 'Departamento:']],
  ctx: ['Turno: Ordinario', 'GENERAL', 'Publicación (01/11/2026)'] };
const r = L.parseCapture(cap);
assert.equal(r.rows.length, 2); assert.equal(r.rows[1].orden, 2); assert.equal(r.rows[1].nombre, 'GARCIA RUIZ SARA');
assert.equal(r.categoria, 'TCAE'); assert.equal(r.departamento, 'GENERAL'); assert.equal(r.turno, 'O'); assert.equal(r.fecha, '2026-11-01');
assert.equal(L.matchPerson(r.rows, 'garcía ruiz', 'Sara').length, 1);
const prev = [{ nombre: 'A B', situacion: 'DISPONIBLE' }, { nombre: 'C D', situacion: 'ACTIVO' }];
const cur = [{ nombre: 'A B', situacion: 'ACTIVO' }, { nombre: 'C D', situacion: 'DISPONIBLE' }];
const c = L.compararQuincenas(prev, cur); assert.equal(c.empezaron, 1); assert.equal(c.terminaron, 1);
const rows = [1, 2, 3, 4].map(p => ({ nombre: 'N' + p, puntos: p }));
assert.equal(L.percentil(rows, 3).percentil, 50);
assert.equal(L.mergeRows([{ orden: 1, nombre: 'X' }], [{ orden: 1, nombre: 'X' }, { orden: 2, nombre: 'Y' }]).length, 2);
const cn = L.parseCapture({ v: 1, headers: ['Fecha', 'Nombre', 'Orden', 'Departamento', 'Categoría'], rows: [
  ['30/10/2026', 'A A', '3789', 'SAGUNTO', 'TÉCNICO/A EN CUIDADOS AUXILIARES DE ENFERMERÍA'],
  ['29/10/2026', 'B B', '3700', 'SAGUNTO', 'TÉCNICO/A EN CUIDADOS AUXILIARES DE ENFERMERÍA'],
  ['15/09/2026', 'C C', '2500', 'SAGUNTO', 'TÉCNICO/A EN CUIDADOS AUXILIARES DE ENFERMERÍA'],
  ['15/09/2026', 'D D', '100', 'LA FE', 'TÉCNICO/A EN CUIDADOS AUXILIARES DE ENFERMERÍA']], ctx: [] });
assert.equal(cn.rows[0].fecha, '2026-10-30');
const pr = L.predictor(cn.rows, 'TCAE', 'SAGUNTO', 983);
assert.equal(pr.ciclos.length, 2); assert.equal(pr.ultimo, 3789); assert.equal(pr.veredicto, 'Probable');
assert.equal(L.predictor(cn.rows, 'TCAE', 'SAGUNTO', 9999).veredicto, 'Improbable');
console.log('tests ok');
