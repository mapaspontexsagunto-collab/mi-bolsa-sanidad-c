(function (root) {
  'use strict';
  const norm = s => (s == null ? '' : String(s)).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

  const CATEGORIAS = [
    { key: 'TCAE', nombre: 'Técnico/a en Cuidados Auxiliares de Enfermería', re: /AUXILIARES DE ENFERMER/ },
    { key: 'TER', nombre: 'T.E. en Imagen para el Diagnóstico y Medicina Nuclear', re: /IMAGEN PARA EL DIAGN|MEDICINA NUCLEAR|RADIODIAGNOSTICO/ }
  ];
  const DEPARTAMENTOS = ['ALICANTE','ALCOY','ARNAU','CASTELLON','CLINICO','DENIA','ELDA','ELCHE','GANDIA','GENERAL','LA FE','MANISES','MARINA','ORIHUELA','PESET','LA PLANA','REQUENA','RIBERA','SAGUNTO',"SANT JOAN D'ALACANT",'TORREVIEJA','VINAROZ','XATIVA'];

  const COLS = [
    ['orden', /^(PUESTO|ORDEN|POSICION|N ?ORDEN)\b/],
    ['nombre', /^(NOMBRE|APELLIDOS|CANDIDATO)/],
    ['situacion', /^(SITUACION|ESTADO)/],
    ['categoria', /^CATEGORIA/],
    ['departamento', /^(DEPARTAMENTO|DPTO)/],
    ['fecha', /^FECHA/],
    ['puntos', /(PUNTUACION|PUNTOS|BAREMO|TOTAL)/]
  ];

  function mapHeaders(headers) {
    const used = new Set();
    return headers.map(h => {
      const n = norm(h);
      for (const [k, re] of COLS) if (!used.has(k) && re.test(n)) { used.add(k); return k; }
      return null;
    });
  }

  function cleanCell(header, cell) {
    let c = String(cell == null ? '' : cell).replace(/\s+/g, ' ').trim();
    const h = norm(header);
    if (h && norm(c).startsWith(h) && norm(c).length > h.length) {
      c = c.slice(header.trim().length).replace(/^\s*:?\s*/, '');
    }
    return c;
  }

  function num(v) {
    if (v == null || v === '') return null;
    const n = parseFloat(String(v).replace(/\./g, m => m).replace(',', '.').replace(/[^\d.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  function detectCategoria(text) {
    const n = norm(text);
    const c = CATEGORIAS.find(c => c.re.test(n));
    return c ? c.key : null;
  }
  function detectDepartamento(texts) {
    const found = [];
    for (const t of texts) {
      const n = norm(t).replace(/^DEPARTAMENTO\s*:?\s*/, '');
      if (DEPARTAMENTOS.includes(n)) found.push(n);
    }
    return found[0] || null;
  }
  function detectTurno(texts) {
    for (const t of texts) {
      const n = norm(t);
      if (/PROMOCION INTERNA/.test(n)) return 'M';
      if (/\bORDINARIO\b/.test(n)) return 'O';
    }
    return null;
  }
  function detectFecha(texts) {
    for (const t of texts) {
      const m = /(\d{2})\/(\d{2})\/(20\d{2})/.exec(t);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    }
    return null;
  }

  function toIso(v) {
    const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(v || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : (/^\d{4}-\d{2}-\d{2}/.test(v || '') ? v.slice(0, 10) : null);
  }

  function parseCapture(p) {
    if (!p || p.v !== 1 || !Array.isArray(p.rows) || !Array.isArray(p.headers)) throw new Error('Formato de captura no válido');
    const map = mapHeaders(p.headers);
    const rows = [];
    for (const r of p.rows) {
      const o = { extra: {} };
      p.headers.forEach((h, i) => {
        const v = cleanCell(h, r[i]);
        if (map[i]) o[map[i]] = v; else if (h) o.extra[h] = v;
      });
      o.orden = num(o.orden);
      o.puntos = num(o.puntos);
      if (o.fecha !== undefined) o.fecha = toIso(o.fecha);
      if (!o.nombre) continue;
      rows.push(o);
    }
    const ctx = (p.ctx || []).map(String);
    const all = ctx.concat(rows.slice(0, 3).flatMap(r => [r.categoria, r.departamento].filter(Boolean)));
    return {
      rows,
      columnas: p.headers.map((h, i) => ({ cabecera: h, campo: map[i] })),
      categoria: detectCategoria(all.join(' | ')),
      departamento: detectDepartamento(ctx.concat(rows.slice(0, 1).map(r => r.departamento).filter(Boolean))),
      turno: detectTurno(ctx),
      fecha: detectFecha(ctx)
    };
  }

  function mergeRows(a, b) {
    const m = new Map();
    for (const r of a.concat(b)) m.set(r.orden != null ? 'o' + r.orden : 'n' + norm(r.nombre), r);
    return [...m.values()].sort((x, y) => (x.orden ?? 1e9) - (y.orden ?? 1e9));
  }

  function groupKey(cat, dep, turno) { return [cat, norm(dep), turno || 'O'].join('|'); }

  function matchPerson(rows, apellidos, nombre) {
    const A = norm(apellidos), N = norm(nombre);
    return rows.filter(r => {
      const n = norm(r.nombre);
      return n.startsWith(A + ' ') && (!N || n.endsWith(' ' + N) || n === A + ' ' + N);
    });
  }

  function situacionResumen(rows) {
    const c = {};
    for (const r of rows) { const s = norm(r.situacion) || 'SIN DATO'; c[s] = (c[s] || 0) + 1; }
    return c;
  }

  function percentil(rows, puntos) {
    const v = rows.map(r => r.puntos).filter(x => x != null);
    if (!v.length || puntos == null) return null;
    const menores = v.filter(x => x < puntos).length;
    const s = v.slice().sort((a, b) => a - b);
    return { percentil: Math.round(100 * menores / v.length), n: v.length, min: s[0], max: s[s.length - 1], mediana: s[Math.floor(s.length / 2)] };
  }

  function distribucion(rows, tramos = 5) {
    const v = rows.map(r => r.puntos).filter(x => x != null);
    if (!v.length) return [];
    const min = Math.min(...v), max = Math.max(...v), w = (max - min) / tramos || 1;
    const out = Array.from({ length: tramos }, (_, i) => ({ desde: min + i * w, hasta: min + (i + 1) * w, n: 0 }));
    for (const x of v) out[Math.min(tramos - 1, Math.floor((x - min) / w))].n++;
    return out;
  }

  // Compara dos instantáneas: solo recuentos, nunca nombres.
  function compararQuincenas(prev, curr) {
    const p = new Map(prev.map(r => [norm(r.nombre), norm(r.situacion)]));
    const trans = {};
    let empezaron = 0, terminaron = 0;
    for (const r of curr) {
      const antes = p.get(norm(r.nombre)); const ahora = norm(r.situacion);
      if (antes === undefined || antes === ahora) continue;
      const k = `${antes || 'SIN DATO'} → ${ahora || 'SIN DATO'}`;
      trans[k] = (trans[k] || 0) + 1;
      if (/^ACTIVO/.test(ahora) && !/^ACTIVO/.test(antes)) empezaron++;
      if (/^ACTIVO/.test(antes) && !/^ACTIVO/.test(ahora)) terminaron++;
    }
    return { empezaron, terminaron, transiciones: Object.entries(trans).sort((a, b) => b[1] - a[1]) };
  }

  // Predictor: ciclos mensuales de nombramientos de una bolsa (solo órdenes y recuentos).
  function predictor(contratos, cat, dep, miOrden) {
    const d = norm(dep), seen = new Set(), meses = new Map();
    for (const r of contratos) {
      const k = [norm(r.nombre), r.fecha, r.orden].join('|'); if (seen.has(k)) continue; seen.add(k);
      if (r.categoria && detectCategoria(r.categoria) !== cat) continue;
      if (r.departamento) { const rd = norm(r.departamento); if (rd !== d && !rd.includes(d) && !d.includes(rd)) continue; }
      if (!r.fecha) continue;
      const m = r.fecha.slice(0, 7);
      if (!meses.has(m)) meses.set(m, { mes: m, n: 0, hasta: null });
      const c = meses.get(m); c.n++;
      if (r.orden != null && (c.hasta == null || r.orden > c.hasta)) c.hasta = r.orden;
    }
    const ciclos = [...meses.values()].sort((a, b) => b.mes.localeCompare(a.mes));
    const hs = ciclos.map(c => c.hasta).filter(x => x != null);
    if (!hs.length) return { ciclos, media: null, max: null, ultimo: null, veredicto: null };
    const media = Math.round(hs.reduce((a, b) => a + b, 0) / hs.length), max = Math.max(...hs), ultimo = ciclos.find(c => c.hasta != null).hasta;
    let veredicto = null;
    if (miOrden != null) veredicto = miOrden <= ultimo ? 'Probable' : miOrden <= max ? 'Posible' : 'Improbable';
    return { ciclos, media, max, ultimo, veredicto };
  }

  const api = { predictor, detectCategoria, toIso, norm, CATEGORIAS, DEPARTAMENTOS, parseCapture, mergeRows, groupKey, matchPerson, situacionResumen, percentil, distribucion, compararQuincenas, num };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BolsaLib = api;
})(typeof self !== 'undefined' ? self : this);
