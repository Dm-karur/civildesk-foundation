import { Building2, MapPin, Globe, Phone, Mail, Hash, CheckCircle2, XCircle, Settings } from 'lucide-react';
import { EntityDetailsModal } from '../../../components/composite/EntityDetailsModal';

export function CompanyDetailModal({ company, onClose }) {
  if (!company) return null;

  const isActive = company.is_active == 1 || company.is_active === true || company.status === 'Active';
  const addressParts = [
    company.address_line1,
    company.address_line2,
    [company.city, company.district, company.postal_code].filter(Boolean).join(', '),
    [company.state_name, company.country_code].filter(Boolean).join(', ')
  ].filter(Boolean);

  return (
    <EntityDetailsModal isOpen={true} onClose={onClose}>
      <EntityDetailsModal.Header 
        icon={Building2}
        title={company.company_name || company.name || 'Company Details'}
        subtitle={`${company.company_code || 'No Code'} • ${company.legal_name || 'No Legal Name'}`}
        status={isActive ? 'Active' : 'Inactive'}
        statusVariant={isActive ? 'success' : 'neutral'}
        statusIcon={isActive ? CheckCircle2 : XCircle}
        onClose={onClose}
      />
      
      <EntityDetailsModal.Body>
        <EntityDetailsModal.Section title="Contact Information" icon={Phone}>
          <EntityDetailsModal.Field label="Email Address" value={company.email} icon={Mail} />
          <EntityDetailsModal.Field label="Phone Number" value={company.phone} icon={Phone} />
          <EntityDetailsModal.Field label="Website" value={company.website} icon={Globe} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Identity & Tax Details" icon={Hash}>
          <EntityDetailsModal.Field label="GSTIN" value={company.gstin} />
          <EntityDetailsModal.Field label="PAN" value={company.pan} />
          <EntityDetailsModal.Field label="CIN" value={company.cin} />
          <EntityDetailsModal.Field label="Company Type ID" value={company.company_type_id} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Address Details" icon={MapPin}>
          <EntityDetailsModal.ContentBlock label="Registered Address">
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
              <div>
                {addressParts.length > 0 ? (
                  addressParts.map((part, idx) => <div key={idx}>{part}</div>)
                ) : (
                  <span className="text-text-muted">No address provided.</span>
                )}
              </div>
            </div>
          </EntityDetailsModal.ContentBlock>
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="System Configuration" icon={Settings}>
          <EntityDetailsModal.Field label="Currency" value={company.currency_code} />
          <EntityDetailsModal.Field label="Timezone" value={company.timezone} />
          <EntityDetailsModal.Field label="Date Format" value={company.date_format} />
        </EntityDetailsModal.Section>
      </EntityDetailsModal.Body>

      <EntityDetailsModal.Footer onClose={onClose} />
    </EntityDetailsModal>
  );
}
