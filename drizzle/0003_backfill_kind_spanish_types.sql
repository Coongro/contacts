-- Los kits cargan `type` en su propio vocabulario: Alquileres usa 'empresa'/'persona', no
-- 'company'. El backfill de 0002 solo miraba 'company' y dejó esas organizaciones como
-- personas. Incluye los borrados: al restaurarlos tienen que volver bien marcados.
UPDATE "module_contacts_contacts" SET "kind" = 'organization' WHERE "kind" = 'person' AND lower("type") IN ('company', 'empresa', 'organization', 'organizacion', 'organización');
