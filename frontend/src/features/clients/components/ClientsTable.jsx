import { useState, useEffect, useRef } from 'react';
import {
  Eye,
  Edit,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Ban,
  HelpCircle,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { Pagination } from '../../../components/composite/Pagination';
import { clientsApi, clientStatusesApi } from '../../../api/apiservice';
import { ClientDetailModal } from './ClientDetailModal';
import { ClientFormModal } from './ClientFormModal';
import { toast } from '../../../components/composite/Toast';

function extractClientsList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.clients)) return response.clients;
  if (Array.isArray(response.data?.clients)) return response.data.clients;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data && typeof response.data === 'object' && (response.data.id || response.data.client_name || response.data.name)) {
    return [response.data];
  }
  if (response && typeof response === 'object' && (response.id || response.client_name || response.name)) {
    return [response];
  }
  return [];
}

const STATUS_MAP = {
  1: { code: 'PROSPECT', label: 'Prospect', variant: 'info', icon: HelpCircle },
  2: { code: 'ACTIVE', label: 'Active', variant: 'success', icon: CheckCircle2 },
  3: { code: 'ON_HOLD', label: 'On Hold', variant: 'warning', icon: AlertCircle },
  4: { code: 'INACTIVE', label: 'Inactive', variant: 'neutral', icon: XCircle },
  5: { code: 'BLACKLISTED', label: 'Blacklisted', variant: 'error', icon: Ban },
  'PROSPECT': { code: 'PROSPECT', label: 'Prospect', variant: 'info', icon: HelpCircle },
  'ACTIVE': { code: 'ACTIVE', label: 'Active', variant: 'success', icon: CheckCircle2 },
  'ON_HOLD': { code: 'ON_HOLD', label: 'On Hold', variant: 'warning', icon: AlertCircle },
  'INACTIVE': { code: 'INACTIVE', label: 'Inactive', variant: 'neutral', icon: XCircle },
  'BLACKLISTED': { code: 'BLACKLISTED', label: 'Blacklisted', variant: 'error', icon: Ban },
};

