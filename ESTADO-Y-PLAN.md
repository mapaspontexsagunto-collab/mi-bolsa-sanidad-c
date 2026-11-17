# Estado y plan

## Hecho
- PWA con importación manual asistida, instantáneas locales, posición, percentil, distribución de puntos y comparación entre quincenas (solo recuentos).
- Categorías: TCAE y T.E. en Imagen para el Diagnóstico y Medicina Nuclear.

## Pendiente / sin verificar
- El extractor se probó con una tabla simulada (basada en el formato público histórico), **no con la tabla real de la consulta oficial** (requiere CAPTCHA). Si las columnas no se detectan, revisar "Columnas detectadas" en *Importar* y ajustar `COLS` en `lib.js`.
- Predictor de llamada implementado; su importación de nombramientos tampoco se ha probado con la tabla real (misma salvedad que el extractor).
- Las páginas estáticas de `/downloads/csportales/recursos-humans/es/listas/...` son de julio de 2025 (edición 2024.0): no usar.
