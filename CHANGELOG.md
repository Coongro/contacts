# @coongro/contacts

## 1.6.1

### Patch Changes

- El manifest declara con qué acción se borra cada entidad (`deleteAction`), y las vistas regeneradas solo llaman a acciones que existen. No cambia ninguna vista.

## 1.6.0

### Minor Changes

- Las acciones de contacts se declaran con `@coongro/plugin-sdk/actions`: el Core valida lo que llega a cada una y nadie puede escribir desde afuera las columnas de sistema (`created_at`, `updated_at`, `deleted_at`, `merged_into_id`) ni la calculada (`phone_normalized`). Mientras el Core está en modo sombra, lo inválido se registra y la acción corre igual.

  Las acciones devuelven la forma nueva a quien la pide (un contacto en vez de `[contacto]`; `search` y `list` como `{ items, total }`), y la de siempre a todos los demás, así que los kits que usan contacts no cambian. Los hooks de contacts usan el cliente tipado: la tabla muestra el total real en vez de estimarlo.

  Requiere Core 0.61.0 o posterior.

### Patch Changes

- `search` trae la página y el total en una sola consulta (`count(*) OVER()`) en lugar de dos. Antes hacía la segunda aunque quien llama descartara el total.

## 1.5.0

### Minor Changes

- Los contactos distinguen persona de organización y guardan los datos de un CRM
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

- Los contactos declaran quién puede verlos y gestionarlos

  El plugin declara sus permisos (`contributes.permissions`, generados con el Coongro Builder) y trae `src/permissions/permissions.gen.ts` con las constantes para chequearlos en código. En Coongro Standalone, cada usuario ve y hace solo lo que le permiten sus roles; el dueño, todo.

## 1.4.0

### Minor Changes

- cb7b1ea: El catálogo de capacidades del plugin, declarado en código y certificado

  Las cinco capacidades de contactos se declaran con Action Contracts junto a su handler, en vez de deducirse de las vistas.

### Patch Changes

- 3b0d7c1: La tabla de contactos genera su propia clave y nace activa

  `id` pasa a `defaultRandom()` e `is_active` a `default(true)`: eran los dos únicos
  `NOT NULL` sin default de la tabla, y eran los dos que rompían el alta de contactos
  hecha desde otro plugin.

  Un contacto no se crea solo desde acá — el alta de propietarios de `properties`
  escribe la misma tabla — y depender de que cada escritor recuerde generar el UUID
  era frágil: el alta de propietarios fallaba con `null value in column "id"`, tanto
  por la interfaz como por el MCP.

  `ContactRepository.create` deja de generar el UUID a mano; si `data` trae un id, se
  respeta igual.

## 1.3.0

### Minor Changes

- 439ee0c: feat(COONG-208): rediseño de ContactDetail

  Card de identidad con avatar de iniciales, eyebrow del tipo, badge
  activo/inactivo y riel de datos de contacto (teléfono/email/dirección/
  documento con iconos). Banner de inactivo, notas, metadata y secciones
  inyectables. Tokens semánticos `cg-*` (dark mode) e iconos Lucide.

- b6a418e: fix(detail): contact schema updated_at now uses .$onUpdate() for proper timestamp refresh; ContactDetail timestamps wrapped in compact Card with es-AR locale (COONG-112)
- b6a418e: refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)
  - `ContactForm` ahora envuelve cada sección (Información personal, Contacto, Documento, Dirección, Notas, Estado) en `UI.FormSection` (Card + ícono + título), reemplazando el helper local `renderSectionHeader`.
  - `CreateContactButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear contacto siempre visibles.
  - `ContactFormProps` extendida con `formRef`, `hideActions`, `onSavingChange` para integrarse en footers externos. Compatible hacia atrás (todas opcionales).

## 1.2.0

### Minor Changes

- 33ead4b: fix(detail): contact schema updated_at now uses .$onUpdate() for proper timestamp refresh; ContactDetail timestamps wrapped in compact Card with es-AR locale (COONG-112)
- 33ead4b: refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)
  - `ContactForm` ahora envuelve cada sección (Información personal, Contacto, Documento, Dirección, Notas, Estado) en `UI.FormSection` (Card + ícono + título), reemplazando el helper local `renderSectionHeader`.
  - `CreateContactButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear contacto siempre visibles.
  - `ContactFormProps` extendida con `formRef`, `hideActions`, `onSavingChange` para integrarse en footers externos. Compatible hacia atrás (todas opcionales).

## 1.1.0

### Minor Changes

- b2fd5b7: Migrate ContactsTable to DataTable with mobile card view (mobileRender)

## 1.0.5

### Patch Changes

- 9902a43: Test GitHub Release creation in publish workflow

## 1.0.4

### Patch Changes

- da470c0: Test tag creation in publish workflow

## 1.0.3

### Patch Changes

- 4d8dad2: Test staging pipeline and Verdaccio publish
