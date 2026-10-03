import axios from 'axios';

// .env: VITE_API_BASE_URL=http://localhost:8080/api
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    timeout: 30000,
});

api.interceptors.request.use((config) => {
    if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const normalized = {
            status: error.response?.status || 0,
            message: error.response?.data?.message || error.message || 'Request failed.',
            errors: error.response?.data?.errors || null,
            data: error.response?.data || null,
            original: error,
        };
        const url = error.config?.url || '';
        const isAuthUrl = url.includes('/auth/login') || url.includes('/auth/logout') || url.includes('/auth/me');
        if (normalized.status === 401 && !isAuthUrl) {
            window.dispatchEvent(new CustomEvent('api:unauthorized', { detail: normalized }));
        }
        return Promise.reject(normalized);
    },
);

const data = (response) => response.data;
const enc = (value) => encodeURIComponent(String(value));
const formData = (values) => {
    if (values instanceof FormData) return values;
    const body = new FormData();
    Object.entries(values || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) value.forEach((item) => body.append(`${key}[]`, item));
        else body.append(key, value);
    });
    return body;
};

export const request = {
    get: (url, params, config = {}) => api.get(url, { ...config, params }).then(data),
    post: (url, body = {}, config = {}) => api.post(url, body, config).then(data),
    put: (url, body = {}, config = {}) => api.put(url, body, config).then(data),
    patch: (url, body = {}, config = {}) => api.patch(url, body, config).then(data),
    delete: (url, body, config = {}) => api.delete(url, { ...config, data: body }).then(data),
    upload: (url, values, method = 'post') => api.request({ url, method, data: formData(values) }).then(data),
    download: (url, params) => api.get(url, { params, responseType: 'blob' }).then((r) => r.data),
};

const crud = (base) => ({
    list: (params) => request.get(base, params),
    get: (id, params) => request.get(`${base}/${enc(id)}`, params),
    create: (payload) => request.post(base, payload),
    update: (id, payload) => request.patch(`${base}/${enc(id)}`, payload),
    replace: (id, payload) => request.put(`${base}/${enc(id)}`, payload),
    remove: (id, payload) => request.delete(`${base}/${enc(id)}`, payload),
});

const action = (base, id, name, payload = {}) =>
    request.post(`${base}/${enc(id)}/${enc(name)}`, payload);

const nestedCrud = (baseForParent) => ({
    list: (parentId, params) => request.get(baseForParent(parentId), params),
    get: (parentId, id, params) => request.get(`${baseForParent(parentId)}/${enc(id)}`, params),
    create: (parentId, payload) => request.post(baseForParent(parentId), payload),
    update: (parentId, id, payload) => request.patch(`${baseForParent(parentId)}/${enc(id)}`, payload),
    replace: (parentId, id, payload) => request.put(`${baseForParent(parentId)}/${enc(id)}`, payload),
    remove: (parentId, id, payload) => request.delete(`${baseForParent(parentId)}/${enc(id)}`, payload),
});

export const authApi = {
    login: (email, password, remember = false) => request.post('/auth/login', {
        email,
        password,
        remember,
    }),
    me: () => request.get('/auth/me'),
    logout: () => request.post('/auth/logout'),
    changePassword: (payload) => request.post('/auth/change-password', payload),
};

