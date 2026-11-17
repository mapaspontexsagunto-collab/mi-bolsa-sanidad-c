# Estado y plan

## Hecho
- PWA con importación manual asistida, instantáneas locales, posición, percentil, distribución de puntos y comparación entre quincenas (solo recuentos).
- Categorías: TCAE y T.E. en Imagen para el Diagnóstico y Medicina Nuclear.

## Pendiente / sin verificar
- El extractor se probó con una tabla simulada (basada en el formato público histórico), **no con la tabla real de la consulta oficial** (requiere CAPTCHA). Si las columnas no se detectan, revisar "Columnas detectadas" en *Importar* y ajustar `COLS` en `lib.js`.
- Predictor de llamada: requiere importar la lista de nombramientos (últimos 6 meses); no implementado.
- Las páginas estáticas de `/downloads/csportales/recursos-humans/es/listas/...` son de julio de 2025 (edición 2024.0): no usar.
- Icono PNG para iOS (ahora SVG).
