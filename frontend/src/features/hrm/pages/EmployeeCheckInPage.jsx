import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2,
  LogIn, LogOut, Navigation, Wifi, WifiOff, Timer, CalendarDays,
  ClipboardList, FileText, ArrowRight, TrendingUp, RefreshCw, Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { KpiCard } from '../../../components/composite/KpiCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { toast } from '../../../components/composite/Toast';
import { employeeAttendanceApi } from '../../../api/apiservice';
import { useAuth } from '../../auth/context/AuthContext';

const STATUS_COLORS = {
  PRESENT: 'success', ABSENT: 'danger', HALF_DAY: 'warning', LEAVE: 'info',
  LATE: 'warning', EARLY_EXIT: 'warning', OVERTIME: 'success', WEEK_OFF: 'neutral',
  HOLIDAY: 'info', PERMISSION: 'info',
};

export function EmployeeCheckInPage() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle, acquiring, success, error
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const timerRef = useRef(null);

  const fetchToday = useCallback(async () => {
    try {
      setLoading(true);
      const res = await employeeAttendanceApi.todayStatus();
      const today = res?.data?.today ?? null;
      setTodayData(today);
      if (today?.assignment?.site_id) {
        setSelectedSiteId(String(today.assignment.site_id));
      } else if (today?.available_sites?.length > 0) {
        setSelectedSiteId(String(today.available_sites[0].id));
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load today status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  // Live timer
  useEffect(() => {
    const att = todayData?.attendance;
    if (att?.check_in_time && !att?.check_out_time) {
      const start = new Date(att.check_in_time).getTime();
      timerRef.current = setInterval(() => {
        const diff = Date.now() - start;
        const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
        const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
        setElapsedTime(`${h}:${m}:${s}`);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [todayData]);

  const acquireGPS = () => {
    return new Promise((resolve, reject) => {
      setGpsStatus('acquiring');
      setGpsError('');
      if (!navigator.geolocation) {
        setGpsStatus('error');
        setGpsError('Geolocation is not supported by this browser.');
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setGpsCoords(coords);
          setGpsStatus('success');
          resolve(coords);
        },
        (err) => {
          setGpsStatus('error');
          const messages = {
            1: 'Location permission denied. Please enable location access in browser settings.',
            2: 'Unable to determine location. Please try again.',
            3: 'Location request timed out. Please try again.',
          };
          setGpsError(messages[err.code] || 'Failed to get location.');
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const coords = await acquireGPS();
      const payload = {
        ...coords,
        site_id: selectedSiteId ? Number(selectedSiteId) : undefined,
      };
      const res = await employeeAttendanceApi.checkIn(payload);
      toast.success(res?.message || 'Checked in successfully!');
      fetchToday();
    } catch (err) {
      if (err.message) toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const coords = await acquireGPS();
      const res = await employeeAttendanceApi.checkOut(coords);
      toast.success(res?.message || 'Checked out successfully!');
      fetchToday();
    } catch (err) {
      if (err.message) toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfAssign = async () => {
    if (!selectedSiteId) {
      toast.error('Please select a project site first.');
      return;
    }
    try {
      setActionLoading(true);
      await employeeAttendanceApi.saveAssignment({
        user_id: user?.id,
        site_id: Number(selectedSiteId),
        is_primary: 1,
        effective_from: new Date().toISOString().split('T')[0],
      });
      toast.success('Assigned to site successfully!');
      fetchToday();
    } catch (err) {
      toast.error(err.message || 'Failed to assign site.');
    } finally {
      setActionLoading(false);
    }
  };

  const att = todayData?.attendance;
  const assignment = todayData?.assignment;
  const availableSites = todayData?.available_sites || [];
  const summary = todayData?.month_summary;
  const isCheckedIn = att?.check_in_time && !att?.check_out_time;
  const isCheckedOut = att?.check_in_time && att?.check_out_time;
  const hasNotCheckedIn = !att?.check_in_time;

  // Selected site object
  const currentSite = availableSites.find((s) => String(s.id) === String(selectedSiteId)) || assignment;

  return (
    <PageContainer>
      <PageHeader
        title="GPS Attendance"
        description="Punch in and punch out using your real-time verified GPS location."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'HRM', href: '/hrm/attendance' },
          { label: 'GPS Check-In' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={fetchToday} className="flex items-center gap-1.5">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* ── Site Information & Selector ────────────────────── */}
          {currentSite ? (
            <Card className="p-4 bg-surface border border-border-default shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-text-primary">
                        {currentSite.site_name}
                      </span>
                      {assignment && String(currentSite.id) === String(assignment.site_id) && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Primary Site
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {currentSite.latitude && currentSite.longitude ? (
                        <span>GPS: {Number(currentSite.latitude).toFixed(4)}, {Number(currentSite.longitude).toFixed(4)} (Radius: {currentSite.geofence_radius_m || 200}m)</span>
                      ) : (
                        <span className="text-amber-600 font-medium">No coordinates configured — first punch will auto-set site location</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* If multiple sites exist, allow switching */}
                {availableSites.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-text-secondary whitespace-nowrap">Switch Site:</label>
                    <select
                      value={selectedSiteId}
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="h-9 px-2.5 rounded border border-border-default bg-surface text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {availableSites.map((s) => (
                        <option key={s.id} value={s.id}>{s.site_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* GPS Acquisition status indicator */}
              <div className="mt-3 pt-3 border-t border-border-default flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">GPS Status:</span>
                  {gpsStatus === 'idle' && (
                    <span className="text-text-secondary font-medium">Ready (will acquire on punch)</span>
                  )}
                  {gpsStatus === 'acquiring' && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Acquiring satellite fix...
                    </Badge>
                  )}
                  {gpsStatus === 'success' && gpsCoords && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> {gpsCoords.latitude.toFixed(4)}, {gpsCoords.longitude.toFixed(4)} (±{gpsCoords.accuracy}m)
                    </Badge>
                  )}
                  {gpsStatus === 'error' && (
                    <Badge variant="danger" className="flex items-center gap-1">
                      <WifiOff className="h-3 w-3" /> {gpsError}
                    </Badge>
                  )}
                </div>

                {todayData?.settings && (
                  <div className="text-text-secondary text-[11px]">
                    Shift: <span className="font-semibold text-text-primary">{todayData.settings.shift_start_time?.slice(0, 5)} - {todayData.settings.shift_end_time?.slice(0, 5)}</span>
                    {' '}(Grace: {todayData.settings.grace_period_minutes}m)
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* ── No Site Configured ────────────────────────────── */
            <Card className="p-8 text-center border border-border-default">
              <Building2 className="mx-auto h-12 w-12 text-primary/40 mb-3" />
              <h3 className="text-base font-bold text-text-primary">No Project Sites Found</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                No active project sites exist in this company yet. Please create at least one project site in the Sites Directory to enable GPS attendance.
              </p>
              <div className="mt-4">
                <Link to="/sites">
                  <Button variant="primary" size="sm">Go to Sites Directory</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* ── Check-In / Check-Out Punch Card ────────────── */}
          {currentSite && (
            <Card className="p-8 border border-border-default shadow-md bg-surface text-center">
              {/* Live Timer if Checked In */}
              {isCheckedIn && (
                <div className="mb-6">
                  <div className="text-6xl font-mono font-extrabold text-primary tracking-wider animate-pulse">
                    {elapsedTime}
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Working time since {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )}

              {/* Checked Out View */}
              {isCheckedOut && (
                <div className="mb-6 space-y-2">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                  <div className="text-2xl font-bold text-text-primary">
                    {att.working_hours ?? '—'} Hours Completed
                  </div>
                  <div className="text-xs text-text-secondary">
                    Checked in: {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 
                    Checked out: {new Date(att.check_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <Badge variant={STATUS_COLORS[att.status] || 'neutral'} className="text-xs font-semibold px-3 py-1">
                    {att.status?.replace('_', ' ')}
                  </Badge>
                </div>
              )}

              {/* Not Checked In View */}
              {hasNotCheckedIn && (
                <div className="mb-6">
                  <Clock className="mx-auto h-16 w-16 text-primary/30 mb-3" />
                  <div className="text-xl font-bold text-text-primary">Ready to Check In</div>
                  <div className="text-xs text-text-secondary mt-1">
                    Mark your daily attendance at {currentSite.site_name}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                {hasNotCheckedIn && (
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    className="px-8 py-3 text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                    Check In Now
                  </Button>
                )}

                {isCheckedIn && (
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={handleCheckOut}
                    disabled={actionLoading}
                    className="px-8 py-3 text-sm font-bold shadow-lg shadow-rose-600/20 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                    Check Out Now
                  </Button>
                )}

                {isCheckedOut && (
                  <Button variant="outline" size="sm" onClick={fetchToday} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Refresh Status
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* ── Monthly Summary KPI Cards ──────────────────── */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
              This Month's Summary ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                title="Present Days"
                value={summary?.present ?? 0}
                icon={CheckCircle2}
                trend="positive"
              />
              <KpiCard
                title="Absent Days"
                value={summary?.absent ?? 0}
                icon={XCircle}
                trend="negative"
              />
              <KpiCard
                title="Leaves Availed"
                value={summary?.on_leave ?? 0}
                icon={CalendarDays}
              />
              <KpiCard
                title="Overtime Hours"
                value={`${summary?.total_overtime ?? 0}h`}
                icon={TrendingUp}
              />
            </div>
          </div>

          {/* ── Quick Links ────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/hrm/corrections">
              <Card className="p-4 hover:border-primary transition-colors cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-amber-500/10 text-amber-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Attendance Correction</div>
                    <div className="text-[11px] text-text-secondary">Request punch fix</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-text-secondary" />
              </Card>
            </Link>

            <Link to="/hrm/leaves">
              <Card className="p-4 hover:border-primary transition-colors cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-500/10 text-blue-600">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">Apply for Leave</div>
                    <div className="text-[11px] text-text-secondary">Leaves & permissions</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-text-secondary" />
              </Card>
            </Link>

            <Link to="/hrm/payslips">
              <Card className="p-4 hover:border-primary transition-colors cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">My Payslips</div>
                    <div className="text-[11px] text-text-secondary">View monthly salary</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-text-secondary" />
              </Card>
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
