/**
 * Vista detallada de un contacto con secciones extensibles.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import type { ContactDetailProps } from '../types/components.js';

const React = getHostReact();

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
        React.createElement('div', {
          className: 'w-16 h-16 rounded-full bg-[var(--cg-skeleton)] animate-pulse',
        }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          React.createElement('div', {
            className: 'h-6 w-48 rounded bg-[var(--cg-skeleton)] animate-pulse',
          }),
          React.createElement('div', {
            className: 'h-4 w-24 rounded bg-[var(--cg-skeleton)] animate-pulse',
          })
        )
      ),
      Array.from({ length: 4 }).map((_, i) =>
        React.createElement('div', {
          key: i,
          className: 'h-10 rounded-lg bg-[var(--cg-skeleton)] animate-pulse',
        })
      )
    );
  }

  if (error || !contact) {
    return React.createElement(
      'div',
      { className: 'flex flex-col items-center py-12 gap-3' },
      React.createElement(
        'p',
        { className: 'text-sm text-[var(--cg-text-muted)]' },
        error ?? 'Contacto no encontrado'
      ),
      React.createElement(
        'button',
        {
          onClick: refetch,
          className:
            'px-4 py-2 text-sm rounded-lg bg-[var(--cg-accent)] text-[var(--cg-text-inverse)]',
        },
        'Reintentar'
      )
    );
  }

  const typeLabel =
    contact.type === 'person' ? 'Persona' : contact.type === 'company' ? 'Empresa' : contact.type;

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
      // Avatar grande
      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-center w-16 h-16 rounded-full bg-[var(--cg-accent)] text-[var(--cg-text-inverse)] text-2xl font-medium flex-shrink-0',
        },
        contact.name.charAt(0).toUpperCase()
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col flex-1 min-w-0' },
        React.createElement(
          'h2',
          { className: 'text-xl font-semibold text-[var(--cg-text)] truncate' },
          contact.name
        ),
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 mt-1' },
          React.createElement(
            'span',
            { className: 'text-sm text-[var(--cg-text-muted)]' },
            typeLabel
          ),
          React.createElement(
            'span',
            {
              className: `inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                contact.is_active
                  ? 'bg-[var(--cg-success-bg)] text-[var(--cg-success)]'
                  : 'bg-[var(--cg-bg-tertiary)] text-[var(--cg-text-muted)]'
              }`,
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
            'button',
            {
              onClick: () => onEdit(contact),
              className:
                'px-4 py-2 text-sm rounded-lg border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)] transition-colors',
            },
            'Editar'
          ),
        onDelete &&
          React.createElement(
            'button',
            {
              onClick: () => onDelete(contact),
              className:
                'px-4 py-2 text-sm rounded-lg text-[var(--cg-danger)] border border-[var(--cg-danger)] hover:bg-[var(--cg-danger-bg)] transition-colors',
            },
            'Eliminar'
          ),
        extraActions
          .filter((a) => !a.hidden || !a.hidden(contact))
          .map((action, i) =>
            React.createElement(
              'button',
              {
                key: i,
                onClick: () => action.onClick(contact),
                className:
                  'px-4 py-2 text-sm rounded-lg border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)] transition-colors',
              },
              action.label
            )
          )
      )
    ),

    // Info básica
    infoFields.length > 0 &&
      React.createElement(
        'div',
        { className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
          'Información'
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-3' },
          infoFields.map((field) =>
            React.createElement(
              'div',
              { key: field.label, className: 'flex flex-col gap-0.5' },
              React.createElement(
                'span',
                { className: 'text-xs text-[var(--cg-text-muted)]' },
                field.label
              ),
              React.createElement(
                'span',
                { className: 'text-sm text-[var(--cg-text)]' },
                field.value
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
        contact.tags.map((tag: string) =>
          React.createElement(
            'span',
            {
              key: tag,
              className:
                'inline-flex items-center px-2.5 py-1 text-xs rounded-full border border-[var(--cg-border)] text-[var(--cg-text)]',
            },
            tag
          )
        )
      ),

    // Secciones extra del bloque
    sortedSections.map((section, i) =>
      React.createElement(
        'div',
        { key: i, className: 'rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4' },
        React.createElement(
          'h3',
          { className: 'text-sm font-medium text-[var(--cg-text-muted)] mb-3' },
          section.title
        ),
        section.render() as React.ReactNode
      )
    ),

    // Metadata
    React.createElement(
      'div',
      { className: 'text-xs text-[var(--cg-text-subtle)] flex gap-4' },
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