export const mastersApi = {
    all: (params) => request.get('/masters', params),
    get uom() { return unitsApi; },
    get units() { return unitsApi; },
    get workCategories() { return workCategoriesApi; },
};
export const companiesApi = {
    list: (params) => request.get('/companies', params),
    get: (id) => request.get(`/companies/${enc(id)}`),
    update: (id, payload) => request.patch(`/companies/${enc(id)}`, payload),
};
export const branchesApi = {
    list: (params) => request.get('/branches', params),
    get: (id) => request.get(`/branches/${enc(id)}`),
    create: (payload) => request.post('/branches', payload),
    update: (id, payload) => request.patch(`/branches/${enc(id)}`, payload),
    remove: (id) => request.delete(`/branches/${enc(id)}`),
};
export const usersApi = {
    list: (params) => request.get('/users', params),
    get: (id) => request.get(`/users/${enc(id)}`),
    create: (payload) => request.post('/users', payload),
    update: (id, payload) => request.patch(`/users/${enc(id)}`, payload),
    delete: (id) => request.delete(`/users/${enc(id)}`),
    remove: (id) => request.delete(`/users/${enc(id)}`),
};
export const rolesApi = {
    list: (params) => request.get('/roles', params),
    get: (id) => request.get(`/roles/${enc(id)}`),
    updatePermissions: (id, payload) => request.put(`/roles/${enc(id)}/permissions`, payload),
};
export const userRolesApi = rolesApi;
export const permissionsApi = {
    list: (params) => request.get('/permissions', params),
    byRole: (roleId) => rolesApi.get(roleId).then((response) => response?.data?.role?.permissions ?? []),
    updateRolePermissions: (roleId, permissionIds) => rolesApi.updatePermissions(roleId, {
        permission_ids: permissionIds,
    }),
};
export const navigationApi = {
    list: () => request.get('/navigation').then((response) => response?.data?.navigation ?? []),
    modules: () => request.get('/navigation/modules').then((response) => response?.data?.modules ?? []),
    toggleModule: (payload) => request.post('/navigation/modules/toggle', payload),
    bulkToggleModules: (payload) => request.post('/navigation/modules/bulk', payload),
};
export const modulesApi = {
    list: () => navigationApi.modules(),
    toggle: (codeOrId, is_enabled) => {
        const payload = typeof codeOrId === 'number'
            ? { module_id: codeOrId, is_enabled }
            : { item_code: codeOrId, is_enabled };
        return navigationApi.toggleModule(payload);
    },
    bulkUpdate: (modules) => navigationApi.bulkToggleModules({ modules }),
};
const masterList = (key) => mastersApi.all().then((response) => response?.data?.[key] ?? response?.[key] ?? []);
export const userTypeMastersApi = {
    list: () => masterList('user_types'),
};
export const accessLevelMastersApi = {
    list: () => masterList('access_levels'),
};
export const userStatusesApi = {
    list: () => masterList('user_statuses'),
};

export const clientsApi = {
    ...crud('/clients'),
    addresses: nestedCrud((clientId) => `/clients/${enc(clientId)}/addresses`),
    contacts: nestedCrud((clientId) => `/clients/${enc(clientId)}/contacts`),
    documents: {
        ...nestedCrud((clientId) => `/clients/${enc(clientId)}/documents`),
        upload: (clientId, payload) => request.upload(`/clients/${enc(clientId)}/documents`, payload),
        download: (clientId, documentId) => request.download(`/clients/${enc(clientId)}/documents/${enc(documentId)}/download`),
    },
};
export const clientStatusesApi = {
    list: () => masterList('client_statuses'),
};
export const clientSourcesApi = {
    list: () => masterList('client_sources'),
};
export const clientDocumentsApi = { ...crud('/client-documents') };
export const clientContactsApi = { ...crud('/client-contacts') };
export const clientAddressesApi = { ...crud('/client-addresses') };

export const projectsApi = {
    ...crud('/projects'),
    statusHistory: (id, params) => request.get(`/projects/${enc(id)}/status-history`, params),
    changeStatus: (id, payload) => request.post(`/projects/${enc(id)}/change-status`, payload),
    teamMembers: nestedCrud((projectId) => `/projects/${enc(projectId)}/team-members`),
};
export const projectTypesApi = { ...crud('/project-types') };
export const financialYearsApi = { ...crud('/financial-years') };
export const unitsApi = { ...crud('/units-of-measurement') };
export const workCategoriesApi = { ...crud('/work-categories') };

export const sitesApi = {
    ...crud('/sites'),
    statusHistory: (id, params) => request.get(`/sites/${enc(id)}/status-history`, params),
    changeStatus: (id, payload) => request.post(`/sites/${enc(id)}/change-status`, payload),
    dashboard: (id, params) => request.get(`/sites/${enc(id)}/dashboard`, params),
    teamMembers: nestedCrud((siteId) => `/sites/${enc(siteId)}/team-members`),
    formMasters: () => request.get('/site-form-masters').catch(() => request.get('/sites/form-masters')),
    mapLocations: () => request.get('/site-map-locations').catch(() => request.get('/sites/map-locations')),
};
export const siteZonesApi = { ...crud('/site-zones') };
export const workLocationsApi = { ...crud('/work-locations') };
export const projectDocumentsApi = {
    list: (params) => request.get('/project-documents', params),
    get: (id, params) => request.get(`/project-documents/${enc(id)}`, params),
    create: (payload) => request.upload('/project-documents', payload),
    upload: (payload) => request.upload('/project-documents', payload),
    update: (id, payload) => request.patch(`/project-documents/${enc(id)}`, payload),
    replace: (id, payload) => request.put(`/project-documents/${enc(id)}`, payload),
    download: (id) => request.download(`/project-documents/${enc(id)}/download`),
    remove: (id) => request.delete(`/project-documents/${enc(id)}`),
};
export const projectMilestonesApi = {
    ...crud('/project-milestones'),
};