export function ClientsTable({
  searchQuery = '',
  statusFilter = 'all',
  industryFilter = 'all',
  isAddOpen = false,
  setIsAddOpen = () => { }
}) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [liveStatuses, setLiveStatuses] = useState([]);

  const menuRef = useRef(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsApi.list();
      const list = extractClientsList(response);
      setClients(list);
    } catch (error) {
      console.error("[ClientsTable] Failed to fetch clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Fetch dynamic statuses
    clientStatusesApi.list()
      .then(res => {
        const list = res?.data || res || [];
        if (Array.isArray(list) && list.length > 0) setLiveStatuses(list);
      })
      .catch(() => { });
  }, []);

  // Close actions menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete client "${name}"?`)) return;
    try {
      await clientsApi.remove(id);
      toast.success('Client deleted successfully');
      fetchClients();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete client');
    }
    setOpenMenuId(null);
  };

  const handleQuickStatusChange = async (clientId, newStatusId) => {
    try {
      await clientsApi.update(clientId, { client_status_id: newStatusId });
      toast.success('Status updated');
      fetchClients();
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    }
    setOpenMenuId(null);
  };

  const filteredClients = clients.filter((client) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (client.client_name || client.name || '').toLowerCase();
      const code = (client.client_code || client.code || '').toLowerCase();
      const gstin = (client.gstin || client.gst || '').toLowerCase();
      const pan = (client.pan || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || client.contact || '').toLowerCase();
      const matchesSearch = name.includes(q) || code.includes(q) || gstin.includes(q) || pan.includes(q) || email.includes(q) || phone.includes(q);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all') {
      const sId = String(client.client_status_id || '1');
      if (statusFilter === '1' && sId !== '1') return false;
      if (statusFilter === '2' && sId !== '2') return false;
      if (statusFilter === '3' && sId !== '3') return false;
      if (statusFilter === '4' && sId !== '4') return false;
      if (statusFilter === '5' && sId !== '5') return false;
    }

    if (industryFilter !== 'all') {
      const ind = (client.industry_type || client.industry || '').toLowerCase();
      if (!ind.includes(industryFilter.toLowerCase())) return false;
    }

    return true;
  });

  const getStatusBadge = (client) => {
    const rawStatus = client.client_status_id || client.status_code || client.status || 1;
    const statusConfig = STATUS_MAP[rawStatus] || {
      code: 'UNKNOWN',
      label: client.status_name || client.status || 'Active',
      variant: 'neutral',
      icon: Clock
    };

    const StatusIcon = statusConfig.icon;

    return (
      <Badge
        variant={statusConfig.variant}
        className="text-[8px] font-bold uppercase tracking-wider h-4 px-1.5 inline-flex items-center gap-0.5 leading-none font-sans"
      >
        <StatusIcon className="w-2.5 h-2.5" />
        <span>{statusConfig.label}</span>
      </Badge>
    );
  };

  const renderPagination = () => (
    <Pagination
      currentPage={1}
      totalPages={Math.max(1, Math.ceil(filteredClients.length / 10))}
      totalItems={filteredClients.length}
      itemsPerPage={10}
      onPageChange={() => { }}
      onItemsPerPageChange={() => { }}
    />
  );

  return (
    <>
      <DataTableContainer pagination={renderPagination()}>
        <table className="w-full text-left text-[12px] whitespace-nowrap table-fixed">
          <thead className="bg-surface-muted text-text-secondary text-[11px] uppercase font-semibold border-b border-border tracking-wider">
            <tr>
              <th className="px-2 py-1.5 w-10 text-center">#</th>
              <th className="px-2 py-1.5 w-24">Client Code</th>
              <th className="px-2 py-1.5 w-48">Client Name</th>
              <th className="px-2 py-1.5 w-32">Client Type</th>
              <th className="px-2 py-1.5 w-40">Email</th>
              <th className="px-2 py-1.5 w-28">Phone</th>
              <th className="px-2 py-1.5 w-32">City</th>
              <th className="px-2 py-1.5 w-24 text-center">Status</th>
              <th className="px-2 py-1.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-text-muted text-[12px]">
                  Loading clients from database...
                </td>
              </tr>
            ) : filteredClients.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center py-6 text-text-muted text-[12px]">
                  No clients found in database.
                </td>
              </tr>
            ) : (
              filteredClients.map((client, index) => {
                const code = client.client_code || '—';
                const name = client.client_name || client.name || '—';
                const type = client.client_type || client.industry_type || '—';
                const email = client.email || '—';
                const phone = client.phone || client.contact || '—';
                const city = client.city || '—';

                const isMenuOpen = openMenuId === client.id;

                return (
                  <tr key={client.id || index} className="hover:bg-surface-muted/30 transition-colors group relative">
                    <td className="px-2 py-1 text-center font-medium text-text-primary text-[11px]">{index + 1}</td>
                    <td className="px-2 py-1 font-mono font-semibold text-text-primary text-[11px]">{code}</td>
                    <td className="px-2 py-1 font-medium text-text-primary truncate" title={name}>
                      {name}
                    </td>
                    <td className="px-2 py-1 text-text-secondary truncate text-[11px]" title={type}>
                      {type}
                    </td>
                    <td className="px-2 py-1 text-text-secondary truncate text-[11px]" title={email}>
                      {email}
                    </td>
                    <td className="px-2 py-1 text-text-secondary truncate text-[11px]">
                      {phone}
                    </td>
                    <td className="px-2 py-1 text-text-secondary truncate text-[11px]" title={city}>
                      {city}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {getStatusBadge(client)}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center gap-0.5">
                        {/* View Eye Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClient(client)}
                          className="h-6 w-6 p-0"
                          title="View Client Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingClient(client)}
                          className="h-6 w-6 p-0"
                          title="Edit Client"
                        >
                          <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
                        </Button>

                        {/* Three Dots More Actions Menu */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : client.id);
                            }}
                            className={`h-6 w-6 p-0 ${isMenuOpen ? 'text-primary bg-surface-muted' : 'text-text-secondary'}`}
                            title="More Options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>

                          {/* Dropdown Menu Popup */}
                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              className="absolute right-0 top-7 z-50 w-44 bg-surface border border-border rounded-sm shadow-xl p-1 text-[11px] animate-in fade-in zoom-in-95 duration-100"
                            >
                              {/* Quick Status Submenu */}
                              <div className="px-2 py-1 text-[9px] uppercase font-bold text-text-secondary">
                                Quick Status Change:
                              </div>
                              <div className="space-y-0.5">
                                {[
                                  { id: 1, name: 'Prospect', color: 'text-sky-500' },
                                  { id: 2, name: 'Active', color: 'text-emerald-500' },
                                  { id: 3, name: 'On Hold', color: 'text-amber-500' },
                                  { id: 4, name: 'Inactive', color: 'text-slate-400' },
                                  { id: 5, name: 'Blacklisted', color: 'text-rose-500' },
                                ].map((st) => (
                                  <button
                                    key={st.id}
                                    onClick={() => handleQuickStatusChange(client.id, st.id)}
                                    className={`w-full text-left px-2.5 py-1 rounded-xs hover:bg-surface-muted flex items-center justify-between text-[10px] ${client.client_status_id == st.id ? 'font-bold bg-surface-muted/50' : 'text-text-secondary'}`}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${st.color.replace('text-', 'bg-')}`}></span>
                                      <span>{st.name}</span>
                                    </span>
                                    {client.client_status_id == st.id && <span className="text-[9px] text-primary">✓</span>}
                                  </button>
                                ))}
                              </div>

                              <div className="border-t border-border my-1"></div>

                              <button
                                onClick={() => handleDeleteClient(client.id, name)}
                                className="w-full text-left px-2.5 py-1.5 rounded-xs hover:bg-error/10 flex items-center gap-2 text-error"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Client</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </DataTableContainer>

      {/* Full Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* Edit / Add Client Modal */}
      {(editingClient || isAddOpen) && (
        <ClientFormModal
          isOpen={Boolean(editingClient || isAddOpen)}
          client={editingClient}
          onClose={() => {
            setEditingClient(null);
            setIsAddOpen(false);
          }}
          onSaveSuccess={fetchClients}
        />
      )}
    </>
  );
}
