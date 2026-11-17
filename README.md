# Mi Bolsa Sanidad CV

Web instalable (PWA) para seguir tu posición en las bolsas de empleo temporal de Sanidad (GVA). Proyecto no oficial.

- **Sin servidor:** los datos se guardan solo en el dispositivo (IndexedDB).
- **CAPTCHA:** la consulta oficial usa Cloudflare Turnstile. Lo resuelves tú; el marcador `extractor.js` solo lee la tabla ya visible.
- **Flujo:** consulta oficial → marcador «Capturar bolsa» → Copiar → pestaña *Importar* → Guardar. Ver `instalar.html`.
- **Privacidad:** no se publican listados con nombres; este repositorio solo contiene código.

Pruebas del módulo de análisis: `node tests/lib.test.js`.
