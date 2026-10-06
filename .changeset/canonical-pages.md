---
'@coongro/contacts': minor
---

Forma canónica de las acciones, sin `legacy` (requiere Core ≥ 0.70):

- `contacts.list`: de array a página (`pageInput` → `{ items, total }`, 50 por defecto), con `search`, `orderBy` y filtros `type`, `kind`, `organization_id`, `is_active`.
- `contacts.search`: sigue devolviendo `{ items, total }`, pero sin `limit` trae 50 (antes, todos); acepta `search` además de `query` y `orderBy` solo por columnas ordenables.
- `contacts.listByOrganization`: de array a página; `organizationId` obligatorio.
- `contacts.findByTag`: de array a página.
- `contacts.create`, `contacts.update`, `contacts.softDelete`, `contacts.restore`: devuelven el registro (o `null`), nunca `[registro]`.
