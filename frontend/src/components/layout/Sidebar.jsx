import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  BellRing,
  BookMarked,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CalendarRange,
  Camera,
  CheckCheck,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CircleDot,
  ClipboardList,
  Clock,
  Coins,
  Compass,
  Contact,
  CreditCard,
  Eye,
  FileBarChart,
  FileEdit,
  FileInput,
  Files,
  FileSignature,
  FileSpreadsheet,
  FileText,
  FileUp,
  Flag,
  Flame,
  Folder,
  FolderCog,
  FolderKanban,
  FolderPlus,
  FolderTree,
  GitBranch,
  GitCompare,
  HandCoins,
  HardHat,
  Hash,
  History,
  IndianRupee,
  Key,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart,
  ListChecks,
  ListFilter,
  LogOut,
  Mail,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  MonitorSmartphone,
  Navigation,
  Network,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  Percent,
  PieChart,
  Printer,
  Receipt,
  ReceiptIndianRupee,
  ReceiptText,
  RotateCcw,
  Ruler,
  Scroll,
  Send,
  Settings,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Sliders,
  SlidersHorizontal,
  Split,
  Stamp,
  Store,
  Tags,
  Timer,
  ToggleLeft,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  Workflow,
  Wrench,
} from 'lucide-react';
import { clsx } from 'clsx';
import { navigationApi } from '../../api/apiservice';
import { useAuth } from '../../features/auth/context/AuthContext';

const ICONS_BY_KEY = Object.freeze({
  'layout-dashboard': LayoutDashboard,
  briefcase: Briefcase,
  'folder-cog': FolderCog,
  settings: Settings,
  menu: Menu,
  'hard-hat': HardHat,
  users: Users,
  'user-check': UserCheck,
  package: Package,
  wallet: Wallet,
  'file-text': FileText,
  'building-2': Building2,
  'map-pin': MapPin,
  calculator: Calculator,
  'calendar-range': CalendarRange,
  'shopping-cart': ShoppingCart,
  'clipboard-list': ClipboardList,
  'receipt-indian-rupee': ReceiptIndianRupee,
  landmark: Landmark,
  'bar-chart-3': BarChart3,
  'message-square': MessageSquare,
  'monitor-smartphone': MonitorSmartphone,
  map: Map,
  layers: Layers,
  navigation: Navigation,
  'pie-chart': PieChart,
  'file-spreadsheet': FileSpreadsheet,
  'file-up': FileUp,
  'file-bar-chart': FileBarChart,
  'calendar-check': CalendarCheck,
  'file-edit': FileEdit,
  'calendar-off': CalendarOff,
  clock: Clock,
  coins: Coins,
  receipt: Receipt,
  scroll: Scroll,
  'check-square': CheckSquare,
  'folder-kanban': FolderKanban,
  'project-masters': FolderKanban,
  'labour-masters': Users,
  'material-masters': Boxes,
  'procurement-masters': ShoppingCart,
  'finance-masters': Landmark,
});

