/**
 * Action Contracts de contacts.
 *
 * El contrato vive JUNTO al handler y es el MISMO objeto que valida en
 * runtime: por eso lo que se publica no puede desincronizarse de lo que la
 * implementación acepta. Un input vacío se declara con `none()`; no poder
 * inferir los parámetros es un error, no un schema vacío.
 *
 * `contacts` no tiene pantallas propias: es la agenda común que consumen los
 * kits (alquileres, veterinaria, peluquería, CRM...), así que esto está escrito
 * contra el repositorio y el copy no puede hablar el idioma de ningún kit.
 *
 * Es un plugin COMPARTIDO: el mismo contacto puede cumplir un rol en un kit y
 * otro en el siguiente. Por eso `type` es texto libre y no un enum — cada kit
 * trae su vocabulario. Si es una persona o una organización lo dice `kind`,
 * que sí es cerrado.
 */

import { defineAction } from '@coongro/plugin-sdk/agentic';

/** Los campos con los que se lee un contacto. Compartidos entre las lecturas. */
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
    key: 'kind',
    name: 'kind',
    label: 'Persona u organización',
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

/** Lo que se puede escribir de un contacto. Igual en el alta y en la edición. */
const CAMPOS_EDITABLES = {
  type: {
    type: 'string' as const,
    description:
      'El rol con el que lo usa el negocio, en el vocabulario de cada kit (por ejemplo «client», «supplier», «owner»). Un mismo contacto puede cumplir otro rol en otro lado — esto es con el que nace, no una etiqueta excluyente.',
  },
  kind: {
    type: 'string' as const,
    enum: ['person', 'organization'],
    description:
      '«person» para una persona, «organization» para una empresa u organización. Si se omite, es una persona.',
  },
  name: {
    type: 'string' as const,
    description:
      'El nombre visible: nombre y apellido de una persona, o la razón social de una organización.',
  },
  first_name: {
    type: 'string' as const,
    description: 'Nombre de pila, si se lo quiere guardar aparte. No reemplaza a «name».',
  },
  last_name: {
    type: 'string' as const,
    description: 'Apellido, si se lo quiere guardar aparte. No reemplaza a «name».',
  },
  job_title: {
    type: 'string' as const,
    description: 'Cargo o puesto de la persona dentro de su organización.',
  },
  organization_id: {
    type: 'string' as const,
    description:
      'La organización a la que pertenece esta persona: otro contacto cargado como organización.',
    ref: { resource: 'contacts' },
  },
  phone: {
    type: 'string' as const,
    description: 'Teléfono principal.',
  },
  additional_phones: {
    type: 'array' as const,
    description: 'Otros teléfonos, además del principal. Reemplaza la lista entera.',
    items: { type: 'string' as const, description: 'Un teléfono.' },
  },
  email: {
    type: 'string' as const,
    description: 'Email principal.',
  },
  additional_emails: {
    type: 'array' as const,
    description: 'Otros emails, además del principal. Reemplaza la lista entera.',
    items: { type: 'string' as const, description: 'Un email.' },
  },
  website: {
    type: 'string' as const,
    description: 'Sitio web, sobre todo de una organización.',
  },
  linkedin: {
    type: 'string' as const,
    description: 'Perfil o página de LinkedIn.',
  },
  document_type: {
    type: 'string' as const,
    description: 'Qué documento es: CUIT, CUIL o DNI.',
  },
  document_number: {
    type: 'string' as const,
    description: 'El número del documento. Hace falta para facturarle.',
  },
  address: {
    type: 'string' as const,
    description: 'Domicilio en una sola línea.',
  },
  address_street: {
    type: 'string' as const,
    description: 'Calle y número del domicilio, si se lo carga por partes.',
  },
  address_city: {
    type: 'string' as const,
    description: 'Ciudad o localidad del domicilio.',
  },
  address_state: {
    type: 'string' as const,
    description: 'Provincia o estado del domicilio.',
  },
  address_postcode: {
    type: 'string' as const,
    description: 'Código postal del domicilio.',
  },
  address_country: {
    type: 'string' as const,
    description: 'País del domicilio.',
  },
  owner_staff_id: {
    type: 'string' as const,
    description: 'La persona del equipo responsable de este contacto.',
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
    'Toda la agenda del negocio, personas y organizaciones juntas, sin importar el rol. Para encontrar a alguien puntual conviene «Buscar un contacto», que filtra por nombre, documento, teléfono, email, rol u organización.',
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
  description:
    'Los datos de un contacto: cómo ubicarlo, su documento, con qué rol está cargado y, si es una persona, a qué organización pertenece.',
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
        key: 'job_title',
        name: 'jobTitle',
        label: 'Cargo',
        format: 'text' as const,
      },
      {
        key: 'organization_id',
        name: 'organizationId',
        label: 'Organización',
        format: 'text' as const,
      },
      {
        key: 'website',
        name: 'website',
        label: 'Sitio web',
        format: 'text' as const,
      },
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
    'Encuentra un contacto por lo que se sabe de él: el texto busca a la vez en nombre, email, teléfono y número de documento, por coincidencia parcial. Se puede acotar por rol, a personas u organizaciones, o a las personas de una organización. Es el camino para llegar a alguien cuando se tiene el nombre y no el id.',
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
          'Acota a un rol, en el vocabulario del kit que lo cargó. Si se omite, busca en toda la agenda.',
      },
      kind: {
        type: 'string',
        enum: ['person', 'organization'],
        description: 'Acota a personas («person») o a organizaciones («organization»).',
      },
      organizationId: {
        type: 'string',
        description: 'Acota a las personas que pertenecen a esta organización.',
        ref: { resource: 'contacts' },
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
    // Ninguno es obligatorio: sin `query` pero con `type` es «listame los de este
    // rol», que es una pregunta legítima y que el repositorio resuelve.
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
    'Registra a una persona u organización en la agenda. Antes conviene buscarla: el mismo contacto cargado dos veces termina con su historia repartida entre los dos. El alta no valida duplicados.',
  effect: 'write',
  confirmation: 'always',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'Los datos del contacto.',
        properties: CAMPOS_EDITABLES,
        // El repositorio solo exige lo que exige la tabla: rol y nombre. `kind`
        // tiene default (persona) y el documento no hace falta para guardar.
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
    'Cambia los datos de un contacto ya cargado: teléfono, email, documento, domicilio, cargo u organización. Cuidado con el rol: pisarlo no lo desvincula de nada de lo que ya tenga asociado en otros módulos.',
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

export const listByOrganizationContacts = defineAction({
  id: 'contacts.listByOrganization',
  title: 'Personas de una organización',
  description:
    'Las personas cargadas como parte de una organización, ordenadas por nombre. Recibe una organización, no una persona.',
  effect: 'read',
  confirmation: 'never',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'La organización de la que se quieren ver las personas.',
        ref: { resource: 'contacts' },
      },
    },
    required: ['organizationId'],
    additionalProperties: false,
  },
  output: {
    kind: 'collection',
    fields: [
      ...CAMPOS_DE_LECTURA,
      {
        key: 'job_title',
        name: 'jobTitle',
        label: 'Cargo',
        format: 'text' as const,
      },
    ],
    identifierKey: 'id',
  },
});

export const countContacts = defineAction({
  id: 'contacts.count',
  title: 'Contar contactos',
  description:
    'Cuántos contactos hay en la agenda, en total o acotado por rol o a personas u organizaciones. Para responder «cuántos» sin traer la lista.',
  effect: 'read',
  confirmation: 'never',
  tenantScope: 'required',
  input: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        description: 'Cuenta solo los de este rol, en el vocabulario del kit que los cargó.',
      },
      kind: {
        type: 'string',
        enum: ['person', 'organization'],
        description: 'Cuenta solo personas («person») u organizaciones («organization»).',
      },
    },
    additionalProperties: false,
  },
});
