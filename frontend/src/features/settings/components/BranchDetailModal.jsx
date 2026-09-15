import { Building, MapPin, Hash, Phone, Mail, CheckCircle2, XCircle, Map, Clock } from 'lucide-react';
import { EntityDetailsModal } from '../../../components/composite/EntityDetailsModal';

export function BranchDetailModal({ branch, onClose }) {
  if (!branch) return null;

  const isActive = branch.is_active == 1 || branch.is_active === '1' || branch.is_active === true || branch.status === 'Active';
  const isHeadOffice = branch.is_head_office === 1 || branch.is_head_office === '1' || branch.is_head_office === true;
  
  const addressParts = [
    branch.address_line1 || branch.address,
    branch.address_line2,
    [branch.city, branch.district, branch.postal_code || branch.pincode].filter(Boolean).join(', '),
    [branch.state_name || branch.state, branch.country_code || 'IN'].filter(Boolean).join(', ')
  ].filter(Boolean);

  return (
    <EntityDetailsModal isOpen={true} onClose={onClose}>
      <EntityDetailsModal.Header 
        icon={Building}
        title={branch.branch_name || branch.name || 'Branch Details'}
        subtitle={`${branch.branch_code || branch.code || 'No Code'} • Company ID: #${branch.company_id || '1'}`}
        status={isActive ? 'Active' : 'Inactive'}
        statusVariant={isActive ? 'success' : 'neutral'}
        statusIcon={isActive ? CheckCircle2 : XCircle}
        onClose={onClose}
      />
      
      <EntityDetailsModal.Body>
        <EntityDetailsModal.Section title="Contact Information" icon={Phone}>
          <EntityDetailsModal.Field label="Email Address" value={branch.email} icon={Mail} />
          <EntityDetailsModal.Field label="Phone Number" value={branch.phone || branch.contact} icon={Phone} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Identity & Tax Details" icon={Hash}>
          <EntityDetailsModal.Field label="GSTIN" value={branch.gstin || branch.gst} />
          <EntityDetailsModal.Field label="Branch Type ID" value={branch.branch_type_id || 'Standard'} />
          <EntityDetailsModal.Field label="Head Office" value={isHeadOffice ? 'Yes (Headquarters)' : 'No (Branch Office)'} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Address Details" icon={MapPin}>
          <EntityDetailsModal.ContentBlock label="Branch Address">
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

        <EntityDetailsModal.Section title="System & Location Metadata" icon={Map}>
          <EntityDetailsModal.Field label="Latitude" value={branch.latitude} />
          <EntityDetailsModal.Field label="Longitude" value={branch.longitude} />
          <EntityDetailsModal.Field label="Created At" value={branch.created_at} icon={Clock} />
          <EntityDetailsModal.Field label="Record ID" value={`#${branch.id}`} />
        </EntityDetailsModal.Section>
      </EntityDetailsModal.Body>

      <EntityDetailsModal.Footer onClose={onClose} />
    </EntityDetailsModal>
  );
}