const ICONS_BY_CODE = Object.freeze({
  DASHBOARD: LayoutDashboard,
  PRIMARY_SITES: HardHat,
  SITES_LOCATIONS: MapPin,
  PRIMARY_CLIENTS: Briefcase,
  BOQ_BUDGET: Calculator,
  PROJECT_PLANNING: CalendarRange,
  PRIMARY_HRM: UserCheck,
  LABOUR_ATTENDANCE: Users,
  MATERIALS_INVENTORY: Package,
  PROCUREMENT: ShoppingCart,
  DAILY_SITE_OPERATIONS: ClipboardList,
  SUBCONTRACT_MANAGEMENT: HardHat,
  CLIENT_BILLING: ReceiptIndianRupee,
  FINANCE_COST_CONTROL: Landmark,
  REPORTS_ANALYTICS: BarChart3,
  COMMUNICATION: MessageSquare,
  CLIENT_PORTAL: MonitorSmartphone,
  MASTERS: FolderCog,
  ADMINISTRATION: Settings,

  EXECUTIVE_DASHBOARD: LayoutDashboard,
  PROJECT_DASHBOARD: FolderKanban,
  SITE_DASHBOARD: HardHat,
  FINANCIAL_DASHBOARD: TrendingUp,
  ALERTS_NOTIFICATIONS: Bell,

  SITE_DIR: Building2,
  SITE_REGISTER: Building2,
  SITE_MAP_NAV: Map,
  SITE_ZONES_NAV: Layers,
  LOCATIONS_ZONES: Layers,
  SITE_LOC_NAV: Navigation,
  WORK_LOCATIONS: Navigation,
  SITE_TEAM_NAV: Users,
  SITE_TEAM_ASSIGNMENT: Users,
  SITE_DOCS_NAV: FileText,
  SITE_DOCUMENTS: FileText,
  SITE_INSTRUCTIONS: FileSignature,

  PROJECT_REGISTER: FolderKanban,
  ADD_NEW_PROJECT: FolderPlus,
  PROJECT_CLIENTS: Building2,
  PROJECT_TEAM: Users,
  PROJECT_OVERVIEW: Eye,
  PROJECT_DOCUMENTS: FileText,
  PROJECT_MILESTONES: Flag,
  PROJECT_STATUS_HISTORY: History,

  BOQ_DASH: PieChart,
  BOQ_REG: FileSpreadsheet,
  BOQ_REGISTER: FileSpreadsheet,
  BOQ_IMPORT: FileUp,
  BOQ_REPORTS: FileBarChart,
  BOQ_SECTIONS: FolderTree,
  BOQ_ITEMS: ListChecks,
  BUDGET_SUMMARY: CircleDollarSign,
  BUDGET_REVISIONS: History,
  VARIATION_ORDERS: FileSignature,
  CHANGE_APPROVAL: CheckCheck,
  DRAWING_QUANTITY_TAKEOFF: Ruler,
  TAKEOFF_REVIEW: CheckSquare,
  CONVERT_TAKEOFF_BOQ: ArrowLeftRight,

  PROJECT_ACTIVITIES: Activity,
  WORK_PROGRAMME: CalendarDays,
  ACTIVITY_BOQ_MAPPING: Workflow,
  PLANNED_VS_COMPLETED: GitCompare,
  LOOK_AHEAD_PLANNING: CalendarClock,
  MATERIAL_REQUIREMENTS: Boxes,
  MATERIAL_FORECAST: TrendingUp,
  SHORTAGE_PREDICTIONS: AlertTriangle,
  PLANNING_ALERTS: BellRing,

  HRM_CHECKIN: MapPin,
  HRM_ATTENDANCE: CalendarCheck,
  DAILY_ATTENDANCE: CalendarCheck,
  HRM_CORRECTIONS: FileEdit,
  ATTENDANCE_EXCEPTIONS: AlertTriangle,
  HRM_LEAVES: CalendarOff,
  LEAVE_MANAGEMENT: CalendarOff,
  HRM_SHIFTS: Clock,
  HRM_SALARY: Coins,
  DAILY_WAGES: Coins,
  HRM_PAYROLL: Receipt,
  WAGE_APPROVAL: BadgeCheck,
  HRM_PAYSLIPS: Scroll,
  HRM_REPORTS: FileBarChart,
  LABOUR_REPORTS: FileBarChart,
  LABOUR_REGISTER: Users,
  LABOUR_DEPLOYMENT: UserPlus,
  TIMESHEETS: Timer,
  OVERTIME: Clock,
  MANPOWER_COST: IndianRupee,

  MATERIAL_CATALOGUE: BookOpen,
  STOCK_OVERVIEW: Boxes,
  PROJECT_STOCK: Warehouse,
  MATERIAL_REQUESTS: FileInput,
  STOCK_RECEIPTS: PackagePlus,
  STOCK_ISSUES: PackageMinus,
  STOCK_TRANSFERS: ArrowLeftRight,
  MATERIAL_RETURNS: RotateCcw,
  STOCK_ADJUSTMENTS: SlidersHorizontal,
  DELIVERY_CHALLANS: Truck,
  MATERIAL_CONSUMPTION: Flame,
  STOCK_LEDGER: BookMarked,

  PURCHASE_REQUISITIONS: FileText,
  MATERIAL_REQUEST_APPROVAL: CheckSquare,
  REQUISITION_APPROVAL: CheckSquare,
  REQUEST_FOR_QUOTATION: Send,
  VENDOR_QUOTATIONS: Tags,
  QUOTATION_COMPARISON: GitCompare,
  PURCHASE_ORDERS: ShoppingCart,
  PURCHASE_ORDER_APPROVAL: CheckCircle2,
  GOODS_RECEIPT: PackageCheck,
  VENDOR_INVOICES: Receipt,
  PURCHASE_RETURNS: RotateCcw,
  PROCUREMENT_TRACKING: Compass,

  DAILY_WORK_REPORT: ClipboardList,
  WORK_COMPLETION_ENTRY: CheckSquare,
  PROGRESS_MEASUREMENTS: Ruler,
  MANPOWER_USAGE: Users,
  EQUIPMENT_USAGE: Truck,
  MATERIAL_USAGE: Package,
  DELAYS_ISSUES: AlertTriangle,
  SITE_PHOTOS: Camera,
  DAILY_REPORT_APPROVAL: BadgeCheck,
  DAILY_PROGRESS_HISTORY: History,

  SUBCONTRACTORS: Contact,
  SUBCONTRACTOR_TYPES: Layers,
  SUBCONTRACTOR_WEEKLY_SLIP: CalendarDays,
  WORK_ORDERS: FileSignature,
  WORK_ORDER_APPROVAL: CheckCircle2,
  WORK_MEASUREMENTS: Ruler,
  MEASUREMENT_CERTIFICATES: Award,
  RA_BILLS: Receipt,
  BILL_APPROVAL: Stamp,
  SUBCONTRACTOR_PAYMENTS: Wallet,
  WORK_COMPLETION: Flag,
  RETENTION_REGISTER: ShieldCheck,
  SUBCONTRACT_REPORTS: FileBarChart,

  CLIENT_CONTRACTS: FileSignature,
  CONTRACT_VALUE_REGISTER: Coins,
  CLIENT_ADVANCES: HandCoins,
  ADVANCE_APPROVAL: CheckSquare,
  CLIENT_INVOICE_REGISTER: Receipt,
  PROGRESS_BILLING: TrendingUp,
  RECEIPT_REGISTER: ReceiptText,
  RECEIPT_ALLOCATION: Split,
  OUTSTANDING_RECEIVABLES: Clock,
  RETENTION_RECEIVABLES: ShieldAlert,
  CLIENT_STATEMENT: Printer,

  PROJECT_COST_SUMMARY: Calculator,
  BUDGET_VS_ACTUAL: GitCompare,
  MATERIAL_COSTS: Package,
  LABOUR_COSTS: Users,
  SUBCONTRACT_COSTS: HardHat,
  EQUIPMENT_COSTS: Truck,
  OTHER_EXPENSES: Receipt,
  INCOME_REGISTER: ArrowDownLeft,
  EXPENSE_REGISTER: ArrowUpRight,
  VENDOR_PAYABLES: Building2,
  PAYMENT_REGISTER: CreditCard,
  PROJECT_PROFITABILITY: LineChart,
  CASH_FLOW: Activity,

  PROJECT_PROGRESS_REPORT: TrendingUp,
  BOQ_PROGRESS_REPORT: FileBarChart,
  BUDGET_ACTUAL_REPORT: GitCompare,
  MATERIAL_CONSUMPTION_REPORT: Package,
  MATERIAL_SHORTAGE_REPORT: AlertOctagon,
  LABOUR_DEPLOYMENT_REPORT: Users,
  LABOUR_COST_REPORT: Coins,
  SUBCONTRACTOR_REPORT: HardHat,
  CLIENT_RECEIVABLE_REPORT: Receipt,
  VENDOR_PAYABLE_REPORT: Building2,
  PROJECT_PROFITABILITY_REPORT: LineChart,
  DAILY_SITE_REPORT: ClipboardList,
  MANAGEMENT_SUMMARY: PieChart,

  PROJECT_MESSAGES: MessageSquare,
  CLIENT_UPDATES: Send,
  DOCUMENT_SHARING: Share2,
  APPROVAL_REQUESTS: CheckSquare,
  WHATSAPP_HISTORY: MessageCircle,
  EMAIL_HISTORY: Mail,

  CLIENT_USERS: Users,
  PORTAL_ACCESS: Key,
  SHARED_PROJECTS: FolderKanban,
  SHARED_DOCUMENTS: Files,
  CLIENT_APPROVALS: BadgeCheck,
  CLIENT_COMMUNICATIONS: MessagesSquare,

  PROJECT_MASTERS: FolderKanban,
  MASTER_CLIENTS: Building2,
  MASTER_PROJECT_TYPES: Layers,
  MASTER_PROJECT_STATUSES: ToggleLeft,
  MASTER_FINANCIAL_YEARS: Calendar,
  MASTER_WORK_CATEGORIES: Tags,
  MASTER_UNITS: Ruler,

  LABOUR_MASTERS: Users,
  MASTER_LABOUR_TYPES: Users,
  MASTER_LABOUR_CATEGORIES: Tags,
  MASTER_TRADES: Wrench,
  MASTER_WAGE_RATES: CircleDollarSign,
  MASTER_CREWS: Network,

  MATERIAL_MASTERS: Boxes,
  MASTER_MATERIAL_CATEGORIES: Layers,
  MASTER_MATERIALS: Package,
  MASTER_BRANDS: Award,
  MASTER_MATERIAL_UNITS: Ruler,
  MASTER_WAREHOUSES: Warehouse,

  PROCUREMENT_MASTERS: ShoppingCart,
  MASTER_VENDORS: Store,
  MASTER_PAYMENT_TERMS: CalendarClock,
  MASTER_TAX_RATES: Percent,

  FINANCE_MASTERS: Landmark,
  MASTER_EXPENSE_CATEGORIES: Layers,
  MASTER_INCOME_CATEGORIES: TrendingUp,
  MASTER_BANKS: Landmark,
  MASTER_ACCOUNTS: CreditCard,
  MASTER_COST_HEADS: ListFilter,

  ADMIN_COMPANIES: Building2,
  ADMIN_BRANCHES: GitBranch,
  ADMIN_USERS: Users,
  ADMIN_ROLES_PERMISSIONS: Shield,
  ADMIN_APPROVAL_WORKFLOWS: Workflow,
  ADMIN_NUMBERING_SETTINGS: Hash,
  ADMIN_NOTIFICATION_SETTINGS: Bell,
  ADMIN_EMAIL_SETTINGS: Mail,
  ADMIN_WHATSAPP_SETTINGS: MessageSquare,
  ADMIN_AUDIT_LOGS: History,
  ADMIN_SYSTEM_SETTINGS: Sliders,
});

