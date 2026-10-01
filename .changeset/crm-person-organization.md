---
'@coongro/contacts': minor
---

Los contactos distinguen persona de organización y guardan los datos de un CRM

- Columnas nuevas, todas con default o nullable (quien inserta directo en la tabla no se entera):
  `kind` (`person` | `organization`, default `person`), `organization_id`, `first_name`,
  `last_name`, `job_title`, `additional_emails`/`additional_phones` (jsonb, default `[]`),
  `website`, `linkedin`, domicilio estructurado (`address_street`, `address_city`,
  `address_state`, `address_postcode`, `address_country`) y `owner_staff_id`.
- Las migraciones marcan como organización a los contactos con `metadata.kind = 'empresa'` o
  con un `type` que lo dice en cualquier vocabulario (`company`, `empresa`, `organization`,
  `organización`), incluidos los borrados. `type` no cambia: sigue siendo el rol de cada kit.
- Índices no únicos por email, documento, organización, `kind` y `deleted_at`.
- Acciones nuevas: `contacts.listByOrganization` y `contacts.count`. `contacts.list` acepta
  `limit`/`offset` opcionales (sin ellos devuelve la agenda completa, como antes) y
  `contacts.search` filtra además por `kind` y `organizationId`.
- Los contratos agentic exponen los campos nuevos y su copy deja de hablar de alquileres.
