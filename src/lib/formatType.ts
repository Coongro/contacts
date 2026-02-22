/** Traduce el tipo de contacto al label en español */
const TYPE_LABELS: Record<string, string> = {
  person: 'Persona',
  company: 'Empresa',
  other: 'Otro',
};

export function formatType(type: string): string {
  return TYPE_LABELS[type] ?? type;
}
