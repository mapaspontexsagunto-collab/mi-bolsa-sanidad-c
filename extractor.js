(function(){
var d=document;
var txt=function(e){return (e&&(e.innerText||e.textContent)||'').replace(/\s+/g,' ').trim()};
var tabs=[].slice.call(d.querySelectorAll('table')).filter(function(t){return t.querySelectorAll('tr').length>2});
if(!tabs.length){alert('No veo ninguna tabla de resultados. Pulsa antes "Obtener listado" y vuelve a ejecutar.');return}
tabs.sort(function(a,b){return b.querySelectorAll('tr').length-a.querySelectorAll('tr').length});
var t=tabs[0];
var headers=[].map.call(t.querySelectorAll('thead th, thead td'),txt);
var rows=[];
[].forEach.call(t.querySelectorAll('tr'),function(tr){
if(tr.closest('thead'))return;
var c=[].map.call(tr.querySelectorAll('td'),txt);
if(c.length>1)rows.push(c);
});
if(!headers.length&&rows.length){headers=rows.shift();}
var ctx=[].map.call(d.querySelectorAll('.ui-selectonemenu-label,.ui-paginator-current'),txt);
[].forEach.call(d.querySelectorAll('select'),function(s){ctx.push(txt(s.options[s.selectedIndex]||s))});
(d.body.innerText||'').split(/\n+/).forEach(function(l){if(/^(Lista|Edici|Turno|Categor|Departamento|.*\d{2}\/\d{2}\/20\d{2})/i.test(l.trim())&&ctx.length<40)ctx.push(l.trim().slice(0,200))});
var payload=JSON.stringify({v:1,capturedAt:new Date().toISOString(),url:location.origin+location.pathname,headers:headers,rows:rows,ctx:ctx});
var old=d.getElementById('__bolsa_cap');if(old)old.remove();
var box=d.createElement('div');box.id='__bolsa_cap';
box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#fffe;padding:16px;font:16px system-ui;overflow:auto';
box.innerHTML='<b>Captura lista: '+rows.length+' filas</b><br><small>Pulsa Copiar y pégala en Mi Bolsa Sanidad (pestaña Importar).</small><br><textarea readonly style="width:100%;height:40vh;margin:8px 0"></textarea><br><button id="__c" style="padding:12px;font-size:16px">Copiar</button> <button id="__x" style="padding:12px;font-size:16px">Cerrar</button>';
d.body.appendChild(box);
var ta=box.querySelector('textarea');ta.value=payload;
box.querySelector('#__x').onclick=function(){box.remove()};
box.querySelector('#__c').onclick=function(){
ta.select();ta.setSelectionRange(0,payload.length);
var ok=false;try{ok=d.execCommand('copy')}catch(e){}
if(!ok&&navigator.clipboard){navigator.clipboard.writeText(payload).then(function(){alert('Copiado')},function(){alert('Copia manual: mantén pulsado el texto y elige Copiar')});return}
alert(ok?'Copiado':'Copia manual: mantén pulsado el texto y elige Copiar');
};
})();
