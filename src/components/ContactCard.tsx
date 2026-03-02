/**
 * Tarjeta resumen de un contacto.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import { formatType } from '../lib/formatType.js';
import type { ContactCardProps } from '../types/components.js';
import type { Contact } from '../types/contact.js';

const React = getHostReact();
const UI = getHostUI();

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
      UI.Card,
      { className: `p-4 ${className}` },
      React.createElement(
        'div',
        { className: 'flex items-center gap-3' },
        React.createElement(UI.Skeleton, { className: 'w-8 h-8 rounded-full' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-1.5 flex-1' },
          React.createElement(UI.Skeleton, { className: 'h-4 w-32' }),
          React.createElement(UI.Skeleton, { className: 'h-3 w-20' })
        )
      )
    );
  }

  if (!contact) {
    return React.createElement(
      UI.Card,
      { className: `p-4 ${className}` },
      React.createElement(UI.EmptyState, { title: 'Contacto no encontrado' })
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
    UI.Card,
    {
      className: `p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-cg-accent hover:shadow-sm' : ''
      } ${className}`,
      onClick: onClick ? () => onClick(contact) : undefined,
    },

    // Header: avatar + nombre + tipo
    React.createElement(
      'div',
      { className: 'flex items-center gap-3' },
      React.createElement(UI.Avatar, { name: contact.name, size: 'sm' }),
      React.createElement(
        'div',
        { className: 'flex flex-col min-w-0 flex-1' },
        React.createElement(
          'span',
          { className: 'text-sm font-medium text-cg-text truncate' },
          contact.name
        ),
        React.createElement(
          'span',
          { className: 'text-xs text-cg-text-muted' },
          formatType(contact.type)
        )
      ),
      // Badge activo/inactivo
      React.createElement(
        UI.Badge,
        {
          variant: contact.is_active ? 'success-soft' : 'secondary',
          size: 'sm',
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
              { className: 'text-cg-text-muted w-20 flex-shrink-0' },
              fieldLabels[field] ?? field
            ),
            React.createElement('span', { className: 'text-cg-text truncate' }, String(value))
          );
        })
      ),

    // Extra info del bloque
    extraInfo &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(UI.Separator, { className: 'mt-3' }),
        React.createElement('div', { className: 'mt-3' }, extraInfo as React.ReactNode)
      ),

    // Acciones
    cardActions.length > 0 &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement(UI.Separator, { className: 'mt-3' }),
        React.createElement(
          'div',
          { className: 'mt-3 flex gap-2' },
          cardActions
            .filter((a) => !a.hidden || !a.hidden(contact))
            .map((action, i) =>
              React.createElement(
                UI.Button,
                {
                  key: i,
                  variant: action.variant === 'destructive' ? 'destructive' : 'outline',
                  size: 'xs',
                  onClick: (e: { stopPropagation: () => void }) => {
                    e.stopPropagation();
                    action.onClick(contact);
                  },
                },
                action.label
              )
            )
        )
      )
  );
}
