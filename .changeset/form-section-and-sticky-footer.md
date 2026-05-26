---
'@coongro/contacts': minor
---

refactor(ui): adopt FormSection + FormDialogSubmit from `@coongro/ui-components` 0.28.0 (COONG-112)

- `ContactForm` ahora envuelve cada sección (Información personal, Contacto, Documento, Dirección, Notas, Estado) en `UI.FormSection` (Card + ícono + título), reemplazando el helper local `renderSectionHeader`.
- `CreateContactButton` migra a `UI.FormDialogSubmit`: footer sticky con botones Cancelar/Crear contacto siempre visibles.
- `ContactFormProps` extendida con `formRef`, `hideActions`, `onSavingChange` para integrarse en footers externos. Compatible hacia atrás (todas opcionales).
