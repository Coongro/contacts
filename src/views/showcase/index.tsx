import { getHostReact, usePlugin } from '@coongro/plugin-sdk';

import { ContactCard } from '../../components/ContactCard.js';
import { ContactDetail } from '../../components/ContactDetail.js';
import { ContactForm } from '../../components/ContactForm.js';
import { ContactPicker } from '../../components/ContactPicker.js';
import { ContactsTable } from '../../components/ContactsTable.js';
import { ContactStats } from '../../components/ContactStats.js';
import { CreateContactButton } from '../../components/CreateContactButton.js';
import type { Contact } from '../../types/contact.js';

const React = getHostReact();
const { useState } = React;

type Tab = 'stats' | 'table' | 'form' | 'picker' | 'card' | 'detail' | 'button';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'stats', label: 'Stats' },
  { id: 'table', label: 'Table' },
  { id: 'form', label: 'Form' },
  { id: 'picker', label: 'Picker' },
  { id: 'card', label: 'Card' },
  { id: 'detail', label: 'Detail' },
  { id: 'button', label: 'Create Btn' },
];

export function ShowcaseView() {
  const { toast } = usePlugin();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [pickerContact, setPickerContact] = useState<Contact | null>(null);

  return (
    <div className="font-inter min-h-screen bg-[var(--cg-bg-secondary)] p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--cg-text)]">Contacts Showcase</h1>
          <p className="text-sm text-[var(--cg-text-muted)] mt-1">
            Vista de prueba para todos los componentes reutilizables de @coongro/contacts
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-[var(--cg-bg-tertiary)] rounded-lg w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--cg-bg)] text-[var(--cg-text)] shadow-sm font-medium'
                  : 'text-[var(--cg-text-muted)] hover:text-[var(--cg-text)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-[var(--cg-bg)] rounded-xl border border-[var(--cg-border)] p-6 shadow-sm">
          {activeTab === 'stats' && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">ContactStats</h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Tarjetas de estadísticas para dashboards. Acepta extraStats para métricas custom.
              </p>
              <ContactStats
                layout="row"
                extraStats={[
                  {
                    label: 'VIP',
                    value: 3,
                    icon: 'active',
                    color: '#D4A76A',
                    footer: 'Clientes preferenciales',
                  },
                ]}
              />
            </div>
          )}

          {activeTab === 'table' && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">ContactsTable</h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Tabla con búsqueda, filtros por tipo, paginación y acciones extensibles.
              </p>
              <ContactsTable
                pageSize={10}
                extraActions={[
                  {
                    label: 'Ver',
                    onClick: (c: Contact) => {
                      setSelectedContact(c);
                      setActiveTab('detail');
                    },
                  },
                  {
                    label: 'Borrar',
                    variant: 'destructive',
                    onClick: (c: Contact) => toast.warning('Atención', `Se eliminaría: ${c.name}`),
                  },
                ]}
                onRowClick={(c: Contact) => {
                  setSelectedContact(c);
                  toast.info('Seleccionado', c.name);
                }}
              />
            </div>
          )}

          {activeTab === 'form' && (
            <div className="max-w-lg">
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">ContactForm</h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Formulario de crear/editar. Acepta extraFields para campos del bloque.
              </p>
              <ContactForm
                defaults={{ type: 'person' }}
                extraFields={[
                  {
                    key: 'emergency_phone',
                    label: 'Tel. Emergencia',
                    type: 'phone',
                    placeholder: '+54 11 9999-0000',
                  },
                ]}
                onSuccess={(c: Contact) => {
                  toast.success('Creado', c.name);
                  setSelectedContact(c);
                }}
                onCancel={() => toast.info('Cancelado', '')}
              />
            </div>
          )}

          {activeTab === 'picker' && (
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">ContactPicker</h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Selector/buscador dropdown para vincular un contacto. Ideal para formularios de
                bloques.
              </p>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-[var(--cg-text)]">
                  Seleccionar contacto:
                </label>
                <ContactPicker
                  placeholder="Buscar dueño..."
                  value={pickerContact?.id ?? null}
                  onChange={(c: Contact | null) => {
                    setPickerContact(c);
                    if (c) {
                      setSelectedContact(c);
                      toast.info('Seleccionado', c.name);
                    }
                  }}
                  allowCreate
                />
                {pickerContact && (
                  <div className="mt-4 p-3 rounded-lg bg-[var(--cg-bg-secondary)] text-sm">
                    <strong>Seleccionado:</strong> {pickerContact.name} ({pickerContact.type})
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'card' && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">ContactCard</h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Tarjeta resumen con avatar, campos y acciones. Acepta extraInfo para contenido
                custom.
              </p>
              {selectedContact ? (
                <div className="max-w-sm">
                  <ContactCard
                    contact={selectedContact}
                    showFields={['phone', 'email', 'address']}
                    extraInfo={
                      <span className="text-xs text-[var(--cg-text-muted)]">
                        Extra info del bloque
                      </span>
                    }
                    actions={[
                      {
                        label: 'Editar',
                        onClick: () => toast.info('Editar', selectedContact.name),
                      },
                      {
                        label: 'Eliminar',
                        variant: 'destructive',
                        onClick: () => toast.warning('Eliminar', selectedContact.name),
                      },
                    ]}
                  />
                </div>
              ) : (
                <p className="text-sm text-[var(--cg-text-muted)]">
                  Seleccioná un contacto desde la tabla primero.
                </p>
              )}
            </div>
          )}

          {activeTab === 'detail' && (
            <div>
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">ContactDetail</h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Vista completa de un contacto con secciones extensibles.
              </p>
              {selectedContact ? (
                <ContactDetail
                  contactId={selectedContact.id}
                  onEdit={(c: Contact) => toast.info('Editar', c.name)}
                  onDelete={(c: Contact) => toast.warning('Eliminar', c.name)}
                  extraSections={[
                    {
                      title: 'Mascotas (ejemplo)',
                      order: 10,
                      render: () => (
                        <p className="text-sm text-[var(--cg-text-muted)]">
                          Acá un bloque pondría la lista de mascotas del dueño.
                        </p>
                      ),
                    },
                  ]}
                  extraActions={[
                    {
                      label: 'Agregar mascota',
                      onClick: () => toast.info('Acción extra', 'Del bloque'),
                    },
                  ]}
                />
              ) : (
                <p className="text-sm text-[var(--cg-text-muted)]">
                  Seleccioná un contacto desde la tabla primero.
                </p>
              )}
            </div>
          )}

          {activeTab === 'button' && (
            <div className="max-w-md">
              <h2 className="text-lg font-semibold text-[var(--cg-text)] mb-4">
                CreateContactButton
              </h2>
              <p className="text-sm text-[var(--cg-text-muted)] mb-6">
                Botón que abre un modal con ContactForm. Dos variantes: primary y outline.
              </p>
              <div className="flex flex-col gap-4">
                <CreateContactButton
                  label="Nuevo contacto"
                  defaults={{ type: 'person' }}
                  onSuccess={(c: Contact) => {
                    toast.success('Creado', c.name);
                    setSelectedContact(c);
                  }}
                />
                <CreateContactButton
                  label="Nueva empresa"
                  defaults={{ type: 'company' }}
                  variant="outline"
                  onSuccess={(c: Contact) => {
                    toast.success('Creado', c.name);
                    setSelectedContact(c);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
