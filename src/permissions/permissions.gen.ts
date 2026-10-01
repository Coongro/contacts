// Generado por el Coongro Builder desde contributes.permissions. No editar a mano.

export const ContactsPermissions = {
  /** Eliminar contactos definitivamente */
  delete: 'contacts.delete',
  /** Gestionar contactos */
  manage: 'contacts.manage',
  /** Ver contactos */
  read: 'contacts.read',
} as const;

export type ContactsPermission = (typeof ContactsPermissions)[keyof typeof ContactsPermissions];
