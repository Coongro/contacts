---
'@coongro/contacts': minor
---

Las acciones de contacts se declaran con `@coongro/plugin-sdk/actions`: el Core valida lo que llega a cada una y nadie puede escribir desde afuera las columnas de sistema (`created_at`, `updated_at`, `deleted_at`, `merged_into_id`) ni la calculada (`phone_normalized`). Mientras el Core está en modo sombra, lo inválido se registra y la acción corre igual.

Las acciones devuelven la forma nueva a quien la pide (un contacto en vez de `[contacto]`; `search` y `list` como `{ items, total }`), y la de siempre a todos los demás, así que los kits que usan contacts no cambian. Los hooks de contacts usan el cliente tipado: la tabla muestra el total real en vez de estimarlo.

Requiere Core 0.61.0 o posterior.