export const boqApi = {
    ...crud('/project-boqs'),
    dashboard: (params) => request.get('/project-boqs/dashboard', params),
    submit: (id, payload) => action('/project-boqs', id, 'submit', payload),
    approve: (id, payload) => action('/project-boqs', id, 'approve', payload),
    reject: (id, payload) => action('/project-boqs', id, 'reject', payload),
    importItems: (boqId, payload) => request.post(`/project-boqs/${enc(boqId)}/import-items`, payload),
    batchUpdateItems: (boqId, payload) => request.post(`/project-boqs/${enc(boqId)}/batch-items`, payload),
    revisions: {
        list: (boqId) => request.get(`/project-boqs/${enc(boqId)}/revisions`),
        create: (boqId, payload) => request.post(`/project-boqs/${enc(boqId)}/revisions`, payload),
    },
    variations: {
        list: (boqId) => request.get(`/project-boqs/${enc(boqId)}/variations`),
        create: (boqId, payload) => request.post(`/project-boqs/${enc(boqId)}/variations`, payload),
    },
    sections: nestedCrud((boqId) => `/project-boqs/${enc(boqId)}/sections`),
    items: {
        ...nestedCrud((boqId) => `/project-boqs/${enc(boqId)}/items`),
        executionHistory: (boqId, itemId) => request.get(`/project-boqs/${enc(boqId)}/items/${enc(itemId)}/execution-history`),
    },
    rateComponents: {
        list: (boqId, itemId, params) => request.get(`/project-boqs/${enc(boqId)}/items/${enc(itemId)}/rate-components`, params),
        get: (boqId, itemId, id) => request.get(`/project-boqs/${enc(boqId)}/items/${enc(itemId)}/rate-components/${enc(id)}`),
        create: (boqId, itemId, payload) => request.post(`/project-boqs/${enc(boqId)}/items/${enc(itemId)}/rate-components`, payload),
        update: (boqId, itemId, id, payload) => request.patch(`/project-boqs/${enc(boqId)}/items/${enc(itemId)}/rate-components/${enc(id)}`, payload),
        remove: (boqId, itemId, id) => request.delete(`/project-boqs/${enc(boqId)}/items/${enc(itemId)}/rate-components/${enc(id)}`),
    },
};
export const projectBoqsApi = boqApi;

export const budgetsApi = {
    ...crud('/project-budgets'),
    submit: (id, payload) => action('/project-budgets', id, 'submit', payload),
    approve: (id, payload) => action('/project-budgets', id, 'approve', payload),
    reject: (id, payload) => action('/project-budgets', id, 'reject', payload),
    approvalHistory: (id, params) => request.get(`/project-budgets/${enc(id)}/approval-history`, params),
    lines: nestedCrud((budgetId) => `/project-budgets/${enc(budgetId)}/lines`),
    revisions: {
        ...nestedCrud((budgetId) => `/project-budgets/${enc(budgetId)}/revisions`),
        submit: (budgetId, revisionId, payload) => request.post(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/submit`, payload),
        approve: (budgetId, revisionId, payload) => request.post(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/approve`, payload),
        reject: (budgetId, revisionId, payload) => request.post(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/reject`, payload),
        history: (budgetId, revisionId, params) => request.get(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/history`, params),
        createLine: (budgetId, revisionId, payload) => request.post(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/lines`, payload),
        updateLine: (budgetId, revisionId, lineId, payload) => request.patch(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/lines/${enc(lineId)}`, payload),
        removeLine: (budgetId, revisionId, lineId) => request.delete(`/project-budgets/${enc(budgetId)}/revisions/${enc(revisionId)}/lines/${enc(lineId)}`),
    },
};

