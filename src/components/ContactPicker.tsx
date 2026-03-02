/**
 * Selector/buscador de contacto.
 * Usa UI.Combobox (Anchor-based, sin toggle) para evitar conflictos
 * entre onFocus y el click handler de Radix Trigger.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import { useContacts } from '../hooks/useContacts.js';
import { formatType } from '../lib/formatType.js';
import type { ContactPickerProps } from '../types/components.js';

const React = getHostReact();
const UI = getHostUI();
const { useCallback, useEffect } = React;

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

  const { contact: selectedContact } = useContact(value);
  const { data, loading, search: searchContacts } = useContacts({ ...filters, pageSize: 10 });

  const handleValueChange = useCallback(
    (newValue: string) => {
      if (!newValue) {
        onChange?.(null);
        return;
      }
      const contact = data.find((c: { id: string }) => c.id === newValue);
      if (contact) {
        onChange?.(contact as unknown as Parameters<NonNullable<typeof onChange>>[0]);
      }
    },
    [data, onChange]
  );

  return React.createElement(
    UI.Combobox,
    {
      value: value ?? '',
      onValueChange: handleValueChange,
      debounceMs: 300,
    },

    // Trigger
    React.createElement(UI.ComboboxChipTrigger, {
      placeholder,
      className: disabled ? `pointer-events-none opacity-60 ${className}` : className,
      renderChip: (_val: string, onRemove: () => void) =>
        React.createElement(
          UI.Chip,
          {
            size: 'sm',
            icon: selectedContact
              ? React.createElement(UI.Avatar, { name: selectedContact.name, size: 'xs' })
              : undefined,
            onRemove: disabled ? undefined : onRemove,
          },
          selectedContact?.name ?? '...'
        ),
    }),

    // Dropdown (usa contexto Combobox para sincronizar búsqueda)
    React.createElement(ContactDropdown, {
      data,
      loading,
      searchFn: searchContacts,
      allowCreate,
      onCreateClick,
    })
  );
}

// ---------------------------------------------------------------------------
// Componente interno que accede al contexto del Combobox
// para sincronizar la búsqueda con el server y renderizar resultados.
// ---------------------------------------------------------------------------

interface ContactDropdownProps {
  data: Array<{
    id: string;
    name: string;
    type: string;
    phone: string | null;
    email: string | null;
  }>;
  loading: boolean;
  searchFn: (q: string) => void;
  allowCreate: boolean;
  onCreateClick?: (query: string) => void;
}

function ContactDropdown(props: ContactDropdownProps) {
  const { data, loading, searchFn, allowCreate, onCreateClick } = props;
  const { search, debouncedSearch, setOpen } = UI.useComboboxContext();

  // Sincronizar búsqueda debounced del Combobox → server
  useEffect(() => {
    searchFn(debouncedSearch);
  }, [debouncedSearch, searchFn]);

  return React.createElement(
    UI.ComboboxContent,
    { className: 'max-h-[240px] overflow-y-auto' },

    loading
      ? React.createElement(UI.LoadingOverlay, {
          variant: 'dots',
          label: 'Buscando...',
          inline: true,
          className: 'justify-center py-4',
        })
      : data.length === 0
        ? React.createElement(
            UI.ComboboxEmpty,
            null,
            search ? 'Sin resultados' : 'Escribí para buscar'
          )
        : React.createElement(
            UI.ComboboxGroup,
            null,
            data.map(
              (contact: {
                id: string;
                name: string;
                type: string;
                phone: string | null;
                email: string | null;
              }) =>
                React.createElement(
                  UI.ComboboxItem,
                  {
                    key: contact.id,
                    value: contact.id,
                    icon: React.createElement(UI.Avatar, {
                      name: contact.name,
                      size: 'sm',
                    }),
                    subtitle:
                      [contact.phone, contact.email].filter(Boolean).join(' · ') ||
                      formatType(contact.type),
                  },
                  contact.name
                )
            )
          ),

    allowCreate &&
      React.createElement(UI.ComboboxCreate, {
        onCreate: (searchValue: string) => {
          onCreateClick?.(searchValue);
          setOpen(false);
        },
        label: 'Crear "{search}"',
      })
  );
}
