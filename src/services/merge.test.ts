import { describe, expect, it } from 'vitest';

import type { ContactRow } from '../schema/contact.js';

import { assertMergeable, buildMergePatch } from './merge.js';

function contact(overrides: Partial<ContactRow>): ContactRow {
  return {
    id: 'x',
    type: 'person',
    kind: 'person',
    name: 'Sin nombre',
    first_name: null,
    last_name: null,
    job_title: null,
    organization_id: null,
    phone: null,
    email: null,
    additional_phones: [],
    additional_emails: [],
    website: null,
    linkedin: null,
    document_type: null,
    document_number: null,
    address: null,
    address_street: null,
    address_city: null,
    address_state: null,
    address_postcode: null,
    address_country: null,
    owner_staff_id: null,
    notes: null,
    avatar_url: null,
    tags: null,
    metadata: null,
    is_active: true,
    merged_into_id: null,
    phone_normalized: null,
    deleted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildMergePatch', () => {
  const winner = contact({
    id: 'w',
    name: 'Hernán Giménez',
    email: 'hernan@empresa.com',
    phone: null,
    job_title: 'Socio',
    tags: ['cliente'],
  });
  const older = contact({
    id: 'a',
    name: 'Hernan Gimenez',
    email: 'hgimenez@gmail.com',
    phone: '0358 15 411-1111',
    job_title: 'Gerente',
    tags: ['Cliente', 'mayorista'],
    updated_at: '2026-02-01T00:00:00Z',
  });
  const newer = contact({
    id: 'b',
    name: 'H. Giménez',
    phone: '+54 9 358 422-2222',
    additional_emails: ['hernan@empresa.com', 'otro@x.com'],
    address_city: 'Río Cuarto',
    updated_at: '2026-03-01T00:00:00Z',
  });

  it('gana el valor del prioritario y lo vacío se completa con el perdedor más reciente', () => {
    const patch = buildMergePatch(winner, [older, newer]);
    expect(patch.name).toBeUndefined();
    expect(patch.job_title).toBeUndefined();
    expect(patch.phone).toBe('+54 9 358 422-2222');
    expect(patch.address_city).toBe('Río Cuarto');
  });

  it('une emails y teléfonos sin repetir ni duplicar el principal', () => {
    const patch = buildMergePatch(winner, [older, newer]);
    expect(patch.additional_emails).toEqual(['hgimenez@gmail.com', 'otro@x.com']);
    expect(patch.additional_phones).toEqual(['0358 15 411-1111']);
  });

  it('une etiquetas sin distinguir mayúsculas', () => {
    expect(buildMergePatch(winner, [older]).tags).toEqual(['cliente', 'mayorista']);
  });

  it('respeta el registro elegido por campo', () => {
    const patch = buildMergePatch(winner, [older, newer], { job_title: 'a', email: 'a' });
    expect(patch.job_title).toBe('Gerente');
    expect(patch.email).toBe('hgimenez@gmail.com');
    expect(patch.additional_emails).toContain('hernan@empresa.com');
    expect(patch.additional_emails).not.toContain('hgimenez@gmail.com');
  });

  it('rechaza elegir un registro que no es parte de la fusión', () => {
    expect(() => buildMergePatch(winner, [older], { email: 'otro' })).toThrow();
  });
});

describe('assertMergeable', () => {
  const winner = contact({ id: 'w' });
  it('pide al menos un perdedor y que existan todos', () => {
    expect(() => assertMergeable(winner, [], [])).toThrow();
    expect(() => assertMergeable(winner, [], ['a'])).toThrow();
  });
  it('no mezcla personas con organizaciones', () => {
    expect(() =>
      assertMergeable(winner, [contact({ id: 'o', kind: 'organization' })], ['o'])
    ).toThrow(/persona con una organización/);
  });
  it('no fusiona un registro consigo mismo ni uno ya fusionado', () => {
    expect(() => assertMergeable(winner, [winner], ['w'])).toThrow();
    expect(() =>
      assertMergeable(winner, [contact({ id: 'a', merged_into_id: 'z' })], ['a'])
    ).toThrow();
  });
  it('acepta una fusión válida', () => {
    expect(() => assertMergeable(winner, [contact({ id: 'a' })], ['a'])).not.toThrow();
  });
});