export const labourApi = {
    masters: (params) => request.get('/labour/masters', params),
    categories: crud('/labour/categories'),
    contractors: crud('/labour/contractors'),
    workers: {
        ...crud('/labour/workers'),
        documents: {
            list: (workerId, params) => request.get(`/labour/workers/${enc(workerId)}/documents`, params),
            upload: (workerId, payload) => request.upload(`/labour/workers/${enc(workerId)}/documents`, payload),
            update: (workerId, documentId, payload) => request.patch(`/labour/workers/${enc(workerId)}/documents/${enc(documentId)}`, payload),
            verify: (workerId, documentId, payload) => request.post(`/labour/workers/${enc(workerId)}/documents/${enc(documentId)}/verify`, payload),
            remove: (workerId, documentId) => request.delete(`/labour/workers/${enc(workerId)}/documents/${enc(documentId)}`),
        },
    },
    assignments: crud('/labour/assignments'),
};

export const attendanceApi = {
    list: (params) => request.get('/labour-attendance', params),
    get: (id) => request.get(`/labour-attendance/${enc(id)}`),
    create: (payload) => request.post('/labour-attendance', payload),
    createEntry: (registerId, payload) => request.post(`/labour-attendance/${enc(registerId)}/entries`, payload),
    updateEntry: (registerId, entryId, payload) => request.patch(`/labour-attendance/${enc(registerId)}/entries/${enc(entryId)}`, payload),
    removeEntry: (registerId, entryId) => request.delete(`/labour-attendance/${enc(registerId)}/entries/${enc(entryId)}`),
    submit: (id, payload) => action('/labour-attendance', id, 'submit', payload),
    approve: (id, payload) => action('/labour-attendance', id, 'approve', payload),
    reject: (id, payload) => action('/labour-attendance', id, 'reject', payload),
    lock: (id, payload) => action('/labour-attendance', id, 'lock', payload),
    exceptions: {
        ...crud('/labour-attendance/exceptions'),
        submit: (id, payload) => action('/labour-attendance/exceptions', id, 'submit', payload),
        approve: (id, payload) => action('/labour-attendance/exceptions', id, 'approve', payload),
        reject: (id, payload) => action('/labour-attendance/exceptions', id, 'reject', payload),
    },
};

export const wagesApi = {
    list: (params) => request.get('/labour-wages', params),
    get: (id) => request.get(`/labour-wages/${enc(id)}`),
    create: (payload) => request.post('/labour-wages', payload),
    update: (id, payload) => request.patch(`/labour-wages/${enc(id)}`, payload),
    replace: (id, payload) => request.put(`/labour-wages/${enc(id)}`, payload),
    calculate: (id, payload) => action('/labour-wages', id, 'calculate', payload),
    updateLine: (id, lineId, payload) => request.patch(`/labour-wages/${enc(id)}/lines/${enc(lineId)}`, payload),
    submit: (id, payload) => action('/labour-wages', id, 'submit', payload),
    approve: (id, payload) => action('/labour-wages', id, 'approve', payload),
    cancel: (id, payload) => action('/labour-wages', id, 'cancel', payload),
};

export const dailyWagesApi = {
    setup: (params) => request.get('/daily-wages/setup', params),
    list: (params) => request.get('/daily-wages', params),
    get: (id) => request.get(`/daily-wages/${enc(id)}`),
    create: (payload) => request.post('/daily-wages', payload),
    update: (id, payload) => request.patch(`/daily-wages/${enc(id)}`, payload),
    replace: (id, payload) => request.put(`/daily-wages/${enc(id)}`, payload),
    cancel: (id) => action('/daily-wages', id, 'cancel'),
    approve: (id, payload) => action('/daily-wages', id, 'approve', payload),
    pay: (id, payload) => action('/daily-wages', id, 'pay', payload),
    templates: (params) => request.get('/daily-wages/templates', params),
    createTemplate: (payload) => request.post('/daily-wages/templates', payload),
    updateTemplate: (id, payload) => request.patch(`/daily-wages/templates/${enc(id)}`, payload),
    weeklyReport: (params) => request.get('/daily-wages/weekly-report', params),
};
export const subWorkApi = dailyWagesApi;


export const labourPaymentsApi = {
    list: (params) => request.get('/labour-payments', params),
    get: (id) => request.get(`/labour-payments/${enc(id)}`),
    create: (payload) => request.post('/labour-payments', payload),
    submit: (id, payload) => action('/labour-payments', id, 'submit', payload),
    approve: (id, payload) => action('/labour-payments', id, 'approve', payload),
    markPaid: (id, payload) => action('/labour-payments', id, 'mark-paid', payload),
    cancel: (id, payload) => action('/labour-payments', id, 'cancel', payload),
};

