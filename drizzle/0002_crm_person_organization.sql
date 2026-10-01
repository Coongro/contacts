ALTER TABLE "module_contacts_contacts" ADD COLUMN "kind" text DEFAULT 'person' NOT NULL;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "job_title" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "additional_phones" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "additional_emails" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "linkedin" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "address_street" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "address_city" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "address_state" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "address_postcode" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "address_country" text;--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ADD COLUMN "owner_staff_id" text;--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_email_idx" ON "module_contacts_contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_document_number_idx" ON "module_contacts_contacts" USING btree ("document_number");--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_organization_id_idx" ON "module_contacts_contacts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_kind_idx" ON "module_contacts_contacts" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "module_contacts_contacts_deleted_at_idx" ON "module_contacts_contacts" USING btree ("deleted_at");--> statement-breakpoint
UPDATE "module_contacts_contacts" SET "kind" = 'organization' WHERE "type" = 'company' OR "metadata"->>'kind' = 'empresa';