/**
 * Action Contracts de contacts.
 *
 * El contrato vive JUNTO al handler y es el MISMO objeto que valida en
 * runtime: por eso lo que se publica no puede desincronizarse de lo que la
 * implementación acepta. Un input vacío se declara con `none()`; no poder
 * inferir los parámetros es un error, no un schema vacío.
 *
 * `contacts` no tiene pantallas propias en el kit de alquileres —lo consumen
 * properties, leases y maintenance—, así que el borrador salió sin copy y sin
 * proyección: esto está escrito contra el repositorio.
 *
 * Es un plugin COMPARTIDO: el mismo contacto puede ser el inquilino de una
 * unidad, el propietario de otra y el proveedor que arregla una tercera. Por eso
 * `type` es texto libre y no un enum — cada kit trae su vocabulario, y el
 * veterinario usa valores que acá no existen.
 */

import { defineAction } from '@coongro/plugin-sdk/agentic';

/** Los campos con los que se lee una persona. Compartidos entre las lecturas. */
const CAMPOS_DE_LECTURA = [
  {
    key: 'name',
    name: 'name',
    label: 'Nombre',
    format: 'text' as const,
  },
  {
    key: 'type',
    name: 'type',
    label: 'Rol',
    format: 'text' as const,
  },
  {
    key: 'document_number',
    name: 'documentNumber',
    label: 'Documento',
    format: 'text' as const,
  },
  {
    key: 'phone',
    name: 'phone',
    label: 'Teléfono',
    format: 'text' as const,
  },
  {
    key: 'email',
    name: 'email',
    label: 'Email',
    format: 'text' as const,
  },
];

/** Lo que se puede escribir de una persona. Igual en el alta y en la edición. */
const CAMPOS_EDITABLES = {
  type: {
    type: 'string' as const,
    description:
      'Con qué rol se lo carga: «owner» para un propietario, «tenant» para un inquilino. Un mismo contacto puede cumplir otro rol en otra unidad — esto es con el que nace, no una etiqueta excluyente.',
  },
  name: {
    type: 'string' as const,
    description: 'Nombre y apellido, o la razón social si es una empresa.',
  },
  phone: {
    type: 'string' as const,
    description: 'Teléfono de contacto.',
  },
  email: {
    type: 'string' as const,
    description: 'Email.',
  },
  document_type: {
    type: 'string' as const,
    description: 'Qué documento es: CUIT, CUIL o DNI.',
  },
  document_number: {
    type: 'string' as const,
    description: 'El número del documento. Sin él no se puede facturar ni liquidar.',
  },
  address: {
    type: 'string' as const,
    description: 'Domicilio de la persona — no el del inmueble que alquila.',
  },
  notes: {
    type: 'string' as const,
    description: 'Notas.',
  },
};

export const listContacts = defineAction({
  id: 'contacts.list',
  title: 'Listar contactos',
  description:
    'Toda la agenda: propietarios, inquilinos, garantes y proveedores juntos. Para encontrar a alguien puntual conviene «Buscar un contacto», que filtra por nombre, documento, teléfono, email o rol.',
  effect: 'read',
  confirmation: 'never',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        description: 'Cantidad de resultados a devolver. Default 20; máximo 50.',
      },
      offset: {
        type: 'integer',
        description: 'Cantidad de resultados a saltear para pedir la página siguiente.',
      },
    },
    additionalProperties: false,
  },
  output: {
    kind: 'collection',
    fields: CAMPOS_DE_LECTURA,
    identifierKey: 'id',
    defaultLimit: 20,
    maxLimit: 50,
  },
});

export const getByIdContacts = defineAction({
  id: 'contacts.getById',
  title: 'Ver un contacto',
  description: 'Los datos de una persona: cómo ubicarla, su documento y con qué rol está cargada.',
  effect: 'read',
  confirmation: 'never',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'El contacto que se quiere ver.',
        ref: { resource: 'contacts' },
      },
    },
    required: ['id'],
    additionalProperties: false,
  },
  output: {
    kind: 'record',
    fields: [
      ...CAMPOS_DE_LECTURA,
      {
        key: 'address',
        name: 'address',
        label: 'Domicilio',
        format: 'text' as const,
      },
      {
        key: 'notes',
        name: 'notes',
        label: 'Notas',
        format: 'text' as const,
      },
    ],
    identifierKey: 'id',
  },
});

export const searchContacts = defineAction({
  id: 'contacts.search',
  title: 'Buscar un contacto',
  description:
    'Encuentra a una persona por lo que se sabe de ella: el texto busca a la vez en nombre, email, teléfono y número de documento, por coincidencia parcial. Se puede acotar por rol. Es el camino para llegar a alguien cuando se tiene el nombre y no el id — por ejemplo, quién reportó un arreglo o a qué propietario liquidarle.',
  effect: 'read',
  confirmation: 'never',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Lo que se sabe: parte del nombre, del email, del teléfono o del documento. No hace falta el dato completo.',
      },
      type: {
        type: 'string',
        description:
          'Acota a un rol: «owner» propietarios, «tenant» inquilinos. Si se omite, busca en toda la agenda.',
      },
      limit: {
        type: 'integer',
        description: 'Cantidad de resultados a devolver. Default 20; máximo 50.',
      },
      offset: {
        type: 'integer',
        description: 'Cantidad de resultados a saltear para pedir la página siguiente.',
      },
    },
    // Ninguno es obligatorio: sin `query` pero con `type` es «listame los
    // propietarios», que es una pregunta legítima y que el repositorio resuelve.
    // El borrador exigía `query`.
    additionalProperties: false,
  },
  output: {
    kind: 'collection',
    fields: CAMPOS_DE_LECTURA,
    identifierKey: 'id',
    defaultLimit: 20,
    maxLimit: 50,
  },
});

export const createContacts = defineAction({
  id: 'contacts.create',
  title: 'Dar de alta un contacto',
  description:
    'Registra a una persona en la agenda. Antes conviene buscarla: la misma persona cargada dos veces termina con el contrato a nombre de una y los pagos a nombre de la otra. El alta no valida duplicados.',
  effect: 'write',
  confirmation: 'always',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'Los datos de la persona.',
        properties: CAMPOS_EDITABLES,
        // El repositorio solo exige lo que exige la tabla: rol y nombre. El
        // documento no hace falta para guardar, pero sin él no se puede
        // facturar ni liquidar — está dicho en su descripción.
        required: ['type', 'name'],
        additionalProperties: false,
      },
    },
    required: ['data'],
    additionalProperties: false,
  },
  output: {
    kind: 'record',
    fields: CAMPOS_DE_LECTURA,
    identifierKey: 'id',
  },
});

export const updateContacts = defineAction({
  id: 'contacts.update',
  title: 'Editar un contacto',
  description:
    'Cambia los datos de una persona ya cargada: teléfono, email, documento o domicilio. Cuidado con el rol: pisarlo no la desvincula de nada — sigue siendo la inquilina del contrato que tenga.',
  effect: 'write',
  confirmation: 'always',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'El contacto a editar.',
        ref: { resource: 'contacts' },
      },
      data: {
        type: 'object',
        description: 'Los campos que se quieren cambiar.',
        properties: CAMPOS_EDITABLES,
        additionalProperties: false,
      },
    },
    required: ['id', 'data'],
    additionalProperties: false,
  },
  output: {
    kind: 'record',
    fields: CAMPOS_DE_LECTURA,
    identifierKey: 'id',
  },
});