export const labourContractorBillsApi = {
    masters: () => request.get('/labour-contractor-bills/masters'),
    ...crud('/labour-contractor-bills'),
    addEntry: (id, payload) => request.post(`/labour-contractor-bills/${enc(id)}/entries`, payload),
    updateEntry: (id, entryId, payload) => request.patch(`/labour-contractor-bills/${enc(id)}/entries/${enc(entryId)}`, payload),
    removeEntry: (id, entryId) => request.delete(`/labour-contractor-bills/${enc(id)}/entries/${enc(entryId)}`),
    submit: (id, payload) => action('/labour-contractor-bills', id, 'submit', payload),
    verify: (id, payload) => action('/labour-contractor-bills', id, 'verify', payload),
    reject: (id, payload) => action('/labour-contractor-bills', id, 'reject', payload),
    price: (id, payload) => action('/labour-contractor-bills', id, 'price', payload),
    addCharge: (id, payload) => request.post(`/labour-contractor-bills/${enc(id)}/charges`, payload),
    updateCharge: (id, chargeId, payload) => request.patch(`/labour-contractor-bills/${enc(id)}/charges/${enc(chargeId)}`, payload),
    removeCharge: (id, chargeId) => request.delete(`/labour-contractor-bills/${enc(id)}/charges/${enc(chargeId)}`),
    approve: (id, payload) => action('/labour-contractor-bills', id, 'approve', payload),
    recordPayment: (id, payload) => request.post(`/labour-contractor-bills/${enc(id)}/payments`, payload),
    printUrl: (id) => `${api.defaults.baseURL}/labour-contractor-bills/${enc(id)}/print`,
};

export const materialsApi = {
    masters: (params) => request.get('/materials/masters', params),
    categories: crud('/materials/categories'),
    catalogue: crud('/materials/catalogue'),
    suppliers: crud('/materials/suppliers'),
};

const materialDocument = (type) => ({
    ...crud(`/material-management/${type}`),
    addItem: (id, payload) => request.post(`/material-management/${type}/${enc(id)}/items`, payload),
    updateItem: (id, itemId, payload) => request.patch(`/material-management/${type}/${enc(id)}/items/${enc(itemId)}`, payload),
    removeItem: (id, itemId) => request.delete(`/material-management/${type}/${enc(id)}/items/${enc(itemId)}`),
    action: (id, name, payload) => action(`/material-management/${type}`, id, name, payload),
});

export const materialManagementApi = {
    requests: materialDocument('requests'),
    purchaseOrders: materialDocument('purchase-orders'),
    receipts: {
        ...materialDocument('receipts'),
        inspect: (id, payload) => action('/material-management/receipts', id, 'inspect', payload),
        post: (id, payload) => action('/material-management/receipts', id, 'post', payload),
    },
    transactions: {
        ...materialDocument('transactions'),
        post: (id, payload) => action('/material-management/transactions', id, 'post', payload),
    },
    stock: (params) => request.get('/material-management/stock', params),
    exportStock: (params) => request.download('/material-management/stock/export', params),
    ledger: (params) => request.get('/material-management/ledger', params),
};

export const procurementApi = {
    purchaseOrders: materialDocument('purchase-orders'),
    requisitions: materialDocument('requests'),
    receipts: {
        ...materialDocument('receipts'),
        inspect: (id, payload) => action('/material-management/receipts', id, 'inspect', payload),
        post: (id, payload) => action('/material-management/receipts', id, 'post', payload),
    },
    transactions: {
        ...materialDocument('transactions'),
        post: (id, payload) => action('/material-management/transactions', id, 'post', payload),
    },
    rfq: crud('/procurement/rfq'),
    quotations: crud('/procurement/quotations'),
    invoices: crud('/procurement/vendor-invoices'),
    returns: crud('/procurement/returns'),
};

const dailyEntry = (type) => ({
    list: (reportId, params) => request.get(`/daily-site-reports/${enc(reportId)}/${type}`, params),
    get: (reportId, id) => request.get(`/daily-site-reports/${enc(reportId)}/${type}/${enc(id)}`),
    create: (reportId, payload) => request.post(`/daily-site-reports/${enc(reportId)}/${type}`, payload),
    update: (reportId, id, payload) => request.patch(`/daily-site-reports/${enc(reportId)}/${type}/${enc(id)}`, payload),
    remove: (reportId, id) => request.delete(`/daily-site-reports/${enc(reportId)}/${type}/${enc(id)}`),
});

