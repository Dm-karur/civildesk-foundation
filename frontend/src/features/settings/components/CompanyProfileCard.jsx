import { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard, 
  Globe, 
  CheckCircle2, 
  XCircle,
  Edit,
  ShieldCheck,
  Coins,
  Save,
  X,
  Loader2
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { companiesApi } from '../../../api/apiservice';

function extractCompanyList(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.companies)) return response.companies;
  if (Array.isArray(response.data?.companies)) return response.data.companies;
  if (Array.isArray(response.data?.data)) return response.data.data;
  if (response.data && typeof response.data === 'object' && (response.data.id || response.data.company_name || response.data.name)) {
    return [response.data];
  }
  if (response && typeof response === 'object' && (response.id || response.company_name || response.name)) {
    return [response];
  }
  return [];
}

export function CompanyProfileCard() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await companiesApi.list();
      console.log('[CompanyProfileCard] API response:', response);
      const list = extractCompanyList(response);
      
      if (list.length > 0) {
        setCompany(list[0]);
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('[CompanyProfileCard] Failed to fetch company details:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const handleEditOpen = () => {
    if (company) {
      setEditForm({ ...company });
      setIsEditing(true);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!company?.id) return;
    try {
      setSaving(true);
      await companiesApi.update(company.id, editForm);
      setCompany({ ...editForm });
      setIsEditing(false);
    } catch (error) {
      console.error('[CompanyProfileCard] Failed to update company:', error);
      alert('Failed to update company details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-sm p-4 animate-pulse mb-3">
        <div className="h-5 bg-surface-muted rounded w-1/4 mb-3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-12 bg-surface-muted rounded"></div>
          <div className="h-12 bg-surface-muted rounded"></div>
          <div className="h-12 bg-surface-muted rounded"></div>
          <div className="h-12 bg-surface-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-surface border border-border rounded-sm p-4 mb-2.5 text-center text-text-secondary text-[12px]">
        <Building2 className="w-6 h-6 mx-auto text-text-muted mb-1" />
        No company data found in the database.
      </div>
    );
  }

  // Format fields robustly
  const companyName = company.company_name || company.name || 'Company Profile';
  const companyCode = company.company_code || company.code || 'MAIN-CORP';
  const legalName = company.legal_name || companyName;
  const gstin = company.gstin || company.gst;
  const pan = company.pan;
  const cin = company.cin;
  const email = company.email;
  const phone = company.phone || company.contact;
  const website = company.website;
  const currency = company.currency_code || 'INR';
  const timezone = company.timezone || 'Asia/Kolkata';

  const fullAddress = [
    company.address_line1 || company.address,
    company.address_line2,
    company.city,
    company.district,
    company.state_name ? `${company.state_name} ${company.state_code ? `(${company.state_code})` : ''}` : null,
    company.postal_code || company.pincode,
    company.country_code
  ].filter(Boolean).join(', ');

  const isActive = company.is_active === 1 || company.is_active === '1' || company.is_active === true || company.status === 'Active' || company.status === 1;

  return (
    <>
      <div className="bg-surface border border-border rounded-sm p-3 mb-2.5 shadow-xs">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-bold text-text-primary tracking-tight leading-none">
                  {companyName}
                </h2>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-surface-muted border border-border rounded text-text-secondary">
                  {companyCode}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary mt-0.5 font-medium">
                {legalName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={isActive ? 'success' : 'neutral'}
              className="text-[9px] font-bold uppercase tracking-wider h-5 px-2 inline-flex items-center gap-1 leading-none"
            >
              {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditOpen}
              className="h-6 text-[11px] px-2 gap-1 font-medium"
            >
              <Edit className="w-3 h-3" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>

        {/* Database Mapped Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5 text-[11px]">
          {/* GSTIN */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <FileText className="w-3 h-3 text-primary" />
              <span>GSTIN</span>
            </div>
            <p className="font-mono font-semibold text-text-primary text-[11px] truncate" title={gstin || 'N/A'}>
              {gstin || 'N/A'}
            </p>
          </div>

          {/* PAN */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <CreditCard className="w-3 h-3 text-primary" />
              <span>PAN</span>
            </div>
            <p className="font-mono font-semibold text-text-primary text-[11px] truncate" title={pan || 'N/A'}>
              {pan || 'N/A'}
            </p>
          </div>

          {/* CIN */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <ShieldCheck className="w-3 h-3 text-primary" />
              <span>CIN</span>
            </div>
            <p className="font-mono font-semibold text-text-primary text-[11px] truncate" title={cin || 'N/A'}>
              {cin || 'N/A'}
            </p>
          </div>

          {/* Email */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <Mail className="w-3 h-3 text-primary" />
              <span>Email</span>
            </div>
            <p className="font-medium text-text-primary truncate" title={email || 'N/A'}>
              {email || 'N/A'}
            </p>
          </div>

          {/* Phone */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <Phone className="w-3 h-3 text-primary" />
              <span>Phone</span>
            </div>
            <p className="font-medium text-text-primary truncate" title={phone || 'N/A'}>
              {phone || 'N/A'}
            </p>
          </div>

          {/* Currency & TZ */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <Coins className="w-3 h-3 text-primary" />
              <span>Currency / TZ</span>
            </div>
            <p className="font-medium text-text-primary truncate">
              {currency} • {timezone}
            </p>
          </div>

          {/* Website */}
          <div className="bg-surface-muted/40 border border-border/70 rounded-xs p-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1 mb-0.5">
              <Globe className="w-3 h-3 text-primary" />
              <span>Website</span>
            </div>
            <p className="font-medium text-text-primary truncate" title={website || 'N/A'}>
              {website || 'N/A'}
            </p>
          </div>
        </div>

        {/* Registered Address Bar */}
        <div className="mt-1.5 bg-surface-muted/20 border border-border/60 rounded-xs px-2 py-1 flex items-start gap-1.5 text-[11px]">
          <MapPin className="w-3.5 h-3.5 text-text-secondary mt-0.5 shrink-0" />
          <div className="truncate">
            <span className="font-semibold text-text-secondary uppercase text-[9px] mr-1.5">Registered Office Address:</span>
            <span className="text-text-primary font-medium" title={fullAddress || 'N/A'}>
              {fullAddress || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Details Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-sm shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-muted/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <h3 className="text-[13px] font-bold text-text-primary">Edit Company Details</h3>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 text-[11px] space-y-3 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Company Name</label>
                  <input 
                    type="text"
                    value={editForm.company_name || editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value, name: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Company Code</label>
                  <input 
                    type="text"
                    value={editForm.company_code || editForm.code || ''}
                    onChange={(e) => setEditForm({ ...editForm, company_code: e.target.value, code: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Legal Name</label>
                  <input 
                    type="text"
                    value={editForm.legal_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">GSTIN</label>
                  <input 
                    type="text"
                    value={editForm.gstin || editForm.gst || ''}
                    onChange={(e) => setEditForm({ ...editForm, gstin: e.target.value, gst: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">PAN Number</label>
                  <input 
                    type="text"
                    value={editForm.pan || ''}
                    onChange={(e) => setEditForm({ ...editForm, pan: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">CIN</label>
                  <input 
                    type="text"
                    value={editForm.cin || ''}
                    onChange={(e) => setEditForm({ ...editForm, cin: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Email</label>
                  <input 
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Phone</label>
                  <input 
                    type="text"
                    value={editForm.phone || editForm.contact || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value, contact: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Address Line 1</label>
                  <input 
                    type="text"
                    value={editForm.address_line1 || editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value, address: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">City</label>
                  <input 
                    type="text"
                    value={editForm.city || ''}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">State Name</label>
                  <input 
                    type="text"
                    value={editForm.state_name || editForm.state || ''}
                    onChange={(e) => setEditForm({ ...editForm, state_name: e.target.value, state: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Postal Code</label>
                  <input 
                    type="text"
                    value={editForm.postal_code || editForm.pincode || ''}
                    onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value, pincode: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary uppercase text-[9px] font-bold mb-1">Website</label>
                  <input 
                    type="text"
                    value={editForm.website || ''}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    className="w-full h-7 px-2 border border-border rounded-xs bg-background text-[11px] focus:outline-none focus:border-focus"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-7 text-[11px]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={saving}
                  className="h-7 text-[11px] gap-1"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  <span>Save Changes</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
