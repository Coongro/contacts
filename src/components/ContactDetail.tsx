/**
 * Vista detallada de un contacto con secciones extensibles.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import { formatType } from '../lib/formatType.js';
import type { ContactDetailProps } from '../types/components.js';

const React = getHostReact();
const UI = getHostUI();

export function ContactDetail(props: ContactDetailProps) {
  const {
    contactId,
    extraSections = [],
    extraActions = [],
    onEdit,
    onDelete,
    className = '',
  } = props;

  const { contact, loading, error, refetch } = useContact(contactId);

  if (loading) {
    return React.createElement(
      'div',
      { className: `flex flex-col gap-6 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-4' },
        React.createElement(UI.Skeleton, { className: 'w-16 h-16 rounded-full' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          React.createElement(UI.Skeleton, { className: 'h-6 w-48' }),
          React.createElement(UI.Skeleton, { className: 'h-4 w-24' })
        )
      ),
      ...Array.from({ length: 4 }).map((_, i) =>
        React.createElement(UI.Skeleton, {
          key: i,
          className: 'h-10 rounded-lg',
        })
      )
    );
  }

  if (error || !contact) {
    return React.createElement(UI.ErrorDisplay, {
      title: 'Contacto no encontrado',
      message: error ?? undefined,
      onRetry: refetch,
    });
  }

  const typeLabel = formatType(contact.type);

  const infoFields = [
    { label: 'Teléfono', value: contact.phone },
    { label: 'Email', value: contact.email },
    { label: 'Dirección', value: contact.address },
    {
      label: 'Documento',
      value: contact.document_number
        ? `${contact.document_type ?? ''} ${contact.document_number}`.trim()
        : null,
    },
    { label: 'Notas', value: contact.notes },
  ].filter((f) => f.value);

  const sortedSections = [...extraSections].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  return React.createElement(
    'div',
    { className: `flex flex-col gap-6 ${className}` },

    // Header
    React.createElement(
      'div',
      { className: 'flex items-center gap-4' },
      React.createElement(UI.Avatar, { name: contact.name, size: 'lg' }),
      React.createElement(
        'div',
        { className: 'flex flex-col flex-1 min-w-0' },
        React.createElement(
          'h2',
          { className: 'text-xl font-semibold text-cg-text truncate' },
          contact.name
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 mt-1' },
          React.createElement('span', { className: 'text-sm text-cg-text-muted' }, typeLabel),
          React.createElement(
            UI.Badge,
            {
              variant: contact.is_active ? 'success-soft' : 'secondary',
              size: 'sm',
            },
            contact.is_active ? 'Activo' : 'Inactivo'
          )
        )
      ),
      // Acciones principales
      React.createElement(
        'div',
        { className: 'flex gap-2 flex-shrink-0' },
        onEdit &&
          React.createElement(
            UI.Button,
            {
              variant: 'outline',
              size: 'sm',
              onClick: () => onEdit(contact),
            },
            'Editar'
          ),
        onDelete &&
          React.createElement(
            UI.Button,
            {
              variant: 'destructive',
              size: 'sm',
              onClick: () => onDelete(contact),
            },
            'Eliminar'
          ),
        ...extraActions
          .filter((a) => !a.hidden || !a.hidden(contact))
          .map((action, i) =>
            React.createElement(
              UI.Button,
              {
                key: i,
                variant: 'outline',
                size: 'sm',
                onClick: () => action.onClick(contact),
              },
              action.label
            )
          )
      )
    ),

    // Info básica
    infoFields.length > 0 &&
      React.createElement(
        UI.Card,
        null,
        React.createElement(
          UI.CardHeader,
          null,
          React.createElement(UI.CardTitle, null, 'Información')
        ),
        React.createElement(
          UI.CardBody,
          null,
          React.createElement(
            'div',
            { className: 'grid grid-cols-2 gap-3' },
            infoFields.map((field) =>
              React.createElement(
                'div',
                { key: field.label, className: 'flex flex-col gap-0.5' },
                React.createElement(
                  'span',
                  { className: 'text-xs text-cg-text-muted' },
                  field.label
                ),
                React.createElement('span', { className: 'text-sm text-cg-text' }, field.value)
              )
            )
          )
        )
      ),

    // Tags
    contact.tags &&
      Array.isArray(contact.tags) &&
      contact.tags.length > 0 &&
      React.createElement(
        'div',
        { className: 'flex flex-wrap gap-1.5' },
        contact.tags.map((tag: string) => React.createElement(UI.Chip, { key: tag }, tag))
      ),

    // Secciones extra del bloque
    ...sortedSections.map((section, i) =>
      React.createElement(
        UI.Card,
        { key: i },
        React.createElement(
          UI.CardHeader,
          null,
          React.createElement(UI.CardTitle, null, section.title)
        ),
        React.createElement(UI.CardBody, null, section.render() as React.ReactNode)
      )
    ),

    // Metadata
    React.createElement(
      'div',
      { className: 'text-xs text-cg-text-subtle flex gap-4' },
      React.createElement(
        'span',
        null,
        `Creado: ${new Date(contact.created_at).toLocaleDateString()}`
      ),
      React.createElement(
        'span',
        null,
        `Actualizado: ${new Date(contact.updated_at).toLocaleDateString()}`
      )
    )
  );
}