const ICONS_BY_ROUTE = Object.freeze({
  '/dashboard': LayoutDashboard,
  '/dashboards/projects': FolderKanban,
  '/dashboards/sites': HardHat,
  '/dashboards/finance': TrendingUp,
  '/alerts': Bell,
  '/sites': Building2,
  '/sites/map': Map,
  '/sites/zones': Layers,
  '/sites/work-locations': Navigation,
  '/sites/team': Users,
  '/sites/documents': FileText,
  '/sites/instructions': FileSignature,
  '/project-masters/clients': Briefcase,
  '/projects': FolderKanban,
  '/projects/new': FolderPlus,
  '/projects/clients': Building2,
  '/projects/team': Users,
  '/projects/overview': Eye,
  '/projects/documents': FileText,
  '/projects/milestones': Flag,
  '/projects/status-history': History,
  '/boq': FileSpreadsheet,
  '/boq/dashboard': PieChart,
  '/boq/import': FileUp,
  '/boq/reports': FileBarChart,
  '/boq/sections': FolderTree,
  '/boq/items': ListChecks,
  '/budgets': CircleDollarSign,
  '/budgets/revisions': History,
  '/budgets/variations': FileSignature,
  '/budgets/approvals': CheckCheck,
  '/takeoff': Ruler,
  '/takeoff/review': CheckSquare,
  '/takeoff/convert': ArrowLeftRight,
  '/planning/activities': Activity,
  '/planning/work-programme': CalendarDays,
  '/planning/boq-mapping': Workflow,
  '/planning/planned-vs-completed': GitCompare,
  '/planning/look-ahead': CalendarClock,
  '/planning/material-requirements': Boxes,
  '/planning/material-forecast': TrendingUp,
  '/planning/shortages': AlertTriangle,
  '/planning/alerts': BellRing,
  '/hrm/check-in': MapPin,
  '/hrm/attendance': CalendarCheck,
  '/hrm/corrections': FileEdit,
  '/hrm/leaves': CalendarOff,
  '/hrm/shifts-holidays': Clock,
  '/hrm/salary-structures': Coins,
  '/hrm/payroll': Receipt,
  '/hrm/payslips': Scroll,
  '/hrm/reports': FileBarChart,
  '/labour': Users,
  '/labour/deployment': UserPlus,
  '/labour/attendance': CalendarCheck,
  '/labour/attendance-exceptions': AlertTriangle,
  '/labour/timesheets': Timer,
  '/labour/overtime': Clock,
  '/labour/leave': CalendarOff,
  '/labour/wages': Coins,
  '/labour/manpower-cost': IndianRupee,
  '/labour/wage-approval': BadgeCheck,
  '/reports/labour': FileBarChart,
  '/materials/catalogue': BookOpen,
  '/materials/stock': Boxes,
  '/materials/project-stock': Warehouse,
  '/materials/requests': FileInput,
  '/materials/receipts': PackagePlus,
  '/materials/issues': PackageMinus,
  '/materials/transfers': ArrowLeftRight,
  '/materials/returns': RotateCcw,
  '/materials/adjustments': SlidersHorizontal,
  '/materials/delivery-challans': Truck,
  '/materials/consumption': Flame,
  '/materials/ledger': BookMarked,
  '/procurement/requisitions': FileText,
  '/procurement/material-request-approval': CheckSquare,
  '/procurement/requisition-approval': CheckSquare,
  '/procurement/rfq': Send,
  '/procurement/quotations': Tags,
  '/procurement/comparison': GitCompare,
  '/procurement/purchase-orders': ShoppingCart,
  '/procurement/purchase-order-approval': CheckCircle2,
  '/procurement/goods-receipt': PackageCheck,
  '/procurement/vendor-invoices': Receipt,
  '/procurement/returns': RotateCcw,
  '/procurement/tracking': Compass,
  '/daily-operations/reports': ClipboardList,
  '/daily-operations/completion': CheckSquare,
  '/daily-operations/measurements': Ruler,
  '/daily-operations/manpower': Users,
  '/daily-operations/equipment': Truck,
  '/daily-operations/materials': Package,
  '/daily-operations/issues': AlertTriangle,
  '/daily-operations/photos': Camera,
  '/daily-operations/approvals': BadgeCheck,
  '/daily-operations/history': History,
  '/subcontracts/subcontractors': Contact,
  '/subcontracts/work-orders': FileSignature,
  '/subcontracts/work-order-approval': CheckCircle2,
  '/subcontracts/measurements': Ruler,
  '/subcontracts/certificates': Award,
  '/subcontracts/ra-bills': Receipt,
  '/subcontracts/bill-approval': Stamp,
  '/subcontracts/payments': Wallet,
  '/subcontracts/completion': Flag,
  '/subcontracts/retention': ShieldCheck,
  '/reports/subcontracts': FileBarChart,
  '/receivables/contracts': FileSignature,
  '/receivables/contract-values': Coins,
  '/receivables/advances': HandCoins,
  '/receivables/advance-approval': CheckSquare,
  '/receivables/invoices': Receipt,
  '/receivables/progress-billing': TrendingUp,
  '/receivables/receipts': ReceiptText,
  '/receivables/allocations': Split,
  '/receivables/outstanding': Clock,
  '/receivables/retention': ShieldAlert,
  '/receivables/statements': Printer,
  '/finance/project-cost': Calculator,
  '/finance/budget-vs-actual': GitCompare,
  '/finance/material-costs': Package,
  '/finance/labour-costs': Users,
  '/finance/subcontract-costs': HardHat,
  '/finance/equipment-costs': Truck,
  '/finance/other-expenses': Receipt,
  '/finance/income': ArrowDownLeft,
  '/finance/expenses': ArrowUpRight,
  '/finance/vendor-payables': Building2,
  '/finance/payments': CreditCard,
  '/finance/profitability': LineChart,
  '/finance/cash-flow': Activity,
  '/reports/project-progress': TrendingUp,
  '/reports/boq-progress': FileBarChart,
  '/reports/budget-vs-actual': GitCompare,
  '/reports/material-consumption': Package,
  '/reports/material-shortage': AlertOctagon,
  '/reports/labour-deployment': Users,
  '/reports/labour-cost': Coins,
  '/reports/client-receivables': Receipt,
  '/reports/vendor-payables': Building2,
  '/reports/project-profitability': LineChart,
  '/reports/daily-site': ClipboardList,
  '/reports/management-summary': PieChart,
  '/communication/project-messages': MessageSquare,
  '/communication/client-updates': Send,
  '/communication/documents': Share2,
  '/communication/approvals': CheckSquare,
  '/communication/whatsapp': MessageCircle,
  '/communication/email': Mail,
  '/client-portal/users': Users,
  '/client-portal/access': Key,
  '/client-portal/projects': FolderKanban,
  '/client-portal/documents': Files,
  '/client-portal/approvals': BadgeCheck,
  '/client-portal/communications': MessagesSquare,
  '/masters/project-types': Layers,
  '/masters/project-statuses': ToggleLeft,
  '/masters/financial-years': Calendar,
  '/masters/work-categories': Tags,
  '/masters/units': Ruler,
  '/masters/labour-types': Users,
  '/masters/labour-categories': Tags,
  '/masters/trades': Wrench,
  '/masters/wage-rates': CircleDollarSign,
  '/masters/crews': Network,
  '/masters/material-categories': Layers,
  '/masters/materials': Package,
  '/masters/brands': Award,
  '/masters/material-units': Ruler,
  '/masters/warehouses': Warehouse,
  '/masters/vendors': Store,
  '/masters/payment-terms': CalendarClock,
  '/masters/tax-rates': Percent,
  '/masters/expense-categories': Layers,
  '/masters/income-categories': TrendingUp,
  '/masters/banks': Landmark,
  '/masters/accounts': CreditCard,
  '/masters/cost-heads': ListFilter,
  '/administration/companies': Building2,
  '/administration/branches': GitBranch,
  '/administration/users': Users,
  '/administration/roles-permissions': Shield,
  '/administration/approval-workflows': Workflow,
  '/administration/numbering': Hash,
  '/administration/notifications': Bell,
  '/administration/email': Mail,
  '/administration/whatsapp': MessageSquare,
  '/administration/audit-logs': History,
  '/administration/system-settings': Sliders,
});

