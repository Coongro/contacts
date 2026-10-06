---
"@coongro/contacts": minor
---

Componentes y hooks del navegador en JSX con imports normales (`react`, `@coongro/ui-components`) en lugar de `React.createElement` + `getHostReact()`/`getHostUI()`. Mismo render salvo un cambio declarado: en `ContactDetail` las fechas de alta y última modificación salen con `useFormat()` (zona horaria del negocio y formato `06/10/2026`; antes zona del navegador y `6/10/2026`). Requiere Core >=0.69.0.
