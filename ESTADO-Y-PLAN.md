# Mi Bolsa Sanidad CV — estado y plan

La interfaz actual busca en `data/resultados.json`, pero **no se han obtenido ni verificado los listados oficiales**. No se deben mostrar datos inventados.

## Fuentes oficiales
- https://www.san.gva.es/es/web/recursos-humans/consultas
- https://www.san.gva.es/downloads/csportales/recursos-humans/es/listaContratadosCategoriaPaso2.html
- https://www.san.gva.es/es/web/recursos-humans/activacion-o-desactivacion-de-bolsa

## Trabajo pendiente
1. Verificar un método autorizado para obtener datos de todas las categorías y departamentos, sin eludir CAPTCHA ni autenticación.
2. Normalizar los registros oficiales, incluyendo fecha y fuente de cada dato.
3. Evitar confundir personas con apellidos coincidentes.
4. Respetar privacidad y condiciones de reutilización antes de publicar datos nominativos en GitHub Pages.
5. Calcular percentiles y distribuciones con la población y cobertura explícitas.
6. Comparar estados entre quincenas y contrataciones sin asumir que toda persona contratada sigue no disponible.
7. Publicar en GitHub Pages cuando la consulta real esté verificada.

## Automatización incorporada
`.github/workflows/monitor-fuentes.yml` comprueba diariamente la accesibilidad de dos páginas públicas. **No descarga listados ni actualiza candidatos**. El resultado se consulta en la pestaña Actions.
