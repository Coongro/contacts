/**
 * Tarjeta resumen de un contacto.
 */
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Separator,
  Skeleton,
} from '@coongro/ui-components';
import type { ReactElement, ReactNode } from 'react';

import { useContact } from '../hooks/useContact.js';
import { formatType } from '../lib/formatType.js';
import type { ContactCardProps } from '../types/components.js';
import type { Contact } from '../types/contact.js';

const DEFAULT_SHOW_FIELDS: Array<keyof Contact> = ['phone', 'email', 'address'];

const FIELD_LABELS: Record<string, string> = {
  phone: 'Teléfono',
  email: 'Email',
  address: 'Dirección',
  document_number: 'Documento',
  notes: 'Notas',
};

export function ContactCard(props: ContactCardProps): ReactElement {
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
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col gap-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  if (!contact) {
    return (
      <Card className={`p-4 ${className}`}>
        <EmptyState title="Contacto no encontrado" />
      </Card>
    );
  }

  return (
    <Card
      className={`p-4 transition-colors ${
        onClick ? 'cursor-pointer hover:border-cg-accent hover:shadow-sm' : ''
      } ${className}`}
      onClick={onClick ? () => onClick(contact) : undefined}
    >
      {/* Header: avatar + nombre + tipo */}
      <div className="flex items-center gap-3">
        <Avatar name={contact.name} size="sm" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-cg-text truncate">{contact.name}</span>
          <span className="text-xs text-cg-text-muted">{formatType(contact.type)}</span>
        </div>
        {/* Badge activo/inactivo */}
        <Badge variant={contact.is_active ? 'success-soft' : 'secondary'} size="sm">
          {contact.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Campos */}
      {showFields.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {showFields.map((field) => {
            const value = contact[field];
            if (!value) return null;
            return (
              <div key={field} className="flex items-center gap-2 text-xs">
                <span className="text-cg-text-muted w-20 flex-shrink-0">
                  {FIELD_LABELS[field] ?? field}
                </span>
                <span className="text-cg-text truncate">{String(value)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Extra info del bloque */}
      {extraInfo ? (
        <>
          <Separator className="mt-3" />
          <div className="mt-3">{extraInfo as ReactNode}</div>
        </>
      ) : null}

      {/* Acciones */}
      {cardActions.length > 0 && (
        <>
          <Separator className="mt-3" />
          <div className="mt-3 flex gap-2">
            {cardActions
              .filter((a) => !a.hidden || !a.hidden(contact))
              .map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                  size="xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(contact);
                  }}
                >
                  {action.label}
                </Button>
              ))}
          </div>
        </>
      )}
    </Card>
  );
}
