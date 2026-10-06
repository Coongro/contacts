/**
 * Selector/buscador de contacto.
 * Usa UI.Combobox (Anchor-based, sin toggle) para evitar conflictos
 * entre onFocus y el click handler de Radix Trigger.
 */
import {
  Avatar,
  Chip,
  Combobox,
  ComboboxChipTrigger,
  ComboboxContent,
  ComboboxCreate,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  LoadingOverlay,
  useComboboxContext,
} from '@coongro/ui-components';
import { useCallback, useEffect } from 'react';
import type { ReactElement } from 'react';

import { useContact } from '../hooks/useContact.js';
import { useContacts } from '../hooks/useContacts.js';
import { formatType } from '../lib/formatType.js';
import type { ContactPickerProps } from '../types/components.js';

export function ContactPicker(props: ContactPickerProps): ReactElement {
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
      const contact = data.find((c) => c.id === newValue);
      if (contact) {
        onChange?.(contact);
      }
    },
    [data, onChange]
  );

  return (
    <Combobox value={value ?? ''} onValueChange={handleValueChange} debounceMs={300}>
      {/* Trigger */}
      <ComboboxChipTrigger
        placeholder={placeholder}
        className={disabled ? `pointer-events-none opacity-60 ${className}` : className}
        renderChip={(_val: string, onRemove: () => void) => (
          <Chip
            size="sm"
            icon={selectedContact ? <Avatar name={selectedContact.name} size="xs" /> : undefined}
            onRemove={disabled ? undefined : onRemove}
          >
            {selectedContact?.name ?? '...'}
          </Chip>
        )}
      />

      {/* Dropdown (usa contexto Combobox para sincronizar búsqueda) */}
      <ContactDropdown
        data={data}
        loading={loading}
        searchFn={searchContacts}
        allowCreate={allowCreate}
        onCreateClick={onCreateClick}
      />
    </Combobox>
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

function ContactDropdown(props: ContactDropdownProps): ReactElement {
  const { data, loading, searchFn, allowCreate, onCreateClick } = props;
  const { search, debouncedSearch, setOpen } = useComboboxContext();

  // Sincronizar búsqueda debounced del Combobox → server
  useEffect(() => {
    searchFn(debouncedSearch);
  }, [debouncedSearch, searchFn]);

  let results: ReactElement;
  if (loading) {
    results = (
      <LoadingOverlay variant="dots" label="Buscando..." inline className="justify-center py-4" />
    );
  } else if (data.length === 0) {
    results = <ComboboxEmpty>{search ? 'Sin resultados' : 'Escribí para buscar'}</ComboboxEmpty>;
  } else {
    results = (
      <ComboboxGroup>
        {data.map((contact) => (
          <ComboboxItem
            key={contact.id}
            value={contact.id}
            icon={<Avatar name={contact.name} size="sm" />}
            subtitle={
              [contact.phone, contact.email].filter(Boolean).join(' · ') || formatType(contact.type)
            }
          >
            {contact.name}
          </ComboboxItem>
        ))}
      </ComboboxGroup>
    );
  }

  return (
    <ComboboxContent className="max-h-[240px] overflow-y-auto">
      {results}
      {allowCreate && (
        <ComboboxCreate
          onCreate={(searchValue: string) => {
            onCreateClick?.(searchValue);
            setOpen(false);
          }}
          label={'Crear "{search}"'}
        />
      )}
    </ComboboxContent>
  );
}
