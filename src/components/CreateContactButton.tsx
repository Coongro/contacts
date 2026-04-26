/**
 * Botón para crear contacto. Abre un FormDialogSubmit con ContactForm.
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
  const [saving, setSaving] = useState(false);

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

    // Modal con footer sticky vía FormDialogSubmit
    React.createElement(UI.FormDialogSubmit, {
      open,
      onOpenChange: setOpen,
      title: label,
      size: 'md',
      submitLabel: 'Crear contacto',
      onCancel: () => setOpen(false),
      disabled: saving,
      children: ({ formRef }: { formRef: React.RefObject<HTMLFormElement> }) =>
        React.createElement(ContactForm, {
          defaults,
          extraFields,
          onSuccess: handleSuccess,
          formRef,
          hideActions: true,
          onSavingChange: setSaving,
        }),
    })
  );
}
