/**
 * Tarjeta resumen de un contacto.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import type { ContactCardProps } from '../types/components.js';
import type { Contact } from '../types/contact.js';

const React = getHostReact();

const DEFAULT_SHOW_FIELDS: Array<keyof Contact> = ['phone', 'email', 'address'];

export function ContactCard(props: ContactCardProps) {
  const {
    contactId,
    contact: contactProp,
    showFields = DEFAULT_SHOW_FIELDS,
    extraInfo,
    actions: cardActions = [],
    onClick,
    className = '',
  } = props;

  const { contact: fetchedContact, loading } = useContact(contactProp ? null : contactId);
  const contact = contactProp ?? fetchedContact;

  if (loading) {
    return React.createElement(
      'div',
      { className: `rounded-xl border border-[var(--cg-border)] p-4 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement('div', {
          className: 'w-10 h-10 rounded-full bg-[var(--cg-skeleton)] animate-pulse',
        }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5 flex-1' },
          React.createElement('div', {
            className: 'h-4 w-32 rounded bg-[var(--cg-skeleton)] animate-pulse',
          }),
          React.createElement('div', {
            className: 'h-3 w-20 rounded bg-[var(--cg-skeleton)] animate-pulse',
          })
        )
      )
    );
  }

  if (!contact) {
    return React.createElement(
      'div',
      {
        className: `rounded-xl border border-[var(--cg-border)] p-4 text-center text-sm text-[var(--cg-text-muted)] ${className}`,
      },
      'Contacto no encontrado'
    );
  }

  const fieldLabels: Record<string, string> = {
    phone: 'Teléfono',
    email: 'Email',
    address: 'Dirección',
    document_number: 'Documento',
    notes: 'Notas',
  };

  return React.createElement(
    'div',
    {
      className: `rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-[var(--cg-accent)] hover:shadow-sm' : ''
      } ${className}`,
      onClick: onClick ? () => onClick(contact) : undefined,
    },

    // Header: avatar + nombre + tipo
    React.createElement(
      'div',
      { className: 'flex items-center gap-3' },
      React.createElement(
        'div',
        {
          className:
            'flex items-center justify-center w-10 h-10 rounded-full bg-[var(--cg-accent)] text-[var(--cg-text-inverse)] text-sm font-medium flex-shrink-0',
        },
        contact.name.charAt(0).toUpperCase()
      ),
      React.createElement(
        'div',
        { className: 'flex flex-col min-w-0 flex-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-[var(--cg-text)] truncate' },
          contact.name
        ),
        React.createElement(
          'span',
          { className: 'text-xs text-[var(--cg-text-muted)]' },
          contact.type === 'person'
            ? 'Persona'
            : contact.type === 'company'
              ? 'Empresa'
              : contact.type
        )
      ),
      // Badge activo/inactivo
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
    ),

    // Campos
    showFields.length > 0 &&
      React.createElement(
        'div',
        { className: 'mt-3 flex flex-col gap-1' },
        showFields.map((field) => {
          const value = contact[field];
          if (!value) return null;
          return React.createElement(
            'div',
            { key: field, className: 'flex items-center gap-2 text-xs' },
            React.createElement(
              'span',
              { className: 'text-[var(--cg-text-muted)] w-20 flex-shrink-0' },
              fieldLabels[field] ?? field
            ),
            React.createElement(
              'span',
              { className: 'text-[var(--cg-text)] truncate' },
              String(value)
            )
          );
        })
      ),

    // Extra info del bloque
    extraInfo &&
      React.createElement(
        'div',
        { className: 'mt-3 pt-3 border-t border-[var(--cg-border)]' },
        extraInfo as React.ReactNode
      ),

    // Acciones
    cardActions.length > 0 &&
      React.createElement(
        'div',
        { className: 'mt-3 pt-3 border-t border-[var(--cg-border)] flex gap-2' },
        cardActions
          .filter((a) => !a.hidden || !a.hidden(contact))
          .map((action, i) =>
            React.createElement(
              'button',
              {
                key: i,
                onClick: (e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  action.onClick(contact);
                },
                className: `px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  action.variant === 'destructive'
                    ? 'text-[var(--cg-danger)] border border-[var(--cg-danger)] hover:bg-[var(--cg-danger-bg)]'
                    : 'text-[var(--cg-text)] border border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)]'
                }`,
              },
              action.label
            )
          )
      )
  );
}