function getIconByKeyword(name = '') {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('dashboard')) return LayoutDashboard;
  if (lower.includes('report') || lower.includes('analytic')) return FileBarChart;
  if (lower.includes('setting')) return Settings;
  if (lower.includes('user') || lower.includes('member') || lower.includes('team') || lower.includes('labour') || lower.includes('crew')) return Users;
  if (lower.includes('map') && !lower.includes('mapping')) return Map;
  if (lower.includes('site') || lower.includes('location')) return MapPin;
  if (lower.includes('zone') || lower.includes('category') || lower.includes('type')) return Layers;
  if (lower.includes('boq') || lower.includes('estimate') || lower.includes('calc')) return Calculator;
  if (lower.includes('budget') || lower.includes('cost') || lower.includes('wage') || lower.includes('salary') || lower.includes('rate') || lower.includes('advance')) return Coins;
  if (lower.includes('invoice') || lower.includes('bill') || lower.includes('receipt') || lower.includes('pay')) return Receipt;
  if (lower.includes('approve') || lower.includes('approval') || lower.includes('cert')) return BadgeCheck;
  if (lower.includes('order') || lower.includes('requisition') || lower.includes('request')) return ShoppingCart;
  if (lower.includes('material') || lower.includes('stock') || lower.includes('inventory') || lower.includes('item')) return Package;
  if (lower.includes('vendor') || lower.includes('supplier')) return Store;
  if (lower.includes('client')) return Briefcase;
  if (lower.includes('contract') || lower.includes('document') || lower.includes('letter')) return FileText;
  if (lower.includes('photo') || lower.includes('image')) return Camera;
  if (lower.includes('attendance') || lower.includes('checkin') || lower.includes('check-in')) return CalendarCheck;
  if (lower.includes('calendar') || lower.includes('schedule') || lower.includes('holiday') || lower.includes('shift')) return Calendar;
  if (lower.includes('log') || lower.includes('history') || lower.includes('audit')) return History;
  if (lower.includes('message') || lower.includes('chat') || lower.includes('mail')) return MessageSquare;
  if (lower.includes('subcontract')) return HardHat;
  if (lower.includes('measure') || lower.includes('unit')) return Ruler;
  return null;
}