export const dailyReportsApi = {
    masters: (params) => request.get('/daily-operations/masters', params),
    ...crud('/daily-site-reports'),
    submit: (id, payload) => action('/daily-site-reports', id, 'submit', payload),
    review: (id, payload) => action('/daily-site-reports', id, 'review', payload),
    approve: (id, payload) => action('/daily-site-reports', id, 'approve', payload),
    reject: (id, payload) => action('/daily-site-reports', id, 'reject', payload),
    reopen: (id, payload) => action('/daily-site-reports', id, 'reopen', payload),
    cancel: (id, payload) => action('/daily-site-reports', id, 'cancel', payload),
    workProgress: {
        ...dailyEntry('work-progress'),
        inspect: (reportId, id, payload) => request.post(`/daily-site-reports/${enc(reportId)}/work-progress/${enc(id)}/inspect`, payload),
    },
    manpower: dailyEntry('manpower'),
    equipment: dailyEntry('equipment'),
    weather: dailyEntry('weather'),
    issues: dailyEntry('issues'),
    visitors: dailyEntry('visitors'),
    materialConsumption: dailyEntry('material-consumption'),
    photos: {
        upload: (reportId, payload) => request.upload(`/daily-site-reports/${enc(reportId)}/photos`, payload),
        update: (reportId, photoId, payload) => request.patch(`/daily-site-reports/${enc(reportId)}/photos/${enc(photoId)}`, payload),
        download: (reportId, photoId) => request.download(`/daily-site-reports/${enc(reportId)}/photos/${enc(photoId)}/download`),
        remove: (reportId, photoId) => request.delete(`/daily-site-reports/${enc(reportId)}/photos/${enc(photoId)}`),
    },
};

const subcontractDocument = (type, hasItems = true) => ({
    ...crud(`/subcontracts/${type}`),
    ...(hasItems ? {
        addItem: (id, payload) => request.post(`/subcontracts/${type}/${enc(id)}/items`, payload),
        updateItem: (id, itemId, payload) => request.patch(`/subcontracts/${type}/${enc(id)}/items/${enc(itemId)}`, payload),
    } : {}),
    action: (id, name, payload) => action(`/subcontracts/${type}`, id, name, payload),
});

export const subcontractsApi = {
    masters: (params) => request.get('/subcontracts/masters', params),
    contractors: {
        ...crud('/subcontracts/contractors'),
        templates: (id) => request.get(`/subcontracts/contractors/${enc(id)}/templates`),
        delete: (id) => request.delete(`/subcontracts/contractors/${enc(id)}`),
        toggleStatus: (id) => request.post(`/subcontracts/contractors/${enc(id)}/toggle-status`),
        uploadDocument: (id, payload) => request.upload(`/subcontracts/contractors/${enc(id)}/documents`, payload),
        verifyDocument: (id, documentId, payload) => request.post(`/subcontracts/contractors/${enc(id)}/documents/${enc(documentId)}/verify`, payload),
    },
    workOrders: {
        ...subcontractDocument('work-orders'),
        integrations: (id, params) => request.get(`/subcontracts/work-orders/${enc(id)}/integrations`, params),
    },
    measurements: subcontractDocument('measurements'),
    raBills: subcontractDocument('ra-bills'),
    payments: subcontractDocument('payments', false),
    weeklyPayments: subcontractDocument('weekly-payments', false),
};

