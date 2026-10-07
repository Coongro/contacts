import {
  callAction,
  testContext,
  testDatabase,
  type TestDatabase,
} from '@coongro/plugin-sdk/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { contactActions } from './actions.js';

let db: TestDatabase;
const ORG = '00000000-0000-4000-8000-000000000001';

beforeAll(async () => {
  db = await testDatabase({ migrations: new URL('../drizzle/', import.meta.url) });
  const ctx = testContext({ db });
  await callAction(
    contactActions.bulkCreate,
    {
      data: [
        { id: ORG, type: 'client', kind: 'organization', name: 'Acme' },
        { type: 'client', name: 'Ana', organization_id: ORG, tags: ['vip'] },
        { type: 'client', name: 'Beto', organization_id: ORG },
        { type: 'supplier', name: 'Carla', tags: ['vip'] },
      ],
    },
    ctx
  );
});
afterAll(() => db.close());

describe('lecturas que exigen el id', () => {
  it('listByOrganization sin organizationId responde VALIDATION', async () => {
    await expect(
      callAction(contactActions.listByOrganization, {}, testContext({ db }))
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('listas paginadas', () => {
  it('list devuelve una página con el total', async () => {
    const page = await callAction<{ items: Array<{ name: string }>; total: number }>(
      contactActions.list,
      { limit: 2, orderBy: 'name' },
      testContext({ db })
    );
    expect(page.total).toBe(4);
    expect(page.items.map((c) => c.name)).toEqual(['Acme', 'Ana']);
  });

  it('list filtra por igualdad y busca por texto', async () => {
    const ctx = testContext({ db });
    const suppliers = await callAction<{ total: number }>(
      contactActions.list,
      { type: 'supplier' },
      ctx
    );
    expect(suppliers.total).toBe(1);
    const found = await callAction<{ total: number }>(contactActions.list, { search: 'bet' }, ctx);
    expect(found.total).toBe(1);
  });

  it('listByOrganization pagina las personas de la organización', async () => {
    const page = await callAction<{ items: Array<{ name: string }>; total: number }>(
      contactActions.listByOrganization,
      { organizationId: ORG, limit: 1 },
      testContext({ db })
    );
    expect(page.total).toBe(2);
    expect(page.items.map((c) => c.name)).toEqual(['Ana']);
  });

  it('findByTag pagina los contactos con la etiqueta', async () => {
    const page = await callAction<{ items: Array<{ name: string }>; total: number }>(
      contactActions.findByTag,
      { tag: 'vip' },
      testContext({ db })
    );
    expect(page.items.map((c) => c.name)).toEqual(['Ana', 'Carla']);
  });

  it('search acepta `query` o `search` y responde una página', async () => {
    const ctx = testContext({ db });
    const byQuery = await callAction<{ total: number }>(
      contactActions.search,
      { query: 'an' },
      ctx
    );
    const bySearch = await callAction<{ total: number }>(
      contactActions.search,
      { search: 'an' },
      ctx
    );
    expect(byQuery.total).toBe(1);
    expect(bySearch.total).toBe(1);
  });
});