function getItemIcon(item, depth = 0) {
  if (!item) return depth === 0 ? Menu : CircleDot;

  // 1. Explicit icon_key
  if (item.icon_key && ICONS_BY_KEY[item.icon_key]) {
    return ICONS_BY_KEY[item.icon_key];
  }

  // 2. Lookup by item_code
  const code = String(item.item_code || '').toUpperCase();
  if (code && ICONS_BY_CODE[code]) {
    return ICONS_BY_CODE[code];
  }

  // 3. Lookup by route_path
  const path = String(item.route_path || '').toLowerCase();
  if (path && ICONS_BY_ROUTE[path]) {
    return ICONS_BY_ROUTE[path];
  }

  // 4. Keyword heuristic on item_name
  const keywordIcon = getIconByKeyword(item.item_name);
  if (keywordIcon) {
    return keywordIcon;
  }

  // 5. Fallback based on children and hierarchy
  if (item.children && item.children.length > 0) {
    return depth === 0 ? Folder : FolderTree;
  }
  return depth === 0 ? Menu : CircleDot;
}

function NavigationItem({ item, openByDepth, onToggle, onNavigate, depth = 0 }) {
  const Icon = getItemIcon(item, depth);
  const children = item.children ?? [];
  const expanded = openByDepth[depth] === item.item_code;

  if (item.item_type === 'DIVIDER') return <div className="my-2 h-px bg-white/10" />;
  if (item.item_type === 'SECTION') {
    return <div className="px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-[#C8D1DC]/50">{item.item_name}</div>;
  }

  const iconClass = clsx(
    'shrink-0 transition-opacity',
    depth === 0
      ? 'h-5 w-5 text-[#C8D1DC] group-hover:text-white'
      : depth === 1
        ? 'h-4 w-4 text-[#C8D1DC]/85 group-hover:text-white'
        : 'h-3.5 w-3.5 text-[#C8D1DC]/75 group-hover:text-white'
  );

  if (children.length === 0 && item.route_path) {
    return (
      <NavLink
        to={item.route_path}
        onClick={onNavigate}
        style={{ paddingLeft: `${8 + (depth * 14)}px` }}
        className={({ isActive }) => clsx(
          'group flex h-9.5 items-center gap-2.5 rounded-sm px-2 text-[13px] font-medium transition-colors',
          isActive ? 'bg-primary text-white font-semibold' : 'text-[#C8D1DC] hover:bg-white/5 hover:text-white',
        )}
      >
        <Icon className={iconClass} />
        <span className="truncate">{item.item_name}</span>
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(item.item_code, depth)}
        style={{ paddingLeft: `${8 + (depth * 14)}px` }}
        className="group flex h-9.5 w-full items-center justify-between rounded-sm px-2 text-[13px] font-medium text-[#C8D1DC] hover:bg-white/5 hover:text-white"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon className={iconClass} />
          <span className="truncate">{item.item_name}</span>
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 shrink-0 opacity-70" /> : <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
      </button>
      {expanded && (
        <div className="flex flex-col gap-0.5">
          {children.map((child) => (
            <NavigationItem
              key={child.item_code}
              item={child}
              openByDepth={openByDepth}
              onToggle={onToggle}
              onNavigate={onNavigate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isMobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [navigation, setNavigation] = useState([]);
  const [error, setError] = useState('');
  const [openByDepth, setOpenByDepth] = useState({});

  useEffect(() => {
    let active = true;
    navigationApi.list()
      .then((items) => {
        if (active) {
          // 1. Filter out Projects from primary navigation entirely
          let list = (items || []).filter((item) => {
            const code = String(item.item_code || '').toUpperCase();
            const name = String(item.item_name || '').toLowerCase();
            const path = String(item.route_path || '').toLowerCase();
            if (code === 'PROJECTS' || code === 'PROJECT_MANAGEMENT' || code === 'PROJECT' || code === 'PROJECT_SETUP') return false;
            if (name === 'projects' || name === 'project management') return false;
            if (path === '/projects') return false;
            return true;
          });

          // 2. Ensure SITES is primary top-level item right after Dashboard
          const existingSitesNode = list.find((i) =>
            String(i.item_code || '').toUpperCase().includes('SITE') ||
            String(i.item_name || '').toLowerCase() === 'sites' ||
            String(i.item_name || '').toLowerCase().includes('sites &')
          );

          const sitesModule = {
            item_code: 'PRIMARY_SITES',
            item_name: 'Sites',
            icon_key: 'hard-hat',
            children: [
              { item_code: 'SITE_DIR', item_name: 'Site Directory', route_path: '/sites', icon_key: 'building-2' },
              { item_code: 'SITE_MAP_NAV', item_name: 'Map View', route_path: '/sites/map', icon_key: 'map' },
              { item_code: 'SITE_ZONES_NAV', item_name: 'Work Zones', route_path: '/sites/zones', icon_key: 'layers' },
              { item_code: 'SITE_LOC_NAV', item_name: 'Work Locations', route_path: '/sites/work-locations', icon_key: 'navigation' },
              { item_code: 'SITE_TEAM_NAV', item_name: 'Site Team', route_path: '/sites/team', icon_key: 'users' },
              { item_code: 'SITE_DOCS_NAV', item_name: 'Site Documents', route_path: '/sites/documents', icon_key: 'file-text' },
            ],
          };

          // Replace or insert Sites
          if (existingSitesNode) {
            list = list.map((i) => (i === existingSitesNode ? sitesModule : i));
          } else {
            // Insert after dashboard if exists
            const dashIdx = list.findIndex((i) => String(i.route_path || '').includes('/dashboard'));
            if (dashIdx !== -1) {
              list.splice(dashIdx + 1, 0, sitesModule);
            } else {
              list.unshift(sitesModule);
            }
          }

          // 3. Ensure CLIENTS is top-level
          const hasClients = list.some((i) =>
            String(i.route_path || '') === '/project-masters/clients' ||
            String(i.item_name || '').toLowerCase() === 'clients'
          );
          if (!hasClients) {
            const sIdx = list.findIndex((i) => i.item_code === 'PRIMARY_SITES');
            const clientItem = {
              item_code: 'PRIMARY_CLIENTS',
              item_name: 'Clients',
              route_path: '/project-masters/clients',
              icon_key: 'briefcase',
            };
            if (sIdx !== -1) {
              list.splice(sIdx + 1, 0, clientItem);
            } else {
              list.push(clientItem);
            }
          }

          // 4. Ensure Procurement has Material Request Approval if present
          const procNode = list.find((i) => i.item_name === 'Procurement' || i.item_code === 'PROCUREMENT');
          if (procNode && procNode.children) {
            const hasAppr = procNode.children.some((c) => c.route_path === '/procurement/material-request-approval');
            if (!hasAppr) {
              const reqIdx = procNode.children.findIndex((c) => c.route_path === '/procurement/requisitions' || c.item_code === 'PURCHASE_REQUISITIONS');
              const newItem = {
                item_code: 'MATERIAL_REQUEST_APPROVAL',
                item_name: 'Material Request Approval',
                route_path: '/procurement/material-request-approval',
                icon_key: 'check-square',
              };
              if (reqIdx !== -1) procNode.children.splice(reqIdx + 1, 0, newItem);
              else procNode.children.unshift(newItem);
            }
          }

          // 5. Streamline BOQ Navigation into modern Site-Centric structure
          const boqNode = list.find((i) =>
            i.item_code === 'BOQ' ||
            i.item_code === 'PROJECT_BOQS' ||
            String(i.item_name || '').toLowerCase().includes('boq') ||
            String(i.route_path || '').includes('/boq')
          );
          if (boqNode) {
            boqNode.item_name = 'BOQ & Budget';
            boqNode.icon_key = 'calculator';
            boqNode.children = [
              { item_code: 'BOQ_DASH', item_name: 'BOQ Dashboard', route_path: '/boq/dashboard', icon_key: 'pie-chart' },
              { item_code: 'BOQ_REG', item_name: 'BOQ Register', route_path: '/boq', icon_key: 'file-spreadsheet' },
              { item_code: 'BOQ_IMPORT', item_name: 'Import BOQ', route_path: '/boq/import', icon_key: 'file-up' },
              { item_code: 'BOQ_REPORTS', item_name: 'BOQ Reports', route_path: '/boq/reports', icon_key: 'file-bar-chart' },
            ];
          }

          // 6. Ensure HRM & GPS Attendance Module is present
          const hasHrm = list.some((i) => i.item_code === 'PRIMARY_HRM' || String(i.item_name || '').toLowerCase().includes('hrm'));
          if (!hasHrm) {
            const hrmModule = {
              item_code: 'PRIMARY_HRM',
              item_name: 'HRM & Attendance',
              icon_key: 'user-check',
              children: [
                { item_code: 'HRM_CHECKIN', item_name: 'GPS Check-In', route_path: '/hrm/check-in', icon_key: 'map-pin' },
                { item_code: 'HRM_ATTENDANCE', item_name: 'Attendance Register', route_path: '/hrm/attendance', icon_key: 'calendar-check' },
                { item_code: 'HRM_CORRECTIONS', item_name: 'Corrections', route_path: '/hrm/corrections', icon_key: 'file-edit' },
                { item_code: 'HRM_LEAVES', item_name: 'Leave & Permissions', route_path: '/hrm/leaves', icon_key: 'calendar-off' },
                { item_code: 'HRM_SHIFTS', item_name: 'Shift & Holidays', route_path: '/hrm/shifts-holidays', icon_key: 'clock' },
                { item_code: 'HRM_SALARY', item_name: 'Salary & Advances', route_path: '/hrm/salary-structures', icon_key: 'coins' },
                { item_code: 'HRM_PAYROLL', item_name: 'Payroll Processing', route_path: '/hrm/payroll', icon_key: 'receipt' },
                { item_code: 'HRM_PAYSLIPS', item_name: 'My Payslips', route_path: '/hrm/payslips', icon_key: 'scroll' },
                { item_code: 'HRM_REPORTS', item_name: 'HRM Reports', route_path: '/hrm/reports', icon_key: 'file-bar-chart' },
              ],
            };

            const labourIdx = list.findIndex((i) =>
              i.item_code === 'LABOUR' ||
              String(i.item_name || '').toLowerCase().includes('labour')
            );
            if (labourIdx !== -1) {
              list.splice(labourIdx + 1, 0, hrmModule);
            } else {
              const adminIdx = list.findIndex((i) =>
                i.item_code === 'ADMINISTRATION' ||
                String(i.item_name || '').toLowerCase().includes('admin')
              );
              if (adminIdx !== -1) {
                list.splice(adminIdx, 0, hrmModule);
              } else {
                list.push(hrmModule);
              }
            }
          }

          // 7. Streamline Subcontract Navigation to only:
          // Subcontractor, Subcontractor Types, Weekly Slip, Subcontractor Payments, Subcontractor Reports
          const subcontractModule = {
            item_code: 'PRIMARY_SUBCONTRACTS',
            item_name: 'Subcontractors',
            icon_key: 'hard-hat',
            children: [
              {
                item_code: 'SUBCONTRACTORS',
                item_name: 'Subcontractors',
                route_path: '/subcontracts/subcontractors',
                icon_key: 'contact',
              },
              {
                item_code: 'SUBCONTRACTOR_TYPES',
                item_name: 'Subcontractor Types',
                route_path: '/masters/subcontractor-types',
                icon_key: 'layers',
              },
              {
                item_code: 'SUBCONTRACTOR_WEEKLY_SLIP',
                item_name: 'Weekly Slip',
                route_path: '/subcontracts/weekly-payments',
                icon_key: 'calendar-days',
              },
              {
                item_code: 'SUBCONTRACTOR_PAYMENTS',
                item_name: 'Subcontractor Payments',
                route_path: '/subcontracts/payments',
                icon_key: 'wallet',
              },
              {
                item_code: 'SUBCONTRACT_REPORTS',
                item_name: 'Subcontractor Reports',
                route_path: '/reports/subcontracts',
                icon_key: 'file-bar-chart',
              },
            ],
          };

          const existingSubIdx = list.findIndex((i) =>
            i.item_code === 'SUBCONTRACT_MANAGEMENT' ||
            i.item_code === 'PRIMARY_SUBCONTRACTS' ||
            String(i.item_name || '').toLowerCase().includes('subcontract')
          );

          if (existingSubIdx !== -1) {
            list[existingSubIdx] = subcontractModule;
          } else {
            list.push(subcontractModule);
          }

          setNavigation(list);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Navigation could not be loaded.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!navigation.length) return;
    const findActiveItemPath = (items, currentDepth = 0) => {
      for (const item of items) {
        if (item.route_path && location.pathname.startsWith(item.route_path)) {
          return { [currentDepth]: item.item_code };
        }
        if (item.children && item.children.length > 0) {
          const childMatches = findActiveItemPath(item.children, currentDepth + 1);
          if (childMatches) {
            return { [currentDepth]: item.item_code, ...childMatches };
          }
        }
      }
      return null;
    };
    const activeDepths = findActiveItemPath(navigation);
    if (activeDepths) {
      setOpenByDepth((current) => ({ ...current, ...activeDepths }));
    }
  }, [location.pathname, navigation]);

  return (
    <>
      {isMobileOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} />}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 flex h-full w-[230px] shrink-0 flex-col border-r border-white/10 bg-secondary transition-transform lg:static lg:translate-x-0',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm shrink-0">
            <img src="/ks.png" alt="KS Construction" className="h-full w-full object-contain" />
          </div>
          <span className="text-[16px] font-bold tracking-tight text-white truncate">KS CONSTRUCTION</span>
        </div>
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-2 py-3" aria-label="Primary navigation">
          {error && <div className="m-2 rounded-sm bg-red-500/10 p-2 text-xs text-red-200">{error}</div>}
          {navigation.map((item) => (
            <NavigationItem
              key={item.item_code}
              item={item}
              openByDepth={openByDepth}
              onToggle={(code, depth) => setOpenByDepth((current) => {
                const next = { ...current };
                const isClosing = next[depth] === code;

                Object.keys(next).forEach((key) => {
                  if (Number(key) >= depth) delete next[key];
                });

                if (!isClosing) next[depth] = code;
                return next;
              })}
              onNavigate={onCloseMobile}
            />
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 truncate text-xs text-[#C8D1DC]">{user?.first_name} {user?.last_name}</div>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-[#C8D1DC] hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
