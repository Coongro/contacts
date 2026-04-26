# @coongro/contacts

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
