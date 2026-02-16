/**
 * Selector/buscador de contacto.
 * Dropdown con búsqueda inline para vincular un contacto.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import { useContacts } from '../hooks/useContacts.js';
import type { ContactPickerProps } from '../types/components.js';

const React = getHostReact();
const { useState, useCallback, useRef, useEffect } = React;

export function ContactPicker(props: ContactPickerProps) {
  const {
    filters = {},
    value,
    onChange,
    placeholder = 'Buscar contacto...',
    allowCreate = false,
    onCreateClick,
    disabled = false,
    className = '',
  } = props;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading, search } = useContacts({ ...filters, pageSize: 10 });
  const { contact: selectedContact } = useContact(value);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(
    (e: { target: { value: string } }) => {
      const val = e.target.value;
      setQuery(val);
      search(val);
    },
    [search]
  );

  const handleSelect = useCallback(
    (contact: {
      id: string;
      name: string;
      type: string;
      phone: string | null;
      email: string | null;
    }) => {
      onChange?.(contact as unknown as Parameters<NonNullable<typeof onChange>>[0]);
      setOpen(false);
      setQuery('');
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange?.(null);
    setQuery('');
  }, [onChange]);

  return React.createElement(
    'div',
    { ref: containerRef, className: `relative ${className}` },

    // Input / selected display
    value && selectedContact
      ? React.createElement(
          'div',
          {
            className:
              'flex items-center gap-2 h-9 px-3 rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)]',
          },
          // Avatar
          React.createElement(
            'div',
            {
              className:
                'flex items-center justify-center w-6 h-6 rounded-full bg-[var(--cg-accent)] text-[var(--cg-text-inverse)] text-xs font-medium',
            },
            selectedContact.name.charAt(0).toUpperCase()
          ),
          React.createElement(
            'span',
            { className: 'flex-1 text-sm text-[var(--cg-text)] truncate' },
            selectedContact.name
          ),
          !disabled &&
            React.createElement(
              'button',
              {
                type: 'button',
                onClick: handleClear,
                className:
                  'p-1 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
              },
              React.createElement(
                'svg',
                {
                  width: 14,
                  height: 14,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
              )
            )
        )
      : React.createElement('input', {
          type: 'text',
          value: query,
          onChange: handleSearch,
          onFocus: () => setOpen(true),
          placeholder,
          disabled,
          className:
            'w-full h-9 px-3 text-sm rounded-lg border border-[var(--cg-input-border)] bg-[var(--cg-input-bg)] text-[var(--cg-text)] placeholder:text-[var(--cg-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--cg-border-focus)] disabled:opacity-50',
        }),

    // Dropdown
    open &&
      React.createElement(
        'div',
        {
          className:
            'absolute z-50 top-full mt-1 w-full max-h-[240px] overflow-y-auto rounded-lg border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-lg',
        },
        loading
          ? React.createElement(
              'div',
              { className: 'p-4 text-center text-sm text-[var(--cg-text-muted)]' },
              'Buscando...'
            )
          : data.length === 0
            ? React.createElement(
                'div',
                { className: 'p-4 text-center text-sm text-[var(--cg-text-muted)]' },
                query ? 'Sin resultados' : 'Escribí para buscar'
              )
            : data.map((contact) =>
                React.createElement(
                  'button',
                  {
                    key: contact.id,
                    type: 'button',
                    onClick: () => handleSelect(contact),
                    className:
                      'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--cg-bg-hover)] transition-colors',
                  },
                  // Avatar
                  React.createElement(
                    'div',
                    {
                      className:
                        'flex items-center justify-center w-8 h-8 rounded-full bg-[var(--cg-accent-bg)] text-[var(--cg-accent)] text-xs font-medium flex-shrink-0',
                    },
                    contact.name.charAt(0).toUpperCase()
                  ),
                  React.createElement(
                    'div',
                    { className: 'flex flex-col min-w-0' },
                    React.createElement(
                      'span',
                      { className: 'text-sm text-[var(--cg-text)] truncate' },
                      contact.name
                    ),
                    React.createElement(
                      'span',
                      { className: 'text-xs text-[var(--cg-text-muted)] truncate' },
                      [contact.phone, contact.email].filter(Boolean).join(' · ') || contact.type
                    )
                  )
                )
              ),
        allowCreate &&
          query &&
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                onCreateClick?.(query);
                setOpen(false);
              },
              className:
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--cg-accent)] border-t border-[var(--cg-border)] hover:bg-[var(--cg-bg-hover)] transition-colors',
            },
            React.createElement(
              'svg',
              {
                width: 14,
                height: 14,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 2,
              },
              React.createElement('path', { d: 'M12 5v14M5 12h14' })
            ),
            `Crear "${query}"`
          )
      )
  );
}
