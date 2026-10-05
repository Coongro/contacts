/**
 * Cliente tipado de las acciones de contacts. Args y resultado salen del
 * contrato de `actions.ts` (solo el tipo: nada del servidor llega al bundle).
 */
import { actionsOf } from '@coongro/plugin-sdk';

import type { ContactActions } from '../actions.js';

export const contactsClient = actionsOf<ContactActions>('contacts');
