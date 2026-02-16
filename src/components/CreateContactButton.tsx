/**
 * Botón para crear contacto. Abre un modal con ContactForm.
 */
import { getHostReact } from '@coongro/plugin-sdk';

import type { CreateContactButtonProps } from '../types/components.js';
import type { Contact } from '../types/contact.js';

import { ContactForm } from './ContactForm.js';

const React = getHostReact();
const { useState, useCallback, useEffect } = React;

export function CreateContactButton(props: CreateContactButtonProps) {
  const {
    defaults = {},
    label = 'Nuevo contacto',
    extraFields = [],
    onSuccess,
    variant = 'primary',
    className = '',
  } = props;

  const [open, setOpen] = useState(false);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open]);

  const handleSuccess = useCallback(
    (contact: Contact) => {
      setOpen(false);
      onSuccess?.(contact);
    },
    [onSuccess]
  );

  const isPrimary = variant === 'primary';

  return React.createElement(
    React.Fragment,
    null,

    // Botón (diseño StatCard button style)
    React.createElement(
      'button',
      {
        type: 'button',
        onClick: () => setOpen(true),
        className: `flex items-center justify-center gap-2 h-[59px] rounded-lg text-xl font-bold transition-colors ${
          isPrimary
            ? 'bg-[#FFC633] text-black hover:bg-[#e6b22e]'
            : 'border border-[var(--cg-border)] text-[var(--cg-text)] hover:bg-[var(--cg-bg-hover)]'
        } ${className}`,
      },
      // Plus icon
      React.createElement(
        'svg',
        {
          width: 20,
          height: 20,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 2.5,
        },
        React.createElement('path', { d: 'M12 5v14M5 12h14' })
      ),
      label
    ),

    // Modal
    open &&
      React.createElement(
        'div',
        {
          className: 'fixed inset-0 z-[300] flex items-center justify-center',
          onClick: (e: { target: any; currentTarget: any }) => {
            if (e.target === e.currentTarget) setOpen(false);
          },
        },
        // Overlay
        React.createElement('div', {
          className: 'absolute inset-0 bg-[var(--cg-bg-overlay)]',
        }),
        // Content
        React.createElement(
          'div',
          {
            className:
              'relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-[var(--cg-border)] bg-[var(--cg-bg)] shadow-xl animate-in fade-in-0 zoom-in-95',
          },
          // Header
          React.createElement(
            'div',
            {
              className:
                'flex items-center justify-between px-6 py-4 border-b border-[var(--cg-border)]',
            },
            React.createElement(
              'h2',
              { className: 'text-lg font-semibold text-[var(--cg-text)]' },
              label
            ),
            React.createElement(
              'button',
              {
                onClick: () => setOpen(false),
                className:
                  'p-1.5 rounded-md text-[var(--cg-text-muted)] hover:bg-[var(--cg-bg-hover)]',
              },
              React.createElement(
                'svg',
                {
                  width: 18,
                  height: 18,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                },
                React.createElement('path', { d: 'M18 6L6 18M6 6l12 12' })
              )
            )
          ),
          // Form
          React.createElement(
            'div',
            { className: 'p-6' },
            React.createElement(ContactForm, {
              defaults,
              extraFields,
              onSuccess: handleSuccess,
              onCancel: () => setOpen(false),
            })
          )
        )
      )
  );
}
