# @coongro/contacts

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
