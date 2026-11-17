(function () {
  'use strict';
  const L = self.BolsaLib, $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- almacenamiento local (IndexedDB) ----------
  const dbp = new Promise((res, rej) => {
    const r = indexedDB.open('bolsa', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('snaps', { keyPath: 'id' }); r.result.createObjectStore('meta'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const tx = async (store, mode, fn) => { const db = await dbp; return new Promise((res, rej) => { const t = db.transaction(store, mode); const out = fn(t.objectStore(store)); t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined); t.onerror = () => rej(t.error); }); };
  const allSnaps = () => tx('snaps', 'readonly', s => s.getAll());
  const putSnap = x => tx('snaps', 'readwrite', s => s.put(x));
  const getMeta = k => tx('meta', 'readonly', s => s.get(k));
  const setMeta = (k, v) => tx('meta', 'readwrite', s => s.put(v, k));

  // ---------- navegación ----------
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => show(b.dataset.v));
  function show(v) {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    for (const s of ['bolsas', 'importar', 'ajustes']) $('v-' + s).hidden = s !== v;
    if (v === 'bolsas') render();
  }

  // ---------- importar ----------
  let pendiente = null;
  $('selCat').innerHTML = L.CATEGORIAS.map(c => `<option value="${c.key}">${esc(c.nombre)}</option>`).join('');
  $('deps').innerHTML = L.DEPARTAMENTOS.map(d => `<option value="${esc(d)}">`).join('');
  $('btnLeer').onclick = () => {
    const m = $('impMsg'); m.textContent = '';
    try {
      const r = L.parseCapture(JSON.parse($('pegado').value.trim()));
      if (!r.rows.length) throw new Error('La captura no contiene filas.');
      pendiente = r;
      $('selCat').value = r.categoria || L.CATEGORIAS[0].key;
      $('selDep').value = r.departamento || '';
      $('selTurno').value = r.turno || 'O';
      $('selFecha').value = r.fecha || new Date().toISOString().slice(0, 10);
      $('prevInfo').textContent = `${r.rows.length} filas leídas. Revisa categoría, departamento, turno y fecha antes de guardar.` +
        (r.categoria && r.departamento ? '' : ' (No he podido deducir todo automáticamente.)');
      $('cols').innerHTML = r.columnas.map(c => `${esc(c.cabecera)} → <b>${esc(c.campo || 'sin usar')}</b>`).join('<br>');
      $('prev').hidden = false;
    } catch (e) { $('prev').hidden = true; m.textContent = 'No se pudo leer: ' + e.message; }
  };
  $('btnGuardar').onclick = async () => {
    const tipo = $('selTipo').value;
    if (tipo === 'contratos') {
      const fecha = $('selFecha').value, cat = $('selCat').value, id = 'C|' + cat + '|' + fecha;
      const prev = (await allSnaps()).find(s => s.id === id);
      const seen = new Set(), rows = [];
      for (const r of (prev ? prev.rows : []).concat(pendiente.rows)) { const k = [L.norm(r.nombre), r.fecha, r.orden].join('|'); if (!seen.has(k)) { seen.add(k); rows.push(r); } }
      await putSnap({ id, kind: 'contratos', cat, fecha, rows });
      $('impMsg').textContent = `Guardados ${rows.length} nombramientos.`; $('prev').hidden = true; $('pegado').value = ''; pendiente = null; return;
    }
    const dep = $('selDep').value.trim(); if (!dep) { $('impMsg').textContent = 'Indica el departamento.'; return; }
    const cat = $('selCat').value, turno = $('selTurno').value, fecha = $('selFecha').value;
    const key = L.groupKey(cat, dep, turno), id = key + '|' + fecha;
    const prev = (await allSnaps()).find(s => s.id === id);
    const rows = L.mergeRows(prev ? prev.rows : [], pendiente.rows);
    await putSnap({ id, key, cat, dep: L.norm(dep), turno, fecha, rows });
    $('impMsg').textContent = `Guardado: ${rows.length} filas en ${L.norm(dep)} (${fecha}).`;
    $('prev').hidden = true; $('pegado').value = ''; pendiente = null;
  };

  // ---------- ajustes ----------
  getMeta('perfil').then(p => { if (p) { $('apellidos').value = p.apellidos; $('nombre').value = p.nombre; } });
  $('btnPerfil').onclick = async () => { await setMeta('perfil', { apellidos: $('apellidos').value.trim(), nombre: $('nombre').value.trim() }); $('ajMsg').textContent = 'Guardado.'; };
  $('btnExp').onclick = async () => {
    const data = { v: 1, perfil: await getMeta('perfil'), snaps: await allSnaps() };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
    a.download = 'mi-bolsa-copia.json'; a.click();
  };
  $('btnImp').onclick = () => $('fileImp').click();
  $('fileImp').onchange = async e => {
    try { const d = JSON.parse(await e.target.files[0].text()); if (d.perfil) await setMeta('perfil', d.perfil); for (const s of d.snaps || []) await putSnap(s); $('ajMsg').textContent = 'Copia importada.'; }
    catch (err) { $('ajMsg').textContent = 'Archivo no válido.'; }
  };
  $('btnBorrar').onclick = async () => { if (!confirm('¿Borrar todos los datos de este dispositivo?')) return; const db = await dbp; db.close(); indexedDB.deleteDatabase('bolsa').onsuccess = () => location.reload(); };

  // ---------- panel ----------
  const nomCat = k => (L.CATEGORIAS.find(c => c.key === k) || {}).nombre || k;
  function groups(snaps) {
    const g = new Map();
    for (const s of snaps) { if (!g.has(s.key)) g.set(s.key, []); g.get(s.key).push(s); }
    for (const v of g.values()) v.sort((a, b) => a.fecha.localeCompare(b.fecha));
    return g;
  }
  async function render() {
    const todas = await allSnaps(), snaps = todas.filter(s => s.kind !== 'contratos'), perfil = await getMeta('perfil');
    const av = $('aviso'), cont = $('lista'); $('detalle').innerHTML = ''; cont.innerHTML = '';
    if (!perfil || !perfil.apellidos) { av.hidden = false; av.textContent = 'Indica en Ajustes los apellidos y nombre a seguir.'; return; }
    if (!snaps.length) { av.hidden = false; av.textContent = 'Aún no hay datos. Ve a Importar para cargar un listado oficial.'; return; }
    av.hidden = true;
    for (const [key, list] of groups(snaps)) {
      const last = list[list.length - 1], me = L.matchPerson(last.rows, perfil.apellidos, perfil.nombre);
      const el = document.createElement('div'); el.className = 'card bolsa';
      const n = last.rows.length;
      let body;
      if (me.length === 1) body = `<span class="pill">${esc(me[0].situacion || 'Sin dato')}</span><div class="row"><div><div class="big">#${esc(me[0].orden ?? '—')}</div><div class="muted">de ${n}</div></div><div class="muted">Actualizado: ${esc(last.fecha)}</div></div><div class="bar"><i style="width:${me[0].orden ? Math.min(100, 100 * me[0].orden / n) : 0}%"></i></div>`;
      else if (me.length > 1) body = `<div class="alert">${me.length} coincidencias con ese nombre. Completa el nombre en Ajustes.</div>`;
      else body = `<div class="muted">No aparece en el listado cargado (${esc(last.fecha)}). Eso no implica que no esté inscrita.</div>`;
      el.innerHTML = `<div class="cat">${esc(nomCat(last.cat))}</div><div class="dep">${esc(last.dep)} ${last.turno === 'M' ? '· Promoción interna' : ''}</div>${body}`;
      el.onclick = () => detalle(list, me[0], todas.filter(s => s.kind === 'contratos' && s.cat === last.cat).flatMap(s => s.rows));
      cont.appendChild(el);
    }
  }
  function detalle(list, me, contratos) {
    const last = list[list.length - 1], d = $('detalle');
    let h = `<div class="card"><h2>${esc(last.dep)} · ${esc(nomCat(last.cat))}</h2>`;
    if (me) {
      const p = L.percentil(last.rows, me.puntos);
      if (p) {
        h += `<p class="big">${me.puntos} puntos <span class="pill">P${p.percentil}</span></p><p class="muted">Mín ${p.min} · Mediana ${p.mediana} · Máx ${p.max} · ${p.n} candidatos con puntuación</p>`;
        const dist = L.distribucion(last.rows), mx = Math.max(...dist.map(x => x.n));
        h += dist.map(x => `<div class="hist ${me.puntos >= x.desde && me.puntos <= x.hasta ? 'me' : ''}"><span>${x.desde.toFixed(1)}–${x.hasta.toFixed(1)}</span><div class="bar"><i style="width:${100 * x.n / mx}%"></i></div><span>${x.n}</span></div>`).join('');
      } else h += '<p class="muted">El listado capturado no incluye una columna de puntos reconocible.</p>';
    }
    h += '<h2 style="margin-top:16px">Entre quincenas</h2>';
    if (list.length < 2) h += '<p class="muted">Necesitas al menos dos instantáneas (por ejemplo del día 1 y del 15) para comparar.</p>';
    else {
      const prev = list[list.length - 2], c = L.compararQuincenas(prev.rows, last.rows);
      h += `<p class="muted">${esc(prev.fecha)} → ${esc(last.fecha)}. Solo recuentos.</p><div class="row"><div><div class="big">${c.empezaron}</div><div class="muted">pasaron a ACTIVO</div></div><div><div class="big">${c.terminaron}</div><div class="muted">dejaron ACTIVO</div></div></div>` +
        c.transiciones.slice(0, 10).map(([k, v]) => `<div class="row"><span>${esc(k)}</span><b>${v}</b></div>`).join('');
    }
    h += '<h2 style="margin-top:16px">Predictor de llamada</h2>';
    const pr = L.predictor(contratos || [], last.cat, last.dep, me && me.orden);
    if (!contratos || !contratos.length) h += '<p class="muted">Importa la lista de nombramientos (Importar → tipo «Nombramientos recientes») para activarlo.</p>';
    else if (!pr.ciclos.length || pr.media == null) h += '<p class="muted">No hay nombramientos de este departamento con número de orden reconocible.</p>';
    else {
      h += (pr.veredicto ? `<p class="big">${esc(pr.veredicto)}</p>` : '') + `<p class="muted">Media #${pr.media} · Máx. #${pr.max} · Último ciclo #${pr.ultimo}${me && me.orden ? ' · Tú #' + me.orden : ''}. Orientativo: los contratos pasados no garantizan los futuros.</p>` +
        pr.ciclos.map(c => `<div class="row"><span>${esc(c.mes)} · ${c.n} contratos</span><b>hasta #${esc(c.hasta ?? '—')}</b></div>`).join('');
    }
    d.innerHTML = h + '</div>'; d.scrollIntoView({ behavior: 'smooth' });
  }

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  show('bolsas');
})();
