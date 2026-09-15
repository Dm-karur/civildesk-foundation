import { ShoppingCart } from 'lucide-react';
import { DocumentListPage } from '../../shared/components/DocumentListPage';
import { materialManagementApi } from '../../../api/apiservice';

/* Backend: MaterialDocumentsController → ok('...','material_purchase_orders', [...])
   DB: material_purchase_orders → po_no, po_date, expected_delivery_date, subtotal, grand_total */
const extractPO = (res) => res?.data?.material_purchase_orders ?? res?.data?.data ?? [];
const extractReq = (res) => res?.data?.material_requests ?? res?.data?.data ?? [];

const STATUS = [
  { value: 'draft', label: 'Draft' }, { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' }, { value: 'partially', label: 'Partial' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];

export function PurchaseOrdersPage() {
  return (
    <DocumentListPage
      title="Purchase Orders"
      icon={ShoppingCart}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Procurement' }, { label: 'Purchase Orders' }]}
      api={materialManagementApi.purchaseOrders}
      extractList={extractPO}
      columns={[
        { key: 'po_no', label: 'PO No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'po_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'supplier_name', label: 'Supplier', className: 'w-36' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'expected_delivery_date', label: 'Delivery', className: 'w-24', format: 'date' },
        { key: 'taxable_amount', label: 'Taxable', className: 'w-24 text-right', format: 'currency' },
        { key: 'tax_amount', label: 'Tax', className: 'w-20 text-right', format: 'currency' },
        { key: 'grand_total', label: 'Total', className: 'w-28 text-right', format: 'currency' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['po_no', 'supplier_name', 'project_name']}
      statusOptions={STATUS}
      entityName="Purchase Order"
      permissionPrefix="purchase_orders"
    />
  );
}

export function PurchaseRequisitionsPage() {
  return (
    <DocumentListPage
      title="Purchase Requisitions"
      icon={ShoppingCart}
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Procurement' }, { label: 'Purchase Requisitions' }]}
      api={materialManagementApi.requests}
      extractList={extractReq}
      columns={[
        { key: 'request_no', label: 'Req No.', className: 'w-28', cellClass: 'font-mono font-semibold text-text-primary' },
        { key: 'request_date', label: 'Date', className: 'w-24', format: 'date' },
        { key: 'required_by_date', label: 'Required By', className: 'w-24', format: 'date' },
        { key: 'project_name', label: 'Project', className: 'w-32' },
        { key: 'site_name', label: 'Site', className: 'w-28' },
        { key: 'purpose', label: 'Purpose', className: 'w-36' },
        { key: 'status_name', label: 'Status', className: 'w-24 text-center' },
      ]}
      searchKeys={['request_no', 'project_name', 'site_name']}
      statusOptions={STATUS}
      entityName="Requisition"
      permissionPrefix="purchase_orders"
    />
  );
}
