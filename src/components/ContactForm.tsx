/**
 * Formulario de crear/editar contacto.
 * Extensible via extraFields para agregar campos específicos del bloque.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import { useContactMutations } from '../hooks/useContactMutations.js';
import type { ContactFormProps, FieldDef } from '../types/components.js';
import type { Contact, ContactCreateData } from '../types/contact.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useEffect, useCallback } = React;

const CONTACT_TYPES = [
  { label: 'Persona', value: 'person' },
  { label: 'Empresa', value: 'company' },
  { label: 'Otro', value: 'other' },
];

const DOCUMENT_TYPES = [
  { label: 'DNI', value: 'DNI' },
  { label: 'CUIT', value: 'CUIT' },
  { label: 'CUIL', value: 'CUIL' },
  { label: 'Pasaporte', value: 'passport' },
  { label: 'Otro', value: 'other' },
];

const BASE_FIELDS: FieldDef[] = [
  { key: 'type', label: 'Tipo', type: 'select', required: true, options: CONTACT_TYPES },
  {
    key: 'name',
    label: 'Nombre',
    type: 'text',
    required: true,
    placeholder: 'Nombre completo o razón social',
  },
  { key: 'phone', label: 'Teléfono', type: 'phone', placeholder: '+54 11 1234-5678' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'email@ejemplo.com' },
  { key: 'document_type', label: 'Tipo documento', type: 'select', options: DOCUMENT_TYPES },
  { key: 'document_number', label: 'Nro. documento', type: 'text', placeholder: '12345678' },
  { key: 'address', label: 'Dirección', type: 'text', placeholder: 'Dirección completa' },
  { key: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Notas adicionales...' },
];

export function ContactForm(props: ContactFormProps) {
  const {
    contactId,
    defaults = {},
    extraFields = [],
    hiddenFields = [],
    onSuccess,
    onCancel,
    onExtraFieldsData,
    className = '',
  } = props;

  const isEdit = !!contactId;
  const { contact, loading: loadingContact } = useContact(contactId);
  const { create, update, creating, updating } = useContactMutations();

  const [formData, setFormData] = useState<Record<string, unknown>>({
    type: 'person',
    name: '',
    is_active: true,
    ...defaults,
  });

  // Cargar datos del contacto en modo edición
  useEffect(() => {
    if (isEdit && contact) {
      setFormData({
        type: contact.type,
        name: contact.name,
        phone: contact.phone ?? '',
        email: contact.email ?? '',
        document_type: contact.document_type ?? '',
        document_number: contact.document_number ?? '',
        address: contact.address ?? '',
        notes: contact.notes ?? '',
        is_active: contact.is_active,
      });
    }
  }, [isEdit, contact]);

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();

      // Separar datos base de campos extra
      const baseKeys = BASE_FIELDS.map((f) => f.key).concat(['is_active']);
      const baseData: Record<string, unknown> = {};
      const extraData: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(formData)) {
        if (baseKeys.includes(key)) {
          baseData[key] = value === '' ? null : value;
        } else {
          extraData[key] = value;
        }
      }

      let result: Contact | null;
      if (isEdit && contactId) {
        result = await update(contactId, baseData as unknown as ContactCreateData);
      } else {
        result = await create(baseData as unknown as ContactCreateData);
      }

      if (result) {
        onExtraFieldsData?.(extraData);
        onSuccess?.(result);
      }
    },
    [formData, isEdit, contactId, create, update, onSuccess, onExtraFieldsData]
  );

  const isSaving = creating || updating;
  const hiddenSet = new Set(hiddenFields);
  const allFields = [...BASE_FIELDS, ...extraFields].filter((f) => !hiddenSet.has(f.key));

  if (isEdit && loadingContact) {
    return React.createElement(UI.LoadingOverlay, {
      variant: 'skeleton',
      rows: 6,
    });
  }

  return React.createElement(
    'form',
    { onSubmit: handleSubmit, className: `flex flex-col gap-4 ${className}` },

    // Campos
    allFields.map((field) =>
      React.createElement(
        'div',
        { key: field.key, className: 'flex flex-col gap-1.5' },
        React.createElement(
          UI.Label,
          null,
          field.label,
          field.required && React.createElement('span', { className: 'text-cg-danger ml-0.5' }, '*')
        ),
        renderField(field, formData[field.key], (v) => handleChange(field.key, v))
      )
    ),

    // Toggle activo
    React.createElement(
      'div',
      { className: 'flex items-center justify-between py-2' },
      React.createElement(UI.Label, null, 'Activo'),
      React.createElement(UI.Switch, {
        checked: !!formData.is_active,
        onCheckedChange: (v: boolean) => handleChange('is_active', v),
      })
    ),

    // Acciones
    React.createElement(
      'div',
      { className: 'flex gap-3 pt-2' },
      React.createElement(
        UI.Button,
        {
          type: 'submit',
          disabled: isSaving || !formData.name,
          className: 'flex-1',
        },
        isSaving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear contacto'
      ),
      onCancel &&
        React.createElement(
          UI.Button,
          {
            type: 'button',
            variant: 'outline',
            onClick: onCancel,
          },
          'Cancelar'
        )
    )
  );
}

function renderField(field: FieldDef, value: unknown, onChange: (v: unknown) => void) {
  switch (field.type) {
    case 'select':
      return React.createElement(
        UI.Select,
        {
          value: (value as string) ?? '',
          onValueChange: (v: string) => onChange(v),
          placeholder: `Seleccionar ${field.label.toLowerCase()}...`,
          clearable: !field.required,
          debounceMs: 0,
        },
        (field.options ?? []).map((opt) =>
          React.createElement(UI.SelectItem, { key: opt.value, value: opt.value }, opt.label)
        )
      );

    case 'textarea':
      return React.createElement(UI.Textarea, {
        value: (value as string) ?? '',
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        placeholder: field.placeholder,
        rows: 3,
      });

    case 'toggle':
      return React.createElement(UI.Switch, {
        checked: !!value,
        onCheckedChange: (v: boolean) => onChange(v),
      });

    default:
      return React.createElement(UI.Input, {
        type: field.type === 'phone' ? 'tel' : field.type,
        value: (value as string) ?? '',
        onChange: (e: { target: { value: string } }) => onChange(e.target.value),
        placeholder: field.placeholder,
        required: field.required,
      });
  }
}
