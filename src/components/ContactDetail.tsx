/**
 * Vista detallada de un contacto con secciones extensibles.
 * Rediseño 2026-06 (COONG-208) — card de identidad con riel de datos de contacto,
 * banner de inactivo y secciones inyectables (ej. mascotas + datos veterinarios
 * desde @coongro/patients). Reutiliza ui-components + tokens cg-* (dark mode auto).
 */
import { useFormat } from '@coongro/plugin-sdk';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Chip,
  DynamicIcon,
  ErrorDisplay,
  Skeleton,
} from '@coongro/ui-components';
import type { ReactElement, ReactNode } from 'react';

import { useContact } from '../hooks/useContact.js';
import { formatType } from '../lib/formatType.js';
import type { ContactDetailProps } from '../types/components.js';

/** Título serif (Noto Serif JP, weight 900) */
const SERIF = 'font-serif font-black tracking-tight';

/** Eyebrow uppercase reutilizable */
function Eyebrow({
  text,
  className = 'text-cg-text-muted',
}: {
  text: string;
  className?: string;
}): ReactElement {
  return (
    <div className={`text-[11px] font-bold uppercase tracking-[0.08em] ${className}`}>{text}</div>
  );
}

export function ContactDetail(props: ContactDetailProps): ReactElement {
  const {
    contactId,
    extraSections = [],
    extraActions = [],
    onEdit,
    onDelete,
    className = '',
  } = props;

  const { contact, loading, error, refetch } = useContact(contactId);
  const format = useFormat();

  if (loading) {
    return (
      <div className={`flex flex-col gap-6 ${className}`}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !contact) {
    return (
      <ErrorDisplay
        title="Contacto no encontrado"
        message={error ?? undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  const typeLabel = formatType(contact.type);
  const initials =
    contact.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join('') || '?';

  const contactFields = [
    { icon: 'Phone', label: 'Teléfono', value: contact.phone },
    { icon: 'Mail', label: 'Email', value: contact.email },
    { icon: 'MapPin', label: 'Dirección', value: contact.address },
    {
      icon: 'IdCard',
      label: 'Documento',
      mono: true,
      value: contact.document_number
        ? `${contact.document_type ?? ''} ${contact.document_number}`.trim()
        : null,
    },
  ].filter((f) => f.value);

  const sortedSections = [...extraSections].sort((a, b) => (a.order ?? 50) - (b.order ?? 50));

  // ── Action bar (editar / eliminar / extras) ──
  const actionBar = (onEdit || onDelete || extraActions.length > 0) && (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      {extraActions
        .filter((a) => !a.hidden || !a.hidden(contact))
        .map((action, i) => (
          <Button
            key={`xa-${i}`}
            variant="outline"
            size="sm"
            onClick={() => action.onClick(contact)}
          >
            {action.label}
          </Button>
        ))}
      {onEdit && (
        <Button variant="outline" size="sm" onClick={() => onEdit(contact)} className="gap-1.5">
          <DynamicIcon icon="Pencil" size={14} />
          Editar
        </Button>
      )}
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(contact)}
          className="gap-1.5"
        >
          <DynamicIcon icon="Trash2" size={14} />
          Eliminar
        </Button>
      )}
    </div>
  );

  // ── Banner de inactivo ──
  const inactiveBanner = !contact.is_active && (
    <div className="flex items-center gap-3.5 rounded-xl px-5 py-3.5 bg-cg-neutral-950 text-cg-white">
      <DynamicIcon icon="ShieldOff" size={18} />
      <div className="text-sm font-medium">
        <strong className="uppercase tracking-wide text-[11px] mr-2 font-bold">
          Contacto inactivo
        </strong>
        {
          'No recibe recordatorios automáticos ni campañas. Reactivalo para volver a operarlo con normalidad.'
        }
      </div>
    </div>
  );

  // ── Card de identidad + riel de contacto ──
  const identityCard = (
    <Card className={`p-0 overflow-hidden ${contact.is_active ? '' : 'opacity-90'}`}>
      <div className="flex items-center gap-6 px-7 py-6">
        <span
          className={`w-24 h-24 rounded-2xl flex-shrink-0 inline-flex items-center justify-center bg-cg-text text-cg-text-inverse ${SERIF} text-3xl ${
            contact.is_active ? '' : 'grayscale'
          }`}
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <Eyebrow text={typeLabel} className="text-cg-text-muted mb-1.5" />
          <h1 className={`${SERIF} text-3xl leading-none m-0`}>{contact.name}</h1>
          <div className="mt-3">
            <Badge variant={contact.is_active ? 'success-soft' : 'secondary'} size="sm">
              {contact.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </div>
      {contactFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-7 py-5 border-t border-cg-border bg-cg-bg-hover">
          {contactFields.map((f) => (
            <div key={f.label} className="flex gap-3 items-start">
              <span className="w-8 h-8 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-surface border border-cg-border text-cg-text-muted">
                <DynamicIcon icon={f.icon} size={15} />
              </span>
              <div className="min-w-0">
                <Eyebrow text={f.label} className="text-cg-text-muted mb-1" />
                <div
                  className={`text-sm text-cg-text break-words ${f.mono ? 'font-mono tracking-wide' : ''}`}
                >
                  {f.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  // ── Notas ──
  const notesCard = contact.notes && (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 pt-4 pb-1">
        <DynamicIcon icon="StickyNote" size={14} className="text-cg-text-muted" />
        <Eyebrow text="Notas" className="text-cg-text-muted" />
      </div>
      <p className="m-0 px-5 pb-5 text-sm leading-relaxed text-cg-text-secondary whitespace-pre-wrap">
        {contact.notes}
      </p>
    </Card>
  );

  // ── Tags ──
  const tagsRow = contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {contact.tags.map((tag: string) => (
        <Chip key={tag}>{tag}</Chip>
      ))}
    </div>
  );

  // ── Secciones inyectadas (ej. mascotas + datos vet) ──
  const sections = sortedSections.map((section, i) => (
    <Card key={i}>
      <CardHeader>
        <CardTitle>{section.title}</CardTitle>
      </CardHeader>
      <CardBody>{section.render() as ReactNode}</CardBody>
    </Card>
  ));

  // ── Metadata ──
  const metaFooter = (
    <div className="px-1 text-[11px] leading-relaxed text-cg-text-muted">
      <div>{`Alta del contacto · ${format.date(contact.created_at)}`}</div>
      <div>{`Última modificación · ${format.date(contact.updated_at)}`}</div>
    </div>
  );

  return (
    <div className={`flex flex-col gap-3.5 ${className}`}>
      {actionBar}
      {inactiveBanner}
      {identityCard}
      {tagsRow}
      {sections}
      {notesCard}
      {metaFooter}
    </div>
  );
}
