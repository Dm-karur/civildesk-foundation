import { useState, useEffect } from 'react';
import { Settings, Clock, MapPin, CalendarDays, Plus, Save, Loader2, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Modal } from '../../../components/ui/Modal';
import { FormField } from '../../../components/composite/FormField';
import { TabsSection } from '../../../components/composite/TabsSection';
import { DataTableContainer } from '../../../components/composite/DataTableContainer';
import { toast } from '../../../components/composite/Toast';
import { employeeAttendanceApi, sitesApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

export function ShiftHolidaySettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shift-settings');
  const [sites, setSites] = useState([]);
  const [settings, setSettings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editSettings, setEditSettings] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ holiday_name: '', holiday_date: '', site_id: '', description: '' });
  const [settingsForm, setSettingsForm] = useState({
    site_id: '', shift_start_time: '09:00', shift_end_time: '18:00', break_duration_minutes: '60',
    grace_period_minutes: '15', half_day_min_hours: '4', full_day_min_hours: '7.5', absent_threshold_hours: '2',
    overtime_enabled: '1', overtime_after_hours: '8.5', overtime_rate_multiplier: '1.5',
    week_off_days: 'SUNDAY', lop_calculation_method: 'CALENDAR', lop_fixed_divisor: '30', geofence_radius_override_m: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sitesRes, settingsRes, holidaysRes] = await Promise.all([
        sitesApi.list(), employeeAttendanceApi.settings(), employeeAttendanceApi.holidays({ year: new Date().getFullYear() }),
      ]);
      setSites(sitesRes?.data?.sites ?? sitesRes?.data ?? []);
      setSettings(settingsRes?.data?.settings ?? []);
      setHolidays(holidaysRes?.data?.holidays ?? []);
    } catch (err) { toast.error(err.message || 'Failed to load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, []);

  const handleSaveSettings = async () => {
    if (!settingsForm.site_id) { toast.error('Site is required.'); return; }
    setSaving(true);
    try {
      await employeeAttendanceApi.saveSettings(settingsForm);
      toast.success('Settings saved.'); setShowSettingsForm(false); loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleSaveHoliday = async () => {
    if (!holidayForm.holiday_name || !holidayForm.holiday_date) { toast.error('Name and date are required.'); return; }
    setSaving(true);
    try {
      await employeeAttendanceApi.saveHoliday(holidayForm);
      toast.success('Holiday saved.'); setShowHolidayForm(false);
      setHolidayForm({ holiday_name: '', holiday_date: '', site_id: '', description: '' }); loadData();
    } catch (err) { toast.error(err.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDeleteHoliday = async (id) => {
    if (!confirm('Delete this holiday?')) return;
    try { await employeeAttendanceApi.deleteHoliday(id); toast.success('Holiday deleted.'); loadData(); }
    catch (err) { toast.error(err.message || 'Failed.'); }
  };

  const openEditSettings = (s) => {
    setSettingsForm({ ...s, site_id: String(s.site_id) }); setShowSettingsForm(true);
  };

  return (
    <PageContainer>
      <PageHeader title="Shift & Holiday Settings" subtitle="Configure attendance rules, shift timings, and company holidays" />

      <div className="mb-4">
        <TabsSection tabs={[
          { key: 'shift-settings', label: 'Shift & Attendance Rules' },
          { key: 'holidays', label: 'Holidays' },
        ]} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'shift-settings' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => { setSettingsForm({ site_id: '', shift_start_time: '09:00', shift_end_time: '18:00', break_duration_minutes: '60', grace_period_minutes: '15', half_day_min_hours: '4', full_day_min_hours: '7.5', absent_threshold_hours: '2', overtime_enabled: '1', overtime_after_hours: '8.5', overtime_rate_multiplier: '1.5', week_off_days: 'SUNDAY', lop_calculation_method: 'CALENDAR', lop_fixed_divisor: '30', geofence_radius_override_m: '' }); setShowSettingsForm(true); }} className="flex items-center gap-1"><Plus className="h-4 w-4" /> Add Settings</Button>
          </div>
          <DataTableContainer loading={loading}>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
                <th className="px-3 py-3">Site</th><th className="px-3 py-3">Shift</th><th className="px-3 py-3">Grace</th><th className="px-3 py-3">OT After</th><th className="px-3 py-3">Week Off</th><th className="px-3 py-3">LOP Method</th><th className="px-3 py-3">Actions</th>
              </tr></thead>
              <tbody>
                {settings.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-text-secondary">No settings configured.</td></tr>}
                {settings.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-surface-hover">
                    <td className="px-3 py-2.5 font-medium">{s.site_name}</td>
                    <td className="px-3 py-2.5">{s.shift_start_time} — {s.shift_end_time}</td>
                    <td className="px-3 py-2.5">{s.grace_period_minutes} min</td>
                    <td className="px-3 py-2.5">{s.overtime_after_hours}h</td>
                    <td className="px-3 py-2.5"><Badge variant="neutral">{s.week_off_days}</Badge></td>
                    <td className="px-3 py-2.5">{s.lop_calculation_method}</td>
                    <td className="px-3 py-2.5"><Button size="sm" variant="ghost" onClick={() => openEditSettings(s)}>Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableContainer>
        </>
      )}

      {activeTab === 'holidays' && (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setShowHolidayForm(true)} className="flex items-center gap-1"><Plus className="h-4 w-4" /> Add Holiday</Button>
          </div>
          <DataTableContainer loading={loading}>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs font-semibold uppercase text-text-secondary">
                <th className="px-3 py-3">Name</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Site</th><th className="px-3 py-3">Description</th><th className="px-3 py-3">Actions</th>
              </tr></thead>
              <tbody>
                {holidays.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-text-secondary">No holidays configured.</td></tr>}
                {holidays.map(h => (
                  <tr key={h.id} className="border-b border-border/50 hover:bg-surface-hover">
                    <td className="px-3 py-2.5 font-medium">{h.holiday_name}</td>
                    <td className="px-3 py-2.5">{h.holiday_date}</td>
                    <td className="px-3 py-2.5">{h.site_id ? sites.find(s => s.id == h.site_id)?.site_name : <Badge variant="info">All Sites</Badge>}</td>
                    <td className="px-3 py-2.5 text-text-secondary">{h.description || '—'}</td>
                    <td className="px-3 py-2.5"><Button size="sm" variant="ghost" onClick={() => handleDeleteHoliday(h.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTableContainer>
        </>
      )}

      {/* Settings Form Modal */}
      {showSettingsForm && (
        <Modal title="Site Attendance Settings" onClose={() => setShowSettingsForm(false)} size="lg">
          <div className="space-y-4 p-4 max-h-[70vh] overflow-y-auto">
            <FormField label="Site"><Select value={settingsForm.site_id} onChange={e => setSettingsForm({...settingsForm, site_id: e.target.value})}>
              <option value="">Select site</option>{sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </Select></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Shift Start"><Input type="time" value={settingsForm.shift_start_time} onChange={e => setSettingsForm({...settingsForm, shift_start_time: e.target.value})} /></FormField>
              <FormField label="Shift End"><Input type="time" value={settingsForm.shift_end_time} onChange={e => setSettingsForm({...settingsForm, shift_end_time: e.target.value})} /></FormField>
              <FormField label="Break (min)"><Input type="number" value={settingsForm.break_duration_minutes} onChange={e => setSettingsForm({...settingsForm, break_duration_minutes: e.target.value})} /></FormField>
              <FormField label="Grace Period (min)"><Input type="number" value={settingsForm.grace_period_minutes} onChange={e => setSettingsForm({...settingsForm, grace_period_minutes: e.target.value})} /></FormField>
              <FormField label="Half Day Min Hours"><Input type="number" step="0.5" value={settingsForm.half_day_min_hours} onChange={e => setSettingsForm({...settingsForm, half_day_min_hours: e.target.value})} /></FormField>
              <FormField label="Full Day Min Hours"><Input type="number" step="0.5" value={settingsForm.full_day_min_hours} onChange={e => setSettingsForm({...settingsForm, full_day_min_hours: e.target.value})} /></FormField>
              <FormField label="Overtime After Hours"><Input type="number" step="0.5" value={settingsForm.overtime_after_hours} onChange={e => setSettingsForm({...settingsForm, overtime_after_hours: e.target.value})} /></FormField>
              <FormField label="OT Rate Multiplier"><Input type="number" step="0.1" value={settingsForm.overtime_rate_multiplier} onChange={e => setSettingsForm({...settingsForm, overtime_rate_multiplier: e.target.value})} /></FormField>
            </div>
            <FormField label="Week Off Days"><Input value={settingsForm.week_off_days} onChange={e => setSettingsForm({...settingsForm, week_off_days: e.target.value})} placeholder="SUNDAY or SATURDAY,SUNDAY" /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="LOP Method"><Select value={settingsForm.lop_calculation_method} onChange={e => setSettingsForm({...settingsForm, lop_calculation_method: e.target.value})}>
                <option value="CALENDAR">Calendar Days</option><option value="WORKING">Working Days</option><option value="FIXED">Fixed Divisor</option>
              </Select></FormField>
              <FormField label="Fixed Divisor"><Input type="number" value={settingsForm.lop_fixed_divisor} onChange={e => setSettingsForm({...settingsForm, lop_fixed_divisor: e.target.value})} /></FormField>
            </div>
            <FormField label="Geofence Override (m)"><Input type="number" value={settingsForm.geofence_radius_override_m} onChange={e => setSettingsForm({...settingsForm, geofence_radius_override_m: e.target.value})} placeholder="Leave blank to use site default" /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSettingsForm(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save</>}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Holiday Form Modal */}
      {showHolidayForm && (
        <Modal title="Add Holiday" onClose={() => setShowHolidayForm(false)}>
          <div className="space-y-4 p-4">
            <FormField label="Holiday Name"><Input value={holidayForm.holiday_name} onChange={e => setHolidayForm({...holidayForm, holiday_name: e.target.value})} /></FormField>
            <FormField label="Date"><Input type="date" value={holidayForm.holiday_date} onChange={e => setHolidayForm({...holidayForm, holiday_date: e.target.value})} /></FormField>
            <FormField label="Site (optional)"><Select value={holidayForm.site_id} onChange={e => setHolidayForm({...holidayForm, site_id: e.target.value})}>
              <option value="">All Sites</option>{sites.map(s => <option key={s.id} value={s.id}>{s.site_name}</option>)}
            </Select></FormField>
            <FormField label="Description"><Textarea value={holidayForm.description} onChange={e => setHolidayForm({...holidayForm, description: e.target.value})} rows={2} /></FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowHolidayForm(false)}>Cancel</Button>
              <Button onClick={handleSaveHoliday} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
