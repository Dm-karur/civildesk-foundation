import { 
  Building, 
  FileText, 
  Coins, 
  Mail, 
  Phone, 
  Globe, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Ban,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { EntityDetailsModal } from '../../../components/composite/EntityDetailsModal';

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

export function ClientDetailModal({ client, onClose }) {
  if (!client) return null;

  const clientName = client.client_name || client.name || 'Client Details';
  const clientCode = client.client_code || client.code || 'No Code';
  const legalName = client.legal_name || '—';
  const gstin = client.gstin || client.gst || '—';
  const pan = client.pan || '—';
  const tan = client.tan || '—';
  const email = client.email || '—';
  const phone = client.phone || client.contact || '—';
  const website = client.website || '—';
  const industry = client.industry_type || client.industry || '—';
  const currency = client.billing_currency || 'INR';
  const termsDays = client.payment_terms_days !== undefined ? `${client.payment_terms_days} Days` : '0 Days';
  const creditLimit = client.credit_limit !== undefined ? Number(client.credit_limit).toLocaleString('en-IN') : '0.00';
  const tdsApplicable = client.tax_deduction_applicable === 1 || client.tax_deduction_applicable === '1' || client.tax_deduction_applicable === true;

  const rawStatus = client.client_status_id || client.status_code || client.status || 1;
  const statusConfig = STATUS_MAP[rawStatus] || {
    label: client.status_name || client.status || 'Active',
    variant: 'neutral',
    icon: HelpCircle
  };

  return (
    <EntityDetailsModal isOpen={true} onClose={onClose}>
      <EntityDetailsModal.Header 
        icon={Building}
        title={clientName}
        subtitle={`Client ID: #${client.id} • Industry: ${industry}`}
        status={statusConfig.label}
        statusVariant={statusConfig.variant}
        statusIcon={statusConfig.icon}
        onClose={onClose}
        extraBadges={
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary font-semibold ml-2">
            {clientCode}
          </span>
        }
      />

      <EntityDetailsModal.Body>
        <EntityDetailsModal.Section title="General & Legal Identity" icon={Building}>
          <EntityDetailsModal.Field label="Client Code" value={clientCode} />
          <EntityDetailsModal.Field label="Legal Name" value={legalName} />
          <EntityDetailsModal.Field label="Industry Type" value={industry} />
          <EntityDetailsModal.Field label="Client Type ID" value={client.client_type_id || 'Corporate (1)'} />
          <EntityDetailsModal.Field label="Client Source ID" value={client.client_source_id || 'Direct Reference'} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Tax & Statutory Compliance" icon={FileText}>
          <EntityDetailsModal.Field label="GSTIN" value={gstin} />
          <EntityDetailsModal.Field label="PAN Number" value={pan} />
          <EntityDetailsModal.Field label="TAN Number" value={tan} />
          <EntityDetailsModal.Field label="GST Reg Type ID" value={client.gst_registration_type_id || 'Regular (1)'} />
          <EntityDetailsModal.Field label="TDS Applicable" value={tdsApplicable ? 'Yes (Applicable)' : 'No (Exempt)'} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Financial & Billing Terms" icon={Coins}>
          <EntityDetailsModal.Field label="Billing Currency" value={`${currency} (Indian Rupee)`} />
          <EntityDetailsModal.Field label="Payment Terms" value={termsDays} />
          <EntityDetailsModal.Field label="Credit Limit (₹)" value={`₹ ${creditLimit}`} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Contact & Online Presence" icon={Mail}>
          <EntityDetailsModal.Field label="Email Address" value={email} icon={Mail} />
          <EntityDetailsModal.Field label="Phone Number" value={phone} icon={Phone} />
          <EntityDetailsModal.Field label="Website" value={website} icon={Globe} />
        </EntityDetailsModal.Section>

        {client.notes && (
          <EntityDetailsModal.Section title="Notes / Special Instructions">
            <EntityDetailsModal.ContentBlock>
              {client.notes}
            </EntityDetailsModal.ContentBlock>
          </EntityDetailsModal.Section>
        )}

        <EntityDetailsModal.Section title="System & Audit Metadata" icon={Clock}>
          <EntityDetailsModal.Field label="Company ID" value={`#${client.company_id || '1'}`} />
          <EntityDetailsModal.Field label="Branch ID" value={client.branch_id ? `#${client.branch_id}` : 'All Branches'} />
          <EntityDetailsModal.Field label="Created At" value={client.created_at} />
          <EntityDetailsModal.Field label="Updated At" value={client.updated_at} />
        </EntityDetailsModal.Section>
      </EntityDetailsModal.Body>

      <EntityDetailsModal.Footer onClose={onClose} />
    </EntityDetailsModal>
  );
}