export const expensesApi = {
    masters: (params) => request.get('/expenses/masters', params),
    categories: {
        list: (params) => request.get('/expenses/categories', params),
        create: (payload) => request.post('/expenses/categories', payload),
        update: (id, payload) => request.patch(`/expenses/categories/${enc(id)}`, payload),
    },
    requests: {
        list: (params) => request.get('/expenses/requests', params),
        get: (id) => request.get(`/expenses/requests/${enc(id)}`),
        create: (payload) => request.post('/expenses/requests', payload),
        update: (id, payload) => request.patch(`/expenses/requests/${enc(id)}`, payload),
        addItem: (id, payload) => request.post(`/expenses/requests/${enc(id)}/items`, payload),
        action: (id, name, payload) => action('/expenses/requests', id, name, payload),
    },
    bills: {
        list: (params) => request.get('/expenses/bills', params),
        get: (id) => request.get(`/expenses/bills/${enc(id)}`),
        create: (payload) => request.post('/expenses/bills', payload),
        update: (id, payload) => request.patch(`/expenses/bills/${enc(id)}`, payload),
        addItem: (id, payload) => request.post(`/expenses/bills/${enc(id)}/items`, payload),
        uploadDocument: (id, payload) => request.upload(`/expenses/bills/${enc(id)}/documents`, payload),
        allocate: (id, itemId, payload) => request.post(`/expenses/bills/${enc(id)}/items/${enc(itemId)}/allocations`, payload),
        action: (id, name, payload) => action('/expenses/bills', id, name, payload),
    },
    payments: {
        list: (params) => request.get('/expenses/payments', params),
        get: (id) => request.get(`/expenses/payments/${enc(id)}`),
        create: (payload) => request.post('/expenses/payments', payload),
        update: (id, payload) => request.patch(`/expenses/payments/${enc(id)}`, payload),
        action: (id, name, payload) => action('/expenses/payments', id, name, payload),
    },
};

export const projectCostingApi = {
    summary: (projectId, params) => request.get(`/project-costing/projects/${enc(projectId)}/summary`, params),
    snapshots: (params) => request.get('/project-costing/snapshots', params),
    generateSnapshot: (payload) => request.post('/project-costing/snapshots/generate', payload),
};

export const approvalsApi = {
    list: (params) => request.get('/approvals', params),
    summary: (params) => request.get('/approvals/summary', params),
    history: (params) => request.get('/approvals/history', params),
    get: (type, id, params) => request.get(`/approvals/${enc(type)}/${enc(id)}`, params),
    action: (type, id, name, payload) => request.post(`/approvals/${enc(type)}/${enc(id)}/${enc(name)}`, payload),
};

export const notificationsApi = {
    list: (params) => request.get('/notifications', params),
    markRead: (id) => request.patch(`/notifications/${enc(id)}/read`),
    markAllRead: () => request.patch('/notifications/read-all'),
};

export const dashboardApi = {
    masters: (params) => request.get('/dashboard/masters', params),
    overview: (params) => request.get('/dashboard/overview', params),
    projectPerformance: (params) => request.get('/dashboard/project-performance', params),
    alerts: (params) => request.get('/dashboard/alerts', params),
    createAlert: (payload) => request.post('/dashboard/alerts', payload),
    alertAction: (id, name, payload) => request.post(`/dashboard/alerts/${enc(id)}/${enc(name)}`, payload),
};

export const reportsApi = {
    dailyProgress: (params) => request.get('/reports/daily-progress', params),
    projectCost: (params) => request.get('/reports/project-cost', params),
    labour: (params) => request.get('/reports/labour', params),
    materials: (params) => request.get('/reports/materials', params),
    subcontracts: (params) => request.get('/reports/subcontracts', params),
    expenses: (params) => request.get('/reports/expenses', params),
};

export const managementReviewsApi = {
    list: (params) => request.get('/management-reviews', params),
    create: (payload) => request.post('/management-reviews', payload),
    action: (id, name, payload) => request.post(`/management-reviews/${enc(id)}/${enc(name)}`, payload),
};

export const systemAdminApi = {
    masters: (params) => request.get('/system-admin/masters', params),
    integrity: (params) => request.get('/system-admin/integrity', params),
    notificationSummary: (params) => request.get('/system-admin/notifications/summary', params),
    notifications: (params) => request.get('/system-admin/notifications', params),
    auditLogs: (params) => request.get('/system-admin/audit-logs', params),
    recordAudit: (payload) => request.post('/system-admin/audit-logs', payload),
    auditDetail: (id) => request.get(`/system-admin/audit-logs/${enc(id)}`),
    loginHistory: (params) => request.get('/system-admin/login-history', params),
};

// ═══════════════════════════════════════════════════════════════════
// Module 13 — Employee GPS Attendance & Payroll
// ═══════════════════════════════════════════════════════════════════

