import { 
  User, 
  Mail, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Activity, 
  AlertTriangle,
  Crown
} from 'lucide-react';
import { EntityDetailsModal } from '../../../components/composite/EntityDetailsModal';

export function UserDetailModal({ user, onClose }) {
  if (!user) return null;

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name || user.username || 'User Details';
  const username = user.username || '—';
  const empCode = user.employee_code || '—';
  const email = user.email || '—';
  const phone = user.phone || '—';
  const designation = user.designation || '—';
  const isSuperAdmin = user.is_super_admin === 1 || user.is_super_admin === '1' || user.is_super_admin === true;
  const isActive = user.is_active === 1 || user.is_active === '1' || user.active === 1 || user.active === '1' || user.status === 'Active' || user.is_active === true;
  const formatDateTime = (val) => {
    if (!val) return '—';
    if (typeof val === 'string') return val.split('.')[0];
    if (val.date) return val.date.split('.')[0];
    return String(val);
  };

  const isLocked = Boolean(
    user.locked_until && 
    new Date(typeof user.locked_until === 'object' ? user.locked_until.date : user.locked_until) > new Date()
  );
  const mustChangePass = user.must_change_password === 1 || user.must_change_password === '1' || user.must_change_password === true;

  const statusVariant = isLocked ? 'error' : (isActive ? 'success' : 'neutral');
  const statusLabel = isLocked ? 'Locked' : (isActive ? 'Active' : 'Inactive');
  const StatusIcon = isLocked ? AlertTriangle : (isActive ? CheckCircle2 : XCircle);

  return (
    <EntityDetailsModal isOpen={true} onClose={onClose}>
      <EntityDetailsModal.Header 
        icon={User}
        title={fullName}
        subtitle={`User ID: #${user.id} • Designation: ${designation}`}
        status={statusLabel}
        statusVariant={statusVariant}
        statusIcon={StatusIcon}
        onClose={onClose}
        extraBadges={
          <>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-surface border border-border rounded text-text-secondary font-semibold ml-2">
              {empCode !== '—' ? empCode : `@${username}`}
            </span>
            {isSuperAdmin && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1 ml-2">
                <Crown className="w-2.5 h-2.5" />
                Super Admin
              </span>
            )}
          </>
        }
      />

      {/* Inactive Account Warning Banner */}
      {!isActive && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-2.5 text-[11px] text-rose-700 dark:text-rose-400">
          ⚠️ <strong>Account Inactive:</strong> This user profile is inactive. System access, branch operations, and authentication are suspended.
        </div>
      )}

      <EntityDetailsModal.Body>
        <EntityDetailsModal.Section title="User Identity & Role" icon={User}>
          <EntityDetailsModal.Field label="Employee Code" value={empCode} />
          <EntityDetailsModal.Field label="Username" value={`@${username}`} />
          <EntityDetailsModal.Field label="First Name" value={user.first_name || '—'} />
          <EntityDetailsModal.Field label="Last Name" value={user.last_name || '—'} />
          <EntityDetailsModal.Field label="Designation" value={designation} />
          <EntityDetailsModal.Field label="User Type" value={user.user_type_name || user.type_name || (user.user_type_id ? `Type #${user.user_type_id}` : '—')} />
          <EntityDetailsModal.Field label="User Status" value={user.status_name || (user.user_status_id ? `Status #${user.user_status_id}` : '—')} />
          <EntityDetailsModal.Field label="Role Privilege" value={isSuperAdmin ? 'Super Administrator' : 'Standard User'} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Contact Information" icon={Mail}>
          <EntityDetailsModal.Field label="Email Address" value={email} />
          <EntityDetailsModal.Field label="Phone Number" value={phone} />
          <EntityDetailsModal.Field label="Email Verified At" value={user.email_verified_at ? formatDateTime(user.email_verified_at) : 'Not Verified'} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Organization & Branch Affiliation" icon={Building2}>
          <EntityDetailsModal.Field label="Company ID" value={`#${user.company_id || '1'}`} />
          <EntityDetailsModal.Field label="Assigned Branch" value={user.branch_name || user.default_branch_name || (user.default_branch_id ? `Branch #${user.default_branch_id}` : 'All Branches / Head Office')} />
          <EntityDetailsModal.Field label="Status Message" value={user.status_message || 'Active User'} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Security & Access Control" icon={Shield}>
          <EntityDetailsModal.Field 
            label="Must Change Password" 
            value={mustChangePass ? 'Yes (Pending)' : 'No'} 
            secondaryValue={mustChangePass ? 'User will be prompted on next login' : null}
          />
          <EntityDetailsModal.Field label="Failed Login Attempts" value={user.failed_login_attempts || 0} />
          <EntityDetailsModal.Field label="Account Lockout" value={user.locked_until ? formatDateTime(user.locked_until) : 'None'} />
          <EntityDetailsModal.Field label="Password Changed At" value={formatDateTime(user.password_changed_at)} />
        </EntityDetailsModal.Section>

        <EntityDetailsModal.Section title="Activity Log & Audit Trail" icon={Activity}>
          <EntityDetailsModal.Field label="Last Active" value={formatDateTime(user.last_active)} />
          <EntityDetailsModal.Field label="Last Login At" value={formatDateTime(user.last_login_at)} />
          <EntityDetailsModal.Field label="Last Login IP" value={user.last_login_ip || '—'} />
          <EntityDetailsModal.Field label="Created At" value={formatDateTime(user.created_at)} />
        </EntityDetailsModal.Section>
      </EntityDetailsModal.Body>

      <EntityDetailsModal.Footer onClose={onClose} />
    </EntityDetailsModal>
  );
}
