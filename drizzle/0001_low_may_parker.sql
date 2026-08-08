ALTER TABLE "module_contacts_contacts" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "module_contacts_contacts" ALTER COLUMN "is_active" SET DEFAULT true;