export const employeeAttendanceApi = {
    // GPS Check-In / Check-Out
    checkIn: (payload) => request.post('/employee-attendance/check-in', payload),
    checkOut: (payload) => request.post('/employee-attendance/check-out', payload),
    todayStatus: (params) => request.get('/employee-attendance/today', params),

    // Attendance Register
    list: (params) => request.get('/employee-attendance', params),
    monthlySummary: (params) => request.get('/employee-attendance/monthly-summary', params),

    // Corrections
    corrections: (params) => request.get('/employee-attendance/corrections', params),
    createCorrection: (payload) => request.post('/employee-attendance/corrections', payload),
    reviewCorrection: (id, payload) => request.post(`/employee-attendance/corrections/${enc(id)}/review`, payload),

    // Overtime
    overtime: (params) => request.get('/employee-attendance/overtime', params),
    reviewOvertime: (id, payload) => request.post(`/employee-attendance/overtime/${enc(id)}/review`, payload),

    // Site Attendance Settings
    settings: (params) => request.get('/employee-attendance/settings', params),
    saveSettings: (payload) => request.post('/employee-attendance/settings', payload),

    // Employee Site Assignments
    assignments: (params) => request.get('/employee-attendance/assignments', params),
    saveAssignment: (payload) => request.post('/employee-attendance/assignments', payload),

    // Holidays
    holidays: (params) => request.get('/employee-attendance/holidays', params),
    saveHoliday: (payload) => request.post('/employee-attendance/holidays', payload),
    deleteHoliday: (id) => request.delete(`/employee-attendance/holidays/${enc(id)}`),
};

export const employeeLeaveApi = {
    // Leave Types
    leaveTypes: (params) => request.get('/employee-leaves/types', params),
    saveLeaveType: (payload) => request.post('/employee-leaves/types', payload),

    // Leave Balances
    leaveBalances: (params) => request.get('/employee-leaves/balances', params),
    saveLeaveBalance: (payload) => request.post('/employee-leaves/balances', payload),

    // Leave Requests
    leaveRequests: (params) => request.get('/employee-leaves/requests', params),
    createLeaveRequest: (payload) => request.post('/employee-leaves/requests', payload),
    reviewLeaveRequest: (id, payload) => request.post(`/employee-leaves/requests/${enc(id)}/review`, payload),

    // Permission Requests
    permissionRequests: (params) => request.get('/employee-leaves/permissions', params),
    createPermissionRequest: (payload) => request.post('/employee-leaves/permissions', payload),
    reviewPermissionRequest: (id, payload) => request.post(`/employee-leaves/permissions/${enc(id)}/review`, payload),
};

export const employeePayrollApi = {
    // Salary Structures
    salaryStructures: (params) => request.get('/employee-payroll/salary-structures', params),
    saveSalaryStructure: (payload) => request.post('/employee-payroll/salary-structures', payload),

    // Advances & Loans
    advances: (params) => request.get('/employee-payroll/advances', params),
    saveAdvance: (payload) => request.post('/employee-payroll/advances', payload),

    // Payroll
    generate: (payload) => request.post('/employee-payroll/generate', payload),
    list: (params) => request.get('/employee-payroll', params),
    get: (id) => request.get(`/employee-payroll/${enc(id)}`),
    summary: (params) => request.get('/employee-payroll/summary', params),

    // Payroll Actions
    approve: (id) => request.post(`/employee-payroll/${enc(id)}/approve`),
    lock: (id) => request.post(`/employee-payroll/${enc(id)}/lock`),
    reopen: (id) => request.post(`/employee-payroll/${enc(id)}/reopen`),
    bulkApprove: (payload) => request.post('/employee-payroll/bulk-approve', payload),
    bulkLock: (payload) => request.post('/employee-payroll/bulk-lock', payload),

    // Dashboard Stats
    dashboardStats: (params) => request.get('/employee-payroll/dashboard-stats', params),
};

export const subcontractorTypesApi = {
    list: (params) => request.get('/subcontracts/types', params),
    create: (data) => request.post('/subcontracts/types', data),
    update: (id, data) => request.put(`/subcontracts/types/${enc(id)}`, data),
    delete: (id) => request.delete(`/subcontracts/types/${enc(id)}`),

    templates: (typeId) => request.get(`/subcontracts/types/${enc(typeId)}/templates`),
    createTemplate: (typeId, data) => request.post(`/subcontracts/types/${enc(typeId)}/templates`, data),
    updateTemplate: (typeId, id, data) => request.put(`/subcontracts/types/${enc(typeId)}/templates/${enc(id)}`, data),
    deleteTemplate: (typeId, id) => request.delete(`/subcontracts/types/${enc(typeId)}/templates/${enc(id)}`),
    reorderTemplates: (typeId, itemIds) => request.post(`/subcontracts/types/${enc(typeId)}/templates/reorder`, { item_ids: itemIds }),
};

export default api;

