---
'@coongro/contacts': patch
---

La tabla de contactos genera su propia clave y nace activa

`id` pasa a `defaultRandom()` e `is_active` a `default(true)`: eran los dos únicos
`NOT NULL` sin default de la tabla, y eran los dos que rompían el alta de contactos
hecha desde otro plugin.

Un contacto no se crea solo desde acá — el alta de propietarios de `properties`
escribe la misma tabla — y depender de que cada escritor recuerde generar el UUID
era frágil: el alta de propietarios fallaba con `null value in column "id"`, tanto
por la interfaz como por el MCP.

`ContactRepository.create` deja de generar el UUID a mano; si `data` trae un id, se
respeta igual.
