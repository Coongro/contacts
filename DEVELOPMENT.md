# contacts - Development Guide

## Database Triggers

If your plugin needs PostgreSQL triggers, follow this naming convention so the system
can automatically manage them when the plugin is activated/deactivated:

- **Trigger name**: `trg_contacts_{descriptive_name}`
- **Function name**: `trg_contacts_{descriptive_name}_fn`

Where `contacts` is your plugin's moduleId (pluginId with hyphens replaced by underscores).

### Example

```sql
-- In a Drizzle migration file (drizzle/NNNN_name.sql):

CREATE OR REPLACE FUNCTION "trg_contacts_audit_log_fn"()
RETURNS TRIGGER AS $$
BEGIN
  -- Your trigger logic here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "trg_contacts_audit_log"
AFTER INSERT OR UPDATE ON "module_contacts_items"
FOR EACH ROW
EXECUTE FUNCTION "trg_contacts_audit_log_fn"();
```

> **Important**: The system automatically **DISABLE**s all `trg_contacts_*` triggers when the plugin
> is deactivated, and **ENABLE**s them when reactivated. Triggers that don't follow this naming
> convention will NOT be managed automatically.
