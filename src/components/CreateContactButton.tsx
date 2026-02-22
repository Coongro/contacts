/**
 * Botón para crear contacto. Abre un FormDialog con ContactForm.
 */
import { getHostReact, getHostUI } from '@coongro/plugin-sdk';

import type { CreateContactButtonProps } from '../types/components.js';
import type { Contact } from '../types/contact.js';

import { ContactForm } from './ContactForm.js';

const React = getHostReact();
const UI = getHostUI();
const { useState, useCallback } = React;

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

    // Botón
    React.createElement(
      UI.Button,
      {
        type: 'button',
        variant: isPrimary ? 'brand' : 'outline',
        onClick: () => setOpen(true),
        className: `gap-2 ${className}`,
      },
      React.createElement(UI.DynamicIcon, { icon: 'Plus', size: 20 }),
      label
    ),

    // Modal
    React.createElement(
      UI.FormDialog,
      {
        open,
        onOpenChange: setOpen,
        title: label,
        size: 'md',
      },
      React.createElement(ContactForm, {
        defaults,
        extraFields,
        onSuccess: handleSuccess,
        onCancel: () => setOpen(false),
      })
    )
  );
}
