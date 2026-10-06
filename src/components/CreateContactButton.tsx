/**
 * Botón para crear contacto. Abre un FormDialogSubmit con ContactForm.
 */
import { Button, DynamicIcon, FormDialogSubmit } from '@coongro/ui-components';
import { useCallback, useState } from 'react';
import type { ReactElement } from 'react';

import type { CreateContactButtonProps } from '../types/components.js';
import type { Contact } from '../types/contact.js';

import { ContactForm } from './ContactForm.js';

export function CreateContactButton(props: CreateContactButtonProps): ReactElement {
  const {
    defaults = {},
    label = 'Nuevo contacto',
    submitLabel = 'Crear contacto',
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

  return (
    <>
      {/* Botón */}
      <Button
        type="button"
        variant={isPrimary ? 'brand' : 'outline'}
        onClick={() => setOpen(true)}
        className={`gap-2 ${className}`}
      >
        <DynamicIcon icon="Plus" size={20} />
        {label}
      </Button>

      {/* Modal con footer sticky vía FormDialogSubmit */}
      <FormDialogSubmit
        open={open}
        onOpenChange={setOpen}
        title={label}
        size="md"
        submitLabel={submitLabel}
        onCancel={() => setOpen(false)}
        disabled={saving}
      >
        {({ formRef }) => (
          <ContactForm
            defaults={defaults}
            extraFields={extraFields}
            onSuccess={handleSuccess}
            formRef={formRef}
            hideActions
            onSavingChange={setSaving}
          />
        )}
      </FormDialogSubmit>
    </>
  );
}
