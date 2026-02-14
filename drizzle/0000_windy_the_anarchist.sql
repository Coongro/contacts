CREATE TABLE "module_contacts_contacts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"document_type" text,
	"document_number" text,
	"address" text,
	"notes" text,
	"avatar_url" text,
	"tags" jsonb,
	"metadata" jsonb,
	"is_active" boolean NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
