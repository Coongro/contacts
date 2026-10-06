/**
 * Formulario de crear/editar contacto.
 * Extensible via extraFields para agregar campos específicos del bloque.
 */
import {
  Button,
  FormSection,
  Input,
  Label,
  LoadingOverlay,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from '@coongro/ui-components';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { useContact } from '../hooks/useContact.js';
import { useContactMutations } from '../hooks/useContactMutations.js';
import { kindFromType } from '../lib/kindFromType.js';
import type { ContactFormProps, FieldDef } from '../types/components.js';
import type { Contact, ContactCreateData } from '../types/contact.js';

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

/** Secciones con iconos para agrupar los campos visualmente */
const FIELD_SECTIONS: Array<{ title: string; icon: string; keys: string[] }> = [
  { title: 'Información personal', icon: 'User', keys: ['type', 'name'] },
  { title: 'Contacto', icon: 'Phone', keys: ['phone', 'email'] },
  { title: 'Documento', icon: 'FileCheck', keys: ['document_type', 'document_number'] },
  { title: 'Dirección', icon: 'MapPin', keys: ['address'] },
  { title: 'Notas', icon: 'FileText', keys: ['notes'] },
];

/** Keys de campos base que pertenecen a alguna sección */
const BASE_SECTIONED_KEYS = new Set(
  FIELD_SECTIONS.flatMap((s) => s.keys).filter((k) => BASE_FIELDS.some((f) => f.key === k))
);

function getSubmitLabel(isSaving: boolean, isEdit: boolean): string {
  if (isSaving) return 'Guardando...';
  if (isEdit) return 'Actualizar';
  return 'Crear contacto';
}

export function ContactForm(props: ContactFormProps): ReactElement {
  const {
    contactId,
    defaults = {},
    extraFields = [],
    hiddenFields = [],
    onSuccess,
    onCancel,
    onExtraFieldsData,
    className = '',
    formRef,
    hideActions,
    onSavingChange,
  } = props;

  const isEdit = !!contactId;
  const { contact, loading: loadingContact } = useContact(contactId);
  const { create, update, creating, updating } = useContactMutations();
  const isSaving = creating || updating;

  useEffect(() => {
    onSavingChange?.(isSaving);
  }, [isSaving, onSavingChange]);

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

      // El selector de este formulario mezcla rol con persona/empresa: se refleja en
      // `kind` con la misma regla que el backfill. Otros valores de `type` no lo tocan.
      const kind = kindFromType(baseData.type);
      if (kind) baseData.kind = kind;

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

  const hiddenSet = new Set(hiddenFields);
  const allFields = [...BASE_FIELDS, ...extraFields].filter((f) => !hiddenSet.has(f.key));

  if (isEdit && loadingContact) {
    return <LoadingOverlay variant="skeleton" rows={6} />;
  }

  // Campos extra de bloques que no pertenecen a ninguna sección base
  const unsectionedFields = allFields.filter((f) => !BASE_SECTIONED_KEYS.has(f.key));

  function renderFieldEl(field: FieldDef): ReactElement {
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <Label>
          {field.label}
          {field.required && <span className="text-cg-danger ml-0.5">*</span>}
        </Label>
        {renderField(field, formData[field.key], (v) => handleChange(field.key, v))}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={(e) => void handleSubmit(e)}
      className={`flex flex-col gap-4 ${className}`}
    >
      {/* Campos agrupados por sección */}
      {FIELD_SECTIONS.map((section) => {
        const sectionFields = section.keys
          .map((k) => allFields.find((f) => f.key === k))
          .filter((f): f is FieldDef => Boolean(f));
        if (sectionFields.length === 0) return null;
        return (
          <FormSection key={section.title} icon={section.icon} title={section.title}>
            {sectionFields.map(renderFieldEl)}
          </FormSection>
        );
      }).filter(Boolean)}

      {/* Campos extra de bloques (sin sección) */}
      {unsectionedFields.length > 0 && (
        <FormSection key="extra" icon="Settings" title="Datos adicionales">
          {unsectionedFields.map(renderFieldEl)}
        </FormSection>
      )}

      {/* Toggle activo */}
      <FormSection key="status" icon="CircleCheck" title="Estado">
        <div className="flex items-center justify-between">
          <Label>Activo</Label>
          <Switch
            checked={!!formData.is_active}
            onCheckedChange={(v: boolean) => handleChange('is_active', v)}
          />
        </div>
      </FormSection>

      {/* Acciones (solo si el caller no las pone en el footer del dialog) */}
      {!hideActions && (
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSaving || !formData.name} className="flex-1">
            {getSubmitLabel(isSaving, isEdit)}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      )}
    </form>
  );
}

function renderField(
  field: FieldDef,
  value: unknown,
  onChange: (v: unknown) => void
): ReactElement {
  switch (field.type) {
    case 'select':
      return (
        <Select
          value={(value as string) ?? ''}
          onValueChange={(v: string) => onChange(v)}
          placeholder={`Seleccionar ${field.label.toLowerCase()}...`}
          clearable={!field.required}
          debounceMs={0}
        >
          {(field.options ?? []).map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>
      );

    case 'textarea':
      return (
        <Textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      );

    case 'toggle':
      return <Switch checked={!!value} onCheckedChange={(v: boolean) => onChange(v)} />;

    default:
      return (
        <Input
          type={field.type === 'phone' ? 'tel' : field.type}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
  }
}
