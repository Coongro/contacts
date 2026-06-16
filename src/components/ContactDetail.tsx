/**
 * Vista detallada de un contacto con secciones extensibles.
 * Rediseño 2026-06 (COONG-208) — card de identidad con riel de datos de contacto,
 * banner de inactivo y secciones inyectables (ej. mascotas + datos veterinarios
 * desde @coongro/patients). Reutiliza ui-components + tokens cg-* (dark mode auto).
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import { useContact } from '../hooks/useContact.js';
import { formatType } from '../lib/formatType.js';
import type { ContactDetailProps } from '../types/components.js';

const React = getHostReact();
const UI = getHostUI();

/** Título serif (Noto Serif JP, weight 900) */
const SERIF = 'font-serif font-black tracking-tight';

/** Eyebrow uppercase reutilizable */
function eyebrow(text: string, className = 'text-cg-text-muted') {
  return React.createElement(
    'div',
    { className: `text-[11px] font-bold uppercase tracking-[0.08em] ${className}` },
    text
  );
}

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
        React.createElement(UI.Skeleton, { className: 'w-24 h-24 rounded-2xl' }),
        React.createElement(
          'div',
          { className: 'flex flex-col gap-2' },
          React.createElement(UI.Skeleton, { className: 'h-8 w-48' }),
          React.createElement(UI.Skeleton, { className: 'h-4 w-24' })
        )
      ),
      ...Array.from({ length: 3 }).map((_, i) =>
        React.createElement(UI.Skeleton, { key: i, className: 'h-10 rounded-lg' })
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
  const actionBar =
    (onEdit || onDelete || extraActions.length > 0) &&
    React.createElement(
      'div',
      { className: 'flex items-center justify-end gap-2 flex-wrap' },
      ...extraActions
        .filter((a) => !a.hidden || !a.hidden(contact))
        .map((action, i) =>
          React.createElement(
            UI.Button,
            {
              key: `xa-${i}`,
              variant: 'outline',
              size: 'sm',
              onClick: () => action.onClick(contact),
            },
            action.label
          )
        ),
      onEdit &&
        React.createElement(
          UI.Button,
          { variant: 'outline', size: 'sm', onClick: () => onEdit(contact), className: 'gap-1.5' },
          React.createElement(UI.DynamicIcon, { icon: 'Pencil', size: 14 }),
          'Editar'
        ),
      onDelete &&
        React.createElement(
          UI.Button,
          {
            variant: 'destructive',
            size: 'sm',
            onClick: () => onDelete(contact),
            className: 'gap-1.5',
          },
          React.createElement(UI.DynamicIcon, { icon: 'Trash2', size: 14 }),
          'Eliminar'
        )
    );

  // ── Banner de inactivo ──
  const inactiveBanner =
    !contact.is_active &&
    React.createElement(
      'div',
      {
        className:
          'flex items-center gap-3.5 rounded-xl px-5 py-3.5 bg-cg-neutral-950 text-cg-white',
      },
      React.createElement(UI.DynamicIcon, { icon: 'ShieldOff', size: 18 }),
      React.createElement(
        'div',
        { className: 'text-sm font-medium' },
        React.createElement(
          'strong',
          { className: 'uppercase tracking-wide text-[11px] mr-2 font-bold' },
          'Contacto inactivo'
        ),
        'No recibe recordatorios automáticos ni campañas. Reactivalo para volver a operarlo con normalidad.'
      )
    );

  // ── Card de identidad + riel de contacto ──
  const identityCard = React.createElement(
    UI.Card,
    { className: `p-0 overflow-hidden ${contact.is_active ? '' : 'opacity-90'}` },
    React.createElement(
      'div',
      { className: 'flex items-center gap-6 px-7 py-6' },
      React.createElement(
        'span',
        {
          className: `w-24 h-24 rounded-2xl flex-shrink-0 inline-flex items-center justify-center bg-cg-text text-cg-text-inverse ${SERIF} text-3xl ${
            contact.is_active ? '' : 'grayscale'
          }`,
        },
        initials
      ),
      React.createElement(
        'div',
        { className: 'flex-1 min-w-0' },
        eyebrow(typeLabel, 'text-cg-text-muted mb-1.5'),
        React.createElement(
          'h1',
          { className: `${SERIF} text-3xl leading-none m-0` },
          contact.name
        ),
        React.createElement(
          'div',
          { className: 'mt-3' },
          React.createElement(
            UI.Badge,
            { variant: contact.is_active ? 'success-soft' : 'secondary', size: 'sm' },
            contact.is_active ? 'Activo' : 'Inactivo'
          )
        )
      )
    ),
    contactFields.length > 0 &&
      React.createElement(
        'div',
        {
          className:
            'grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-7 py-5 border-t border-cg-border bg-cg-bg-hover',
        },
        contactFields.map((f) =>
          React.createElement(
            'div',
            { key: f.label, className: 'flex gap-3 items-start' },
            React.createElement(
              'span',
              {
                className:
                  'w-8 h-8 rounded-md flex-shrink-0 inline-flex items-center justify-center bg-cg-surface border border-cg-border text-cg-text-muted',
              },
              React.createElement(UI.DynamicIcon, { icon: f.icon, size: 15 })
            ),
            React.createElement(
              'div',
              { className: 'min-w-0' },
              eyebrow(f.label, 'text-cg-text-muted mb-1'),
              React.createElement(
                'div',
                {
                  className: `text-sm text-cg-text break-words ${f.mono ? 'font-mono tracking-wide' : ''}`,
                },
                f.value
              )
            )
          )
        )
      )
  );

  // ── Notas ──
  const notesCard =
    contact.notes &&
    React.createElement(
      UI.Card,
      { className: 'p-0 overflow-hidden' },
      React.createElement(
        'div',
        { className: 'flex items-center gap-2.5 px-5 pt-4 pb-1' },
        React.createElement(UI.DynamicIcon, {
          icon: 'StickyNote',
          size: 14,
          className: 'text-cg-text-muted',
        }),
        eyebrow('Notas', 'text-cg-text-muted')
      ),
      React.createElement(
        'p',
        {
          className:
            'm-0 px-5 pb-5 text-sm leading-relaxed text-cg-text-secondary whitespace-pre-wrap',
        },
        contact.notes
      )
    );

  // ── Tags ──
  const tagsRow =
    contact.tags &&
    Array.isArray(contact.tags) &&
    contact.tags.length > 0 &&
    React.createElement(
      'div',
      { className: 'flex flex-wrap gap-1.5' },
      contact.tags.map((tag: string) => React.createElement(UI.Chip, { key: tag }, tag))
    );

  // ── Secciones inyectadas (ej. mascotas + datos vet) ──
  const sections = sortedSections.map((section, i) =>
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
  );

  // ── Metadata ──
  const metaFooter = React.createElement(
    'div',
    { className: 'px-1 text-[11px] leading-relaxed text-cg-text-muted' },
    React.createElement(
      'div',
      null,
      `Alta del contacto · ${new Date(contact.created_at).toLocaleDateString('es-AR')}`
    ),
    React.createElement(
      'div',
      null,
      `Última modificación · ${new Date(contact.updated_at).toLocaleDateString('es-AR')}`
    )
  );

  return React.createElement(
    'div',
    { className: `flex flex-col gap-3.5 ${className}` },
    actionBar,
    inactiveBanner,
    identityCard,
    tagsRow,
    ...sections,
    notesCard,
    metaFooter
  );
}
