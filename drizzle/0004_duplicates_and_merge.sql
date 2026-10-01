-- Duplicados y fusión (fase 2 del kit CRM). Las extensiones van en public: son de toda la
-- base, las comparten los tenants y en Coongro Local las registra la edición al crear la base.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;--> statement-breakpoint
-- `unaccent` de fábrica no es IMMUTABLE y no se puede indexar: esta envoltura fija el
-- diccionario y sí. Vive en el schema del tenant, al lado de la tabla que la usa.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "merged_into_id" uuid;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "phone_normalized" text GENERATED ALWAYS AS (nullif(regexp_replace(coalesce("phone", ''), '[^0-9]', '', 'g'), '')) STORED;--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_email_lower_idx" ON "module_contacts_contacts" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_phone_normalized_idx" ON "module_contacts_contacts" USING btree ("phone_normalized");--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_merged_into_id_idx" ON "module_contacts_contacts" USING btree ("merged_into_id");--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_name_trgm_idx" ON "module_contacts_contacts" USING gin (lower(f_unaccent("name")) gin_trgm_ops);
