<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

service('auth')->routes($routes);

$routes->options('api/(:any)', static function () {
    return service('response')->setStatusCode(204);
});

// Module 11 - Dashboard and Reports API routes.
$routes->group('api/dashboard', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    $routes->get('masters', 'DashboardReportsController::masters', ['filter' => 'apiPermission:dashboard.view']);
    $routes->get('overview', 'DashboardReportsController::overview', ['filter' => 'apiPermission:dashboard.view']);
    $routes->get('project-performance', 'DashboardReportsController::projectPerformance', ['filter' => 'apiPermission:dashboard.view']);
    $routes->get('alerts', 'DashboardReportsController::alerts', ['filter' => 'apiPermission:alert.view']);
    $routes->post('alerts', 'DashboardReportsController::createAlert', ['filter' => 'apiPermission:alert.create']);
    $routes->post('alerts/(:num)/(:segment)', 'DashboardReportsController::alertAction/$1/$2', ['filter' => 'apiPermission:alert.manage']);
});
$routes->group('api/reports', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    $routes->get('daily-progress', 'DashboardReportsController::dailyProgress', ['filter' => 'apiPermission:report.view']);
    $routes->get('project-cost', 'DashboardReportsController::costReport', ['filter' => 'apiPermission:report.view']);
    $routes->get('labour', 'DashboardReportsController::labourReport', ['filter' => 'apiPermission:report.view']);
    $routes->get('materials', 'DashboardReportsController::materialReport', ['filter' => 'apiPermission:report.view']);
    $routes->get('subcontracts', 'DashboardReportsController::subcontractReport', ['filter' => 'apiPermission:report.view']);
    $routes->get('expenses', 'DashboardReportsController::expenseReport', ['filter' => 'apiPermission:report.view']);
});
$routes->group('api/management-reviews', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    $routes->get('', 'DashboardReportsController::reviews', ['filter' => 'apiPermission:management_review.view']);
    $routes->post('', 'DashboardReportsController::createReview', ['filter' => 'apiPermission:management_review.manage']);
    $routes->post('(:num)/(:segment)', 'DashboardReportsController::reviewAction/$1/$2', ['filter' => 'apiPermission:management_review.manage']);
});

$routes->group('api/auth', static function ($routes): void {
    // Public endpoint
    $routes->post('login', 'Api\AuthController::login');

    // Protected endpoints
    $routes->group('', ['filter' => 'apiAuth'], static function ($routes): void {
        $routes->get('me', 'Api\AuthController::me');
        $routes->post('logout', 'Api\AuthController::logout');
        $routes->post(
            'change-password',
            'Api\AuthController::changePassword'
        );
    });
});

$routes->group(
    'api/masters',
    [
        'namespace' => 'App\Controllers\Api',
    ],
    static function ($routes): void {
        $routes->get('', 'MastersController::index');
    }
);

// Database-driven navigation and the canonical permission catalogue.
$routes->group(
    'api/navigation',
    ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'],
    static function ($routes): void {
        $routes->get('', 'NavigationController::index');
        $routes->get('modules', 'NavigationController::modules');
        $routes->post('modules/toggle', 'NavigationController::toggleModule');
        $routes->post('modules/bulk', 'NavigationController::bulkToggle');
    }
);

$routes->group(
    'api/permissions',
    ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'],
    static function ($routes): void {
        $routes->get('', 'PermissionsController::index', [
            'filter' => 'apiPermission:role.view',
        ]);
    }
);

// Module 9 - Project Expenses and Costing API routes.
$routes->group('api/expenses', ['namespace' => 'App\Controllers\Api', 'filter' => 'apiAuth'], static function ($routes) {
    $routes->get('masters', 'ExpenseMastersController::index', ['filter' => 'apiPermission:expenses.view']);

    $routes->get('categories', 'ExpenseMastersController::categories', ['filter' => 'apiPermission:expenses.view']);
    $routes->post('categories', 'ExpenseMastersController::createCategory', ['filter' => 'apiPermission:expenses.request']);
    $routes->patch('categories/(:num)', 'ExpenseMastersController::updateCategory/$1', ['filter' => 'apiPermission:expenses.request']);

    $routes->get('requests', 'ExpenseRequestsController::index', ['filter' => 'apiPermission:expenses.view']);
    $routes->get('requests/(:num)', 'ExpenseRequestsController::show/$1', ['filter' => 'apiPermission:expenses.view']);
    $routes->post('requests', 'ExpenseRequestsController::create', ['filter' => 'apiPermission:expenses.request']);
    $routes->patch('requests/(:num)', 'ExpenseRequestsController::update/$1', ['filter' => 'apiPermission:expenses.request']);
    $routes->post('requests/(:num)/items', 'ExpenseRequestsController::addItem/$1', ['filter' => 'apiPermission:expenses.request']);
    $routes->post('requests/(:num)/submit', 'ExpenseRequestsController::action/$1/submit', ['filter' => 'apiPermission:expenses.submit']);
    $routes->post('requests/(:num)/approve', 'ExpenseRequestsController::action/$1/approve', ['filter' => 'apiPermission:expenses.approve_request']);
    $routes->post('requests/(:num)/reject', 'ExpenseRequestsController::action/$1/reject', ['filter' => 'apiPermission:expenses.approve_request']);
    $routes->post('requests/(:num)/cancel', 'ExpenseRequestsController::action/$1/cancel', ['filter' => 'apiPermission:expenses.cancel']);

    $routes->get('bills', 'ExpenseBillsController::index', ['filter' => 'apiPermission:expenses.view']);
    $routes->get('bills/(:num)', 'ExpenseBillsController::show/$1', ['filter' => 'apiPermission:expenses.view']);
    $routes->post('bills', 'ExpenseBillsController::create', ['filter' => 'apiPermission:expenses.create_bill']);
    $routes->patch('bills/(:num)', 'ExpenseBillsController::update/$1', ['filter' => 'apiPermission:expenses.create_bill']);
    $routes->post('bills/(:num)/items', 'ExpenseBillsController::addItem/$1', ['filter' => 'apiPermission:expenses.create_bill']);
    $routes->post('bills/(:num)/documents', 'ExpenseBillsController::addDocument/$1', ['filter' => 'apiPermission:expenses.create_bill']);
    $routes->post('bills/(:num)/items/(:num)/allocations', 'ExpenseBillsController::allocate/$1/$2', ['filter' => 'apiPermission:expenses.create_bill']);
    $routes->post('bills/(:num)/submit', 'ExpenseBillsController::action/$1/submit', ['filter' => 'apiPermission:expenses.submit']);
    $routes->post('bills/(:num)/approve', 'ExpenseBillsController::action/$1/approve', ['filter' => 'apiPermission:expenses.approve_bill']);
    $routes->post('bills/(:num)/reject', 'ExpenseBillsController::action/$1/reject', ['filter' => 'apiPermission:expenses.approve_bill']);
    $routes->post('bills/(:num)/post', 'ExpenseBillsController::action/$1/post', ['filter' => 'apiPermission:expenses.post_bill']);
    $routes->post('bills/(:num)/cancel', 'ExpenseBillsController::action/$1/cancel', ['filter' => 'apiPermission:expenses.cancel']);

    $routes->get('payments', 'ExpensePaymentsController::index', ['filter' => 'apiPermission:expense_payments.view']);
    $routes->get('payments/(:num)', 'ExpensePaymentsController::show/$1', ['filter' => 'apiPermission:expense_payments.view']);
    $routes->post('payments', 'ExpensePaymentsController::create', ['filter' => 'apiPermission:expense_payments.create']);
    $routes->patch('payments/(:num)', 'ExpensePaymentsController::update/$1', ['filter' => 'apiPermission:expense_payments.create']);
    $routes->post('payments/(:num)/submit', 'ExpensePaymentsController::action/$1/submit', ['filter' => 'apiPermission:expense_payments.create']);
    $routes->post('payments/(:num)/approve', 'ExpensePaymentsController::action/$1/approve', ['filter' => 'apiPermission:expense_payments.approve']);
    $routes->post('payments/(:num)/reject', 'ExpensePaymentsController::action/$1/reject', ['filter' => 'apiPermission:expense_payments.approve']);
    $routes->post('payments/(:num)/mark-paid', 'ExpensePaymentsController::action/$1/mark-paid', ['filter' => 'apiPermission:expense_payments.pay']);
    $routes->post('payments/(:num)/cancel', 'ExpensePaymentsController::action/$1/cancel', ['filter' => 'apiPermission:expenses.cancel']);
});

$routes->group('api/project-costing', ['namespace' => 'App\Controllers\Api', 'filter' => 'apiAuth'], static function ($routes) {
    $routes->get('projects/(:num)/summary', 'ProjectCostingController::summary/$1', ['filter' => 'apiPermission:project_cost.view']);
    $routes->get('snapshots', 'ProjectCostingController::snapshots', ['filter' => 'apiPermission:project_cost.view']);
    $routes->post('snapshots/generate', 'ProjectCostingController::generate', ['filter' => 'apiPermission:project_cost.view']);
});

$routes->group(
    'api/companies',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get(
            '',
            'CompaniesController::index',
            ['filter' => 'apiPermission:company.view']
        );

        $routes->get(
            '(:num)',
            'CompaniesController::show/$1',
            ['filter' => 'apiPermission:company.view']
        );

        $routes->put(
            '(:num)',
            'CompaniesController::update/$1',
            ['filter' => 'apiPermission:company.update']
        );

        $routes->patch(
            '(:num)',
            'CompaniesController::update/$1',
            ['filter' => 'apiPermission:company.update']
        );
    }
);

$routes->group(
    'api/branches',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->post('', 'BranchesController::create', ['filter' => 'apiPermission:branch.create']);
        $routes->match(['put', 'patch'], '(:num)', 'BranchesController::update/$1', ['filter' => 'apiPermission:branch.update']);
        $routes->delete('(:num)', 'BranchesController::delete/$1', ['filter' => 'apiPermission:branch.delete']);

        $routes->get(
            '',
            'BranchesController::index',
            ['filter' => 'apiPermission:branch.view']
        );

        $routes->get(
            '(:num)',
            'BranchesController::show/$1',
            ['filter' => 'apiPermission:branch.view']
        );
    }
);

$routes->group(
    'api/users',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get(
            '',
            'UsersController::index',
            ['filter' => 'apiPermission:user.view']
        );

        $routes->post(
            '',
            'UserManagementController::create',
            ['filter' => 'apiPermission:user.create']
        );

        $routes->get(
            '(:num)',
            'UsersController::show/$1',
            ['filter' => 'apiPermission:user.view']
        );
		
		$routes->put(
			'(:num)',
			'UserManagementController::update/$1',
			['filter' => 'apiPermission:user.update']
		);

		$routes->patch(
			'(:num)',
			'UserManagementController::update/$1',
			['filter' => 'apiPermission:user.update']
		);
    }
);

$routes->group(
    'api/roles',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get(
            '',
            'RolesController::index',
            ['filter' => 'apiPermission:role.view']
        );

        $routes->get(
            '(:num)',
            'RolesController::show/$1',
            ['filter' => 'apiPermission:role.view']
        );

        $routes->put(
            '(:num)/permissions',
            'RolesController::updatePermissions/$1',
            ['filter' => 'apiPermission:role.manage_permissions']
        );
    }
);

$routes->group(
    'api/projects',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'ProjectsController::index', ['filter' => 'apiPermission:project.view']);
        $routes->post('', 'ProjectsController::create', ['filter' => 'apiPermission:project.create']);
        $routes->get('(:num)/team-members', 'ProjectTeamMembersController::index/$1', ['filter' => 'apiPermission:project.view']);
        $routes->post('(:num)/team-members', 'ProjectTeamMembersController::create/$1', ['filter' => 'apiPermission:project.manage_team']);
        $routes->get('(:num)/team-members/(:num)', 'ProjectTeamMembersController::show/$1/$2', ['filter' => 'apiPermission:project.view']);
        $routes->put('(:num)/team-members/(:num)', 'ProjectTeamMembersController::update/$1/$2', ['filter' => 'apiPermission:project.manage_team']);
        $routes->patch('(:num)/team-members/(:num)', 'ProjectTeamMembersController::update/$1/$2', ['filter' => 'apiPermission:project.manage_team']);
        $routes->delete('(:num)/team-members/(:num)', 'ProjectTeamMembersController::delete/$1/$2', ['filter' => 'apiPermission:project.manage_team']);
        $routes->get('(:num)/status-history', 'ProjectsController::statusHistory/$1', ['filter' => 'apiPermission:project.view']);
        $routes->post('(:num)/change-status', 'ProjectsController::changeStatus/$1', ['filter' => 'apiPermission:project.change_status']);
        $routes->get('(:num)', 'ProjectsController::show/$1', ['filter' => 'apiPermission:project.view']);
        $routes->put('(:num)', 'ProjectsController::update/$1', ['filter' => 'apiPermission:project.update']);
        $routes->patch('(:num)', 'ProjectsController::update/$1', ['filter' => 'apiPermission:project.update']);
        $routes->delete('(:num)', 'ProjectsController::delete/$1', ['filter' => 'apiPermission:project.delete']);
    }
);

$routes->get('api/site-form-masters', 'Api\ProjectSitesController::formMasters');
$routes->get('api/site-types', 'Api\ProjectSitesController::siteTypes');
$routes->get('api/site-statuses', 'Api\ProjectSitesController::siteStatuses');
$routes->get('api/site-map-locations', 'Api\ProjectSitesController::mapLocations');

$routes->group(
    'api/sites',
    [
        'namespace' => 'App\\Controllers\\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('form-masters', 'ProjectSitesController::formMasters');
        $routes->get('map-locations', 'ProjectSitesController::mapLocations');
        $routes->get('', 'ProjectSitesController::index', ['filter' => 'apiPermission:site.view']);
        $routes->post('', 'ProjectSitesController::create', ['filter' => 'apiPermission:site.create']);
        $routes->get('(:num)/status-history', 'ProjectSitesController::statusHistory/$1', ['filter' => 'apiPermission:site.view']);
        $routes->post('(:num)/change-status', 'ProjectSitesController::changeStatus/$1', ['filter' => 'apiPermission:site.update']);
        $routes->get('(:num)/dashboard', 'ProjectSitesController::dashboard/$1', ['filter' => 'apiPermission:site.view']);
        $routes->get('(:num)', 'ProjectSitesController::show/$1', ['filter' => 'apiPermission:site.view']);
        $routes->put('(:num)', 'ProjectSitesController::update/$1', ['filter' => 'apiPermission:site.update']);
        $routes->patch('(:num)', 'ProjectSitesController::update/$1', ['filter' => 'apiPermission:site.update']);
        $routes->delete('(:num)', 'ProjectSitesController::delete/$1', ['filter' => 'apiPermission:site.delete']);
    }
);

$routes->group(
    'api/project-documents',
    [
        'namespace' => 'App\\Controllers\\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'ProjectDocumentsController::index', ['filter' => 'apiPermission:project.manage_documents']);
        $routes->post('', 'ProjectDocumentsController::create', ['filter' => 'apiPermission:project.manage_documents']);
        $routes->get('(:num)/download', 'ProjectDocumentsController::download/$1', ['filter' => 'apiPermission:project.manage_documents']);
        $routes->get('(:num)', 'ProjectDocumentsController::show/$1', ['filter' => 'apiPermission:project.manage_documents']);
        $routes->put('(:num)', 'ProjectDocumentsController::update/$1', ['filter' => 'apiPermission:project.manage_documents']);
        $routes->patch('(:num)', 'ProjectDocumentsController::update/$1', ['filter' => 'apiPermission:project.manage_documents']);
        $routes->delete('(:num)', 'ProjectDocumentsController::delete/$1', ['filter' => 'apiPermission:project.manage_documents']);
    }
);

$routes->group('api/project-milestones', ['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'], static function($routes):void {
    $routes->get('', 'ProjectMilestonesController::index', ['filter'=>'apiPermission:project.view']);
    $routes->post('', 'ProjectMilestonesController::create', ['filter'=>'apiPermission:project.update']);
    $routes->get('(:num)', 'ProjectMilestonesController::show/$1', ['filter'=>'apiPermission:project.view']);
    $routes->match(['put','patch'], '(:num)', 'ProjectMilestonesController::update/$1', ['filter'=>'apiPermission:project.update']);
    $routes->delete('(:num)', 'ProjectMilestonesController::delete/$1', ['filter'=>'apiPermission:project.update']);
});

$routes->group(
    'api/project-boqs',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('dashboard', 'ProjectBoqsController::dashboard', ['filter' => 'apiPermission:boq.view']);
        $routes->get('', 'ProjectBoqsController::index', ['filter' => 'apiPermission:boq.view']);
        $routes->post('', 'ProjectBoqsController::create', ['filter' => 'apiPermission:boq.create']);
        $routes->post('(:num)/import-items', 'ProjectBoqsController::importItems/$1', ['filter' => 'apiPermission:boq.create']);
        $routes->post('(:num)/batch-items', 'ProjectBoqsController::batchUpdateItems/$1', ['filter' => 'apiPermission:boq.update']);
        $routes->get('(:num)/revisions', 'ProjectBoqsController::revisions/$1', ['filter' => 'apiPermission:boq.view']);
        $routes->post('(:num)/revisions', 'ProjectBoqsController::createRevision/$1', ['filter' => 'apiPermission:boq.create']);
        $routes->get('(:num)/variations', 'ProjectBoqsController::variations/$1', ['filter' => 'apiPermission:boq.view']);
        $routes->post('(:num)/variations', 'ProjectBoqsController::createVariation/$1', ['filter' => 'apiPermission:boq.create']);
        $routes->post('(:num)/submit', 'ProjectBoqsController::submit/$1', ['filter' => 'apiPermission:boq.submit']);
        $routes->post('(:num)/approve', 'ProjectBoqsController::approve/$1', ['filter' => 'apiPermission:boq.approve']);
        $routes->post('(:num)/reject', 'ProjectBoqsController::reject/$1', ['filter' => 'apiPermission:boq.approve']);
        $routes->get('(:num)', 'ProjectBoqsController::show/$1', ['filter' => 'apiPermission:boq.view']);
        $routes->put('(:num)', 'ProjectBoqsController::update/$1', ['filter' => 'apiPermission:boq.update']);
        $routes->patch('(:num)', 'ProjectBoqsController::update/$1', ['filter' => 'apiPermission:boq.update']);
        $routes->delete('(:num)', 'ProjectBoqsController::delete/$1', ['filter' => 'apiPermission:boq.delete']);
    }
);

$routes->group(
    'api/project-boqs/(:num)/sections',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'BoqSectionsController::index/$1', ['filter' => 'apiPermission:boq.view']);
        $routes->post('', 'BoqSectionsController::create/$1', ['filter' => 'apiPermission:boq.create']);
        $routes->get('(:num)', 'BoqSectionsController::show/$1/$2', ['filter' => 'apiPermission:boq.view']);
        $routes->put('(:num)', 'BoqSectionsController::update/$1/$2', ['filter' => 'apiPermission:boq.update']);
        $routes->patch('(:num)', 'BoqSectionsController::update/$1/$2', ['filter' => 'apiPermission:boq.update']);
        $routes->delete('(:num)', 'BoqSectionsController::delete/$1/$2', ['filter' => 'apiPermission:boq.delete']);
    }
);

$routes->group(
    'api/project-boqs/(:num)/items',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'BoqItemsController::index/$1', ['filter' => 'apiPermission:boq.view']);
        $routes->post('', 'BoqItemsController::create/$1', ['filter' => 'apiPermission:boq.create']);
        $routes->get('(:num)/execution-history', 'BoqItemsController::executionHistory/$1/$2', ['filter' => 'apiPermission:boq.view']);
        $routes->get('(:num)', 'BoqItemsController::show/$1/$2', ['filter' => 'apiPermission:boq.view']);
        $routes->put('(:num)', 'BoqItemsController::update/$1/$2', ['filter' => 'apiPermission:boq.update']);
        $routes->patch('(:num)', 'BoqItemsController::update/$1/$2', ['filter' => 'apiPermission:boq.update']);
        $routes->delete('(:num)', 'BoqItemsController::delete/$1/$2', ['filter' => 'apiPermission:boq.delete']);
    }
);

$routes->group(
    'api/project-boqs/(:num)/items/(:num)/rate-components',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'BoqItemRateComponentsController::index/$1/$2', ['filter' => 'apiPermission:boq.view']);
        $routes->post('', 'BoqItemRateComponentsController::create/$1/$2', ['filter' => 'apiPermission:boq.create']);
        $routes->get('(:num)', 'BoqItemRateComponentsController::show/$1/$2/$3', ['filter' => 'apiPermission:boq.view']);
        $routes->put('(:num)', 'BoqItemRateComponentsController::update/$1/$2/$3', ['filter' => 'apiPermission:boq.update']);
        $routes->patch('(:num)', 'BoqItemRateComponentsController::update/$1/$2/$3', ['filter' => 'apiPermission:boq.update']);
        $routes->delete('(:num)', 'BoqItemRateComponentsController::delete/$1/$2/$3', ['filter' => 'apiPermission:boq.delete']);
    }
);

$routes->group(
    'api/notifications',
    ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'],
    static function ($routes): void {
        $routes->get('', 'NotificationsController::index');
        $routes->patch('read-all', 'NotificationsController::markAllRead');
        $routes->patch('(:num)/read', 'NotificationsController::markRead/$1');
    }
);

$routes->group(
    'api/project-budgets',
    ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'],
    static function ($routes): void {
        $routes->get('', 'ProjectBudgetsController::index', ['filter' => 'apiPermission:budget.view']);
        $routes->post('', 'ProjectBudgetsController::create', ['filter' => 'apiPermission:budget.create']);
        $routes->post('(:num)/submit', 'ProjectBudgetsController::submit/$1', ['filter' => 'apiPermission:budget.submit']);
        $routes->post('(:num)/approve', 'ProjectBudgetsController::approve/$1', ['filter' => 'apiPermission:budget.approve']);
        $routes->post('(:num)/reject', 'ProjectBudgetsController::reject/$1', ['filter' => 'apiPermission:budget.approve']);
        $routes->get('(:num)/approval-history', 'ProjectBudgetsController::approvalHistory/$1', ['filter' => 'apiPermission:budget.view']);
        $routes->get('(:num)/revisions', 'ProjectBudgetsController::revisions/$1', ['filter' => 'apiPermission:budget.view']);
        $routes->post('(:num)/revisions', 'ProjectBudgetsController::createRevision/$1', ['filter' => 'apiPermission:budget.revise']);
        $routes->get('(:num)/revisions/(:num)', 'ProjectBudgetsController::showRevision/$1/$2', ['filter' => 'apiPermission:budget.view']);
        $routes->patch('(:num)/revisions/(:num)', 'ProjectBudgetsController::updateRevision/$1/$2', ['filter' => 'apiPermission:budget.revise']);
        $routes->delete('(:num)/revisions/(:num)', 'ProjectBudgetsController::deleteRevision/$1/$2', ['filter' => 'apiPermission:budget.revise']);
        $routes->post('(:num)/revisions/(:num)/submit', 'ProjectBudgetsController::submitRevision/$1/$2', ['filter' => 'apiPermission:budget.submit']);
        $routes->post('(:num)/revisions/(:num)/approve', 'ProjectBudgetsController::approveRevision/$1/$2', ['filter' => 'apiPermission:budget.approve']);
        $routes->post('(:num)/revisions/(:num)/reject', 'ProjectBudgetsController::rejectRevision/$1/$2', ['filter' => 'apiPermission:budget.approve']);
        $routes->get('(:num)/revisions/(:num)/history', 'ProjectBudgetsController::revisionHistory/$1/$2', ['filter' => 'apiPermission:budget.view']);
        $routes->post('(:num)/revisions/(:num)/lines', 'ProjectBudgetsController::createRevisionLine/$1/$2', ['filter' => 'apiPermission:budget.revise']);
        $routes->patch('(:num)/revisions/(:num)/lines/(:num)', 'ProjectBudgetsController::updateRevisionLine/$1/$2/$3', ['filter' => 'apiPermission:budget.revise']);
        $routes->delete('(:num)/revisions/(:num)/lines/(:num)', 'ProjectBudgetsController::deleteRevisionLine/$1/$2/$3', ['filter' => 'apiPermission:budget.revise']);
        $routes->get('(:num)/lines', 'ProjectBudgetsController::lines/$1', ['filter' => 'apiPermission:budget.view']);
        $routes->post('(:num)/lines', 'ProjectBudgetsController::createLine/$1', ['filter' => 'apiPermission:budget.update']);
        $routes->get('(:num)/lines/(:num)', 'ProjectBudgetsController::showLine/$1/$2', ['filter' => 'apiPermission:budget.view']);
        $routes->put('(:num)/lines/(:num)', 'ProjectBudgetsController::updateLine/$1/$2', ['filter' => 'apiPermission:budget.update']);
        $routes->patch('(:num)/lines/(:num)', 'ProjectBudgetsController::updateLine/$1/$2', ['filter' => 'apiPermission:budget.update']);
        $routes->delete('(:num)/lines/(:num)', 'ProjectBudgetsController::deleteLine/$1/$2', ['filter' => 'apiPermission:budget.update']);
        $routes->get('(:num)', 'ProjectBudgetsController::show/$1', ['filter' => 'apiPermission:budget.view']);
        $routes->put('(:num)', 'ProjectBudgetsController::update/$1', ['filter' => 'apiPermission:budget.update']);
        $routes->patch('(:num)', 'ProjectBudgetsController::update/$1', ['filter' => 'apiPermission:budget.update']);
        $routes->delete('(:num)', 'ProjectBudgetsController::delete/$1', ['filter' => 'apiPermission:budget.update']);
    }
);

$routes->group(
    'api/sites/(:num)/team-members',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'SiteTeamMembersController::index/$1', ['filter' => 'apiPermission:site.view']);
        $routes->post('', 'SiteTeamMembersController::create/$1', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->get('(:num)', 'SiteTeamMembersController::show/$1/$2', ['filter' => 'apiPermission:site.view']);
        $routes->put('(:num)', 'SiteTeamMembersController::update/$1/$2', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->patch('(:num)', 'SiteTeamMembersController::update/$1/$2', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->delete('(:num)', 'SiteTeamMembersController::delete/$1/$2', ['filter' => 'apiPermission:site.manage_structure']);
    }
);

// Module 5 - Labour & Attendance
$routes->group('api/labour', ['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'], static function($routes): void {
    $routes->get('masters','LabourMastersController::masters',['filter'=>'apiPermission:labour.view']);
    $routes->get('categories','LabourMastersController::categories',['filter'=>'apiPermission:labour.view']);
    $routes->post('categories','LabourMastersController::createCategory',['filter'=>'apiPermission:labour.create']);
    $routes->get('categories/(:num)','LabourMastersController::category/$1',['filter'=>'apiPermission:labour.view']);
    $routes->match(['put','patch'],'categories/(:num)','LabourMastersController::updateCategory/$1',['filter'=>'apiPermission:labour.update']);
    $routes->delete('categories/(:num)','LabourMastersController::deleteCategory/$1',['filter'=>'apiPermission:labour.update']);
    $routes->get('contractors','LabourMastersController::contractors',['filter'=>'apiPermission:labour.view']);
    $routes->post('contractors','LabourMastersController::createContractor',['filter'=>'apiPermission:labour.create']);
    $routes->get('contractors/(:num)','LabourMastersController::contractor/$1',['filter'=>'apiPermission:labour.view']);
    $routes->match(['put','patch'],'contractors/(:num)','LabourMastersController::updateContractor/$1',['filter'=>'apiPermission:labour.update']);
    $routes->delete('contractors/(:num)','LabourMastersController::deleteContractor/$1',['filter'=>'apiPermission:labour.update']);
    $routes->get('workers','LabourWorkersController::index',['filter'=>'apiPermission:labour.view']);
    $routes->post('workers','LabourWorkersController::create',['filter'=>'apiPermission:labour.create']);
    $routes->get('workers/(:num)','LabourWorkersController::show/$1',['filter'=>'apiPermission:labour.view']);
    $routes->match(['put','patch'],'workers/(:num)','LabourWorkersController::update/$1',['filter'=>'apiPermission:labour.update']);
    $routes->delete('workers/(:num)','LabourWorkersController::delete/$1',['filter'=>'apiPermission:labour.update']);
    $routes->get('workers/(:num)/documents','LabourWorkersController::documents/$1',['filter'=>'apiPermission:labour.documents']);
    $routes->post('workers/(:num)/documents','LabourWorkersController::createDocument/$1',['filter'=>'apiPermission:labour.documents']);
    $routes->patch('workers/(:num)/documents/(:num)','LabourWorkersController::updateDocument/$1/$2',['filter'=>'apiPermission:labour.documents']);
    $routes->post('workers/(:num)/documents/(:num)/verify','LabourWorkersController::verifyDocument/$1/$2',['filter'=>'apiPermission:labour.documents']);
    $routes->delete('workers/(:num)/documents/(:num)','LabourWorkersController::deleteDocument/$1/$2',['filter'=>'apiPermission:labour.documents']);
    $routes->get('assignments','LabourAssignmentsController::index',['filter'=>'apiPermission:labour.view']);
    $routes->post('assignments','LabourAssignmentsController::create',['filter'=>'apiPermission:labour.assign']);
    $routes->get('assignments/(:num)','LabourAssignmentsController::show/$1',['filter'=>'apiPermission:labour.view']);
    $routes->match(['put','patch'],'assignments/(:num)','LabourAssignmentsController::update/$1',['filter'=>'apiPermission:labour.assign']);
    $routes->delete('assignments/(:num)','LabourAssignmentsController::delete/$1',['filter'=>'apiPermission:labour.assign']);
});

$routes->group('api/labour-attendance',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('exceptions','LabourAttendanceExceptionsController::index',['filter'=>'apiPermission:attendance.view']);
    $routes->post('exceptions','LabourAttendanceExceptionsController::create',['filter'=>'apiPermission:attendance.create']);
    $routes->get('exceptions/(:num)','LabourAttendanceExceptionsController::show/$1',['filter'=>'apiPermission:attendance.view']);
    $routes->match(['put','patch'],'exceptions/(:num)','LabourAttendanceExceptionsController::update/$1',['filter'=>'apiPermission:attendance.create']);
    $routes->delete('exceptions/(:num)','LabourAttendanceExceptionsController::delete/$1',['filter'=>'apiPermission:attendance.create']);
    $routes->post('exceptions/(:num)/submit','LabourAttendanceExceptionsController::submit/$1',['filter'=>'apiPermission:attendance.submit']);
    $routes->post('exceptions/(:num)/approve','LabourAttendanceExceptionsController::approve/$1',['filter'=>'apiPermission:attendance.approve']);
    $routes->post('exceptions/(:num)/reject','LabourAttendanceExceptionsController::reject/$1',['filter'=>'apiPermission:attendance.approve']);
    $routes->get('','LabourAttendanceController::index',['filter'=>'apiPermission:attendance.view']);
    $routes->post('','LabourAttendanceController::create',['filter'=>'apiPermission:attendance.create']);
    $routes->get('(:num)','LabourAttendanceController::show/$1',['filter'=>'apiPermission:attendance.view']);
    $routes->post('(:num)/entries','LabourAttendanceController::createEntry/$1',['filter'=>'apiPermission:attendance.create']);
    $routes->patch('(:num)/entries/(:num)','LabourAttendanceController::updateEntry/$1/$2',['filter'=>'apiPermission:attendance.create']);
    $routes->delete('(:num)/entries/(:num)','LabourAttendanceController::deleteEntry/$1/$2',['filter'=>'apiPermission:attendance.create']);
    $routes->post('(:num)/submit','LabourAttendanceController::submit/$1',['filter'=>'apiPermission:attendance.submit']);
    $routes->post('(:num)/approve','LabourAttendanceController::approve/$1',['filter'=>'apiPermission:attendance.approve']);
    $routes->post('(:num)/reject','LabourAttendanceController::reject/$1',['filter'=>'apiPermission:attendance.approve']);
    $routes->post('(:num)/lock','LabourAttendanceController::lock/$1',['filter'=>'apiPermission:attendance.approve']);
});

$routes->group('api/daily-wages',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('setup','DailyWagesRegisterController::setup',['filter'=>'apiPermission:wages.view']);
    $routes->get('templates','DailyWagesRegisterController::templates',['filter'=>'apiPermission:wages.view']);
    $routes->post('templates','DailyWagesRegisterController::createTemplate',['filter'=>'apiPermission:wages.calculate']);
    $routes->match(['put','patch'],'templates/(:num)','DailyWagesRegisterController::updateTemplate/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->get('weekly-report','DailyWagesRegisterController::weeklyReport',['filter'=>'apiPermission:wages.view']);
    $routes->get('','DailyWagesRegisterController::index',['filter'=>'apiPermission:wages.view']);
    $routes->post('','DailyWagesRegisterController::create',['filter'=>'apiPermission:wages.calculate']);
    $routes->get('(:num)','DailyWagesRegisterController::show/$1',['filter'=>'apiPermission:wages.view']);
    $routes->match(['put','patch'],'(:num)','DailyWagesRegisterController::update/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/cancel','DailyWagesRegisterController::cancel/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/approve','DailyWagesRegisterController::approve/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/pay','DailyWagesRegisterController::pay/$1',['filter'=>'apiPermission:wages.pay']);
});

$routes->group('api/sub-work',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('setup','DailyWagesRegisterController::setup',['filter'=>'apiPermission:wages.view']);
    $routes->get('templates','DailyWagesRegisterController::templates',['filter'=>'apiPermission:wages.view']);
    $routes->post('templates','DailyWagesRegisterController::createTemplate',['filter'=>'apiPermission:wages.calculate']);
    $routes->match(['put','patch'],'templates/(:num)','DailyWagesRegisterController::updateTemplate/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->get('weekly-report','DailyWagesRegisterController::weeklyReport',['filter'=>'apiPermission:wages.view']);
    $routes->get('','DailyWagesRegisterController::index',['filter'=>'apiPermission:wages.view']);
    $routes->post('','DailyWagesRegisterController::create',['filter'=>'apiPermission:wages.calculate']);
    $routes->get('(:num)','DailyWagesRegisterController::show/$1',['filter'=>'apiPermission:wages.view']);
    $routes->match(['put','patch'],'(:num)','DailyWagesRegisterController::update/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/cancel','DailyWagesRegisterController::cancel/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/approve','DailyWagesRegisterController::approve/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/pay','DailyWagesRegisterController::pay/$1',['filter'=>'apiPermission:wages.pay']);
});

$routes->group('api/labour-wages',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('','LabourWagesController::index',['filter'=>'apiPermission:wages.view']);
    $routes->post('','LabourWagesController::create',['filter'=>'apiPermission:wages.calculate']);
    $routes->get('(:num)','LabourWagesController::show/$1',['filter'=>'apiPermission:wages.view']);
    $routes->match(['put','patch'],'(:num)','LabourWagesController::update/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/calculate','LabourWagesController::calculate/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->patch('(:num)/lines/(:num)','LabourWagesController::updateLine/$1/$2',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/submit','LabourWagesController::submit/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/approve','LabourWagesController::approve/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/cancel','LabourWagesController::cancel/$1',['filter'=>'apiPermission:wages.approve']);
});

$routes->group('api/labour-payments',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('','LabourPaymentsController::index',['filter'=>'apiPermission:wages.view']);
    $routes->post('','LabourPaymentsController::create',['filter'=>'apiPermission:wages.pay']);
    $routes->get('(:num)','LabourPaymentsController::show/$1',['filter'=>'apiPermission:wages.view']);
    $routes->post('(:num)/submit','LabourPaymentsController::submit/$1',['filter'=>'apiPermission:wages.pay']);
    $routes->post('(:num)/approve','LabourPaymentsController::approve/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/mark-paid','LabourPaymentsController::markPaid/$1',['filter'=>'apiPermission:wages.pay']);
    $routes->post('(:num)/cancel','LabourPaymentsController::cancel/$1',['filter'=>'apiPermission:wages.approve']);
});

$routes->group('api/labour-contractor-bills',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('masters','LabourContractorBillsController::masters',['filter'=>'apiPermission:labour.view']);
    $routes->get('','LabourContractorBillsController::index',['filter'=>'apiPermission:labour.view']);
    $routes->post('','LabourContractorBillsController::create',['filter'=>'apiPermission:labour.assign']);
    $routes->get('(:num)','LabourContractorBillsController::show/$1',['filter'=>'apiPermission:labour.view']);
    $routes->match(['put','patch'],'(:num)','LabourContractorBillsController::update/$1',['filter'=>'apiPermission:labour.assign']);
    $routes->post('(:num)/entries','LabourContractorBillsController::addEntry/$1',['filter'=>'apiPermission:labour.assign']);
    $routes->patch('(:num)/entries/(:num)','LabourContractorBillsController::updateEntry/$1/$2',['filter'=>'apiPermission:labour.assign']);
    $routes->delete('(:num)/entries/(:num)','LabourContractorBillsController::deleteEntry/$1/$2',['filter'=>'apiPermission:labour.assign']);
    $routes->post('(:num)/submit','LabourContractorBillsController::submit/$1',['filter'=>'apiPermission:attendance.submit']);
    $routes->post('(:num)/verify','LabourContractorBillsController::verify/$1',['filter'=>'apiPermission:attendance.approve']);
    $routes->post('(:num)/reject','LabourContractorBillsController::reject/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/price','LabourContractorBillsController::price/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/charges','LabourContractorBillsController::addCharge/$1',['filter'=>'apiPermission:wages.calculate']);
    $routes->patch('(:num)/charges/(:num)','LabourContractorBillsController::updateCharge/$1/$2',['filter'=>'apiPermission:wages.calculate']);
    $routes->delete('(:num)/charges/(:num)','LabourContractorBillsController::deleteCharge/$1/$2',['filter'=>'apiPermission:wages.calculate']);
    $routes->post('(:num)/approve','LabourContractorBillsController::approve/$1',['filter'=>'apiPermission:wages.approve']);
    $routes->post('(:num)/payments','LabourContractorBillsController::recordPayment/$1',['filter'=>'apiPermission:wages.pay']);
    $routes->get('(:num)/print','LabourContractorBillsController::print/$1',['filter'=>'apiPermission:wages.view']);
});

// Module 6 - Material Management
$routes->group('api/materials',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('masters','MaterialMastersController::masters',['filter'=>'apiPermission:materials.view']);
    $routes->get('categories','MaterialMastersController::categories',['filter'=>'apiPermission:materials.view']);
    $routes->post('categories','MaterialMastersController::createCategory',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('categories/(:num)','MaterialMastersController::category/$1',['filter'=>'apiPermission:materials.view']);
    $routes->match(['put','patch'],'categories/(:num)','MaterialMastersController::updateCategory/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->delete('categories/(:num)','MaterialMastersController::deleteCategory/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('brands','MaterialMastersController::brands',['filter'=>'apiPermission:materials.view']);
    $routes->post('brands','MaterialMastersController::createBrand',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('brands/(:num)','MaterialMastersController::brand/$1',['filter'=>'apiPermission:materials.view']);
    $routes->match(['put','patch'],'brands/(:num)','MaterialMastersController::updateBrand/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->delete('brands/(:num)','MaterialMastersController::deleteBrand/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('catalogue','MaterialMastersController::materials',['filter'=>'apiPermission:materials.view']);
    $routes->post('catalogue','MaterialMastersController::createMaterial',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('catalogue/(:num)','MaterialMastersController::material/$1',['filter'=>'apiPermission:materials.view']);
    $routes->match(['put','patch'],'catalogue/(:num)','MaterialMastersController::updateMaterial/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->delete('catalogue/(:num)','MaterialMastersController::deleteMaterial/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('suppliers','MaterialMastersController::suppliers',['filter'=>'apiPermission:materials.view']);
    $routes->post('suppliers','MaterialMastersController::createSupplier',['filter'=>'apiPermission:materials.manage_master']);
    $routes->get('suppliers/(:num)','MaterialMastersController::supplier/$1',['filter'=>'apiPermission:materials.view']);
    $routes->match(['put','patch'],'suppliers/(:num)','MaterialMastersController::updateSupplier/$1',['filter'=>'apiPermission:materials.manage_master']);
    $routes->delete('suppliers/(:num)','MaterialMastersController::deleteSupplier/$1',['filter'=>'apiPermission:materials.manage_master']);
});
$routes->group('api/material-management',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    foreach(['requests','purchase-orders','receipts','transactions'] as $type){
        $view=$type==='purchase-orders'?'purchase_orders.view':($type==='receipts'?'material_receipts.view':($type==='transactions'?'material_stock.view':'materials.request'));
        $write=$type==='purchase-orders'?'purchase_orders.create':($type==='receipts'?'material_receipts.create':($type==='transactions'?'material_stock.transact':'materials.request'));
        $routes->get($type,'MaterialDocumentsController::index/'.$type,['filter'=>'apiPermission:'.$view]);
        $routes->post($type,'MaterialDocumentsController::create/'.$type,['filter'=>'apiPermission:'.$write]);
        $routes->get($type.'/(:num)','MaterialDocumentsController::show/'.$type.'/$1',['filter'=>'apiPermission:'.$view]);
        $routes->match(['put','patch'],$type.'/(:num)','MaterialDocumentsController::update/'.$type.'/$1',['filter'=>'apiPermission:'.$write]);
        $routes->delete($type.'/(:num)','MaterialDocumentsController::delete/'.$type.'/$1',['filter'=>'apiPermission:'.$write]);
        $routes->post($type.'/(:num)/items','MaterialDocumentsController::addItem/'.$type.'/$1',['filter'=>'apiPermission:'.$write]);
        $routes->patch($type.'/(:num)/items/(:num)','MaterialDocumentsController::updateItem/'.$type.'/$1/$2',['filter'=>'apiPermission:'.$write]);
        $routes->delete($type.'/(:num)/items/(:num)','MaterialDocumentsController::deleteItem/'.$type.'/$1/$2',['filter'=>'apiPermission:'.$write]);
    }
    foreach(['submit','approve','reject','cancel','send','close'] as $action){
        $routes->post('requests/(:num)/'.$action,'MaterialDocumentsController::action/requests/$1/'.$action,['filter'=>'apiPermission:'.(in_array($action,['approve','reject'])?'materials.approve_request':'materials.request')]);
        $routes->post('purchase-orders/(:num)/'.$action,'MaterialDocumentsController::action/purchase-orders/$1/'.$action,['filter'=>'apiPermission:'.(in_array($action,['approve','reject'])?'purchase_orders.approve':'purchase_orders.create')]);
        $routes->post('transactions/(:num)/'.$action,'MaterialDocumentsController::action/transactions/$1/'.$action,['filter'=>'apiPermission:'.(in_array($action,['approve','reject'])?'material_stock.approve':'material_stock.transact')]);
    }
    $routes->post('receipts/(:num)/inspect','MaterialDocumentsController::inspect/$1',['filter'=>'apiPermission:material_receipts.inspect']);
    $routes->post('receipts/(:num)/post','MaterialDocumentsController::postReceipt/$1',['filter'=>'apiPermission:material_receipts.post']);
    $routes->post('transactions/(:num)/post','MaterialDocumentsController::postTransaction/$1',['filter'=>'apiPermission:material_stock.transact']);
    $routes->get('stock','MaterialDocumentsController::stock',['filter'=>'apiPermission:material_stock.view']);
    $routes->get('stock/export','MaterialDocumentsController::exportStock',['filter'=>'apiPermission:material_stock.export']);
    $routes->get('ledger','MaterialDocumentsController::ledger',['filter'=>'apiPermission:material_stock.view']);
});

// Module 7 - Daily Site Operations
$routes->group('api/daily-operations',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('masters','DailyOperationsMastersController::index',['filter'=>'apiPermission:daily_reports.view']);
});
$routes->group('api/daily-site-reports',['namespace'=>'App\\Controllers\\Api','filter'=>'apiAuth'],static function($routes):void{
    $routes->get('','DailySiteReportsController::index',['filter'=>'apiPermission:daily_reports.view']);
    $routes->post('','DailySiteReportsController::create',['filter'=>'apiPermission:daily_reports.create']);
    $routes->get('(:num)','DailySiteReportsController::show/$1',['filter'=>'apiPermission:daily_reports.view']);
    $routes->match(['put','patch'],'(:num)','DailySiteReportsController::update/$1',['filter'=>'apiPermission:daily_reports.create']);
    $routes->delete('(:num)','DailySiteReportsController::delete/$1',['filter'=>'apiPermission:daily_reports.create']);
    $routes->post('(:num)/submit','DailySiteReportsController::action/$1/submit',['filter'=>'apiPermission:daily_reports.submit']);
    $routes->post('(:num)/review','DailySiteReportsController::action/$1/review',['filter'=>'apiPermission:daily_reports.review']);
    $routes->post('(:num)/approve','DailySiteReportsController::action/$1/approve',['filter'=>'apiPermission:daily_reports.approve']);
    $routes->post('(:num)/reject','DailySiteReportsController::action/$1/reject',['filter'=>'apiPermission:daily_reports.approve']);
    $routes->post('(:num)/reopen','DailySiteReportsController::action/$1/reopen',['filter'=>'apiPermission:daily_reports.reopen']);
    $routes->post('(:num)/cancel','DailySiteReportsController::action/$1/cancel',['filter'=>'apiPermission:daily_reports.reopen']);

    $routes->post('(:num)/work-progress/(:num)/inspect','DailyOperationEntriesController::inspect/$1/$2',['filter'=>'apiPermission:work_progress.inspect']);
    $routes->post('(:num)/photos','DailySitePhotosController::create/$1',['filter'=>'apiPermission:site_photos.manage']);
    $routes->match(['put','patch'],'(:num)/photos/(:num)','DailySitePhotosController::update/$1/$2',['filter'=>'apiPermission:site_photos.manage']);
    $routes->get('(:num)/photos/(:num)/download','DailySitePhotosController::download/$1/$2',['filter'=>'apiPermission:daily_reports.view']);
    $routes->delete('(:num)/photos/(:num)','DailySitePhotosController::delete/$1/$2',['filter'=>'apiPermission:site_photos.manage']);

    $entryPermissions=[
        'work-progress'=>['work_progress.view','work_progress.record'],
        'manpower'=>['daily_reports.view','daily_reports.create'],
        'equipment'=>['daily_reports.view','daily_reports.create'],
        'weather'=>['daily_reports.view','daily_reports.create'],
        'issues'=>['site_issues.view','site_issues.manage'],
        'visitors'=>['daily_reports.view','site_visitors.manage'],
        'material-consumption'=>['daily_reports.view','daily_reports.create'],
    ];
    foreach($entryPermissions as$type=>[$view,$write]){
        $routes->get('(:num)/'.$type,'DailyOperationEntriesController::index/$1/'.$type,['filter'=>'apiPermission:'.$view]);
        $routes->post('(:num)/'.$type,'DailyOperationEntriesController::create/$1/'.$type,['filter'=>'apiPermission:'.$write]);
        $routes->get('(:num)/'.$type.'/(:num)','DailyOperationEntriesController::show/$1/'.$type.'/$2',['filter'=>'apiPermission:'.$view]);
        $routes->match(['put','patch'],'(:num)/'.$type.'/(:num)','DailyOperationEntriesController::update/$1/'.$type.'/$2',['filter'=>'apiPermission:'.$write]);
        $routes->delete('(:num)/'.$type.'/(:num)','DailyOperationEntriesController::delete/$1/'.$type.'/$2',['filter'=>'apiPermission:'.$write]);
    }
});

$routes->group(
    'api/work-locations',
    [
        'namespace' => 'App\Controllers\Api',
        'filter' => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'WorkLocationsController::index', ['filter' => 'apiPermission:site.view']);
        $routes->post('', 'WorkLocationsController::create', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->get('(:num)', 'WorkLocationsController::show/$1', ['filter' => 'apiPermission:site.view']);
        $routes->put('(:num)', 'WorkLocationsController::update/$1', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->patch('(:num)', 'WorkLocationsController::update/$1', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->delete('(:num)', 'WorkLocationsController::delete/$1', ['filter' => 'apiPermission:site.manage_structure']);
    }
);

$routes->group(
    'api/site-zones',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'SiteWorkZonesController::index', ['filter' => 'apiPermission:site.view']);
        $routes->post('', 'SiteWorkZonesController::create', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->get('(:num)', 'SiteWorkZonesController::show/$1', ['filter' => 'apiPermission:site.view']);
        $routes->put('(:num)', 'SiteWorkZonesController::update/$1', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->patch('(:num)', 'SiteWorkZonesController::update/$1', ['filter' => 'apiPermission:site.manage_structure']);
        $routes->delete('(:num)', 'SiteWorkZonesController::delete/$1', ['filter' => 'apiPermission:site.manage_structure']);
    }
);

$routes->group(
    'api/financial-years',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'FinancialYearsController::index', ['filter' => 'apiPermission:financial_year.view']);
        $routes->post('', 'FinancialYearsController::create', ['filter' => 'apiPermission:financial_year.manage']);
        $routes->get('(:num)', 'FinancialYearsController::show/$1', ['filter' => 'apiPermission:financial_year.view']);
        $routes->put('(:num)', 'FinancialYearsController::update/$1', ['filter' => 'apiPermission:financial_year.manage']);
        $routes->patch('(:num)', 'FinancialYearsController::update/$1', ['filter' => 'apiPermission:financial_year.manage']);
        $routes->delete('(:num)', 'FinancialYearsController::delete/$1', ['filter' => 'apiPermission:financial_year.manage']);
    }
);

$routes->group(
    'api/units-of-measurement',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'UnitsOfMeasurementController::index', ['filter' => 'apiPermission:master.view']);
        $routes->post('', 'UnitsOfMeasurementController::create', ['filter' => 'apiPermission:master.create']);
        $routes->get('(:num)', 'UnitsOfMeasurementController::show/$1', ['filter' => 'apiPermission:master.view']);
        $routes->put('(:num)', 'UnitsOfMeasurementController::update/$1', ['filter' => 'apiPermission:master.update']);
        $routes->patch('(:num)', 'UnitsOfMeasurementController::update/$1', ['filter' => 'apiPermission:master.update']);
        $routes->delete('(:num)', 'UnitsOfMeasurementController::delete/$1', ['filter' => 'apiPermission:master.delete']);
    }
);

$routes->group(
    'api/project-types',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'ProjectTypesController::index', ['filter' => 'apiPermission:project.view']);
        $routes->post('', 'ProjectTypesController::create', ['filter' => 'apiPermission:project.create']);
        $routes->get('(:num)', 'ProjectTypesController::show/$1', ['filter' => 'apiPermission:project.view']);
        $routes->put('(:num)', 'ProjectTypesController::update/$1', ['filter' => 'apiPermission:project.update']);
        $routes->patch('(:num)', 'ProjectTypesController::update/$1', ['filter' => 'apiPermission:project.update']);
        $routes->delete('(:num)', 'ProjectTypesController::delete/$1', ['filter' => 'apiPermission:project.delete']);
    }
);

$routes->group(
    'api/work-categories',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'WorkCategoriesController::index', ['filter' => 'apiPermission:master.view']);
        $routes->post('', 'WorkCategoriesController::create', ['filter' => 'apiPermission:master.create']);
        $routes->get('(:num)', 'WorkCategoriesController::show/$1', ['filter' => 'apiPermission:master.view']);
        $routes->put('(:num)', 'WorkCategoriesController::update/$1', ['filter' => 'apiPermission:master.update']);
        $routes->patch('(:num)', 'WorkCategoriesController::update/$1', ['filter' => 'apiPermission:master.update']);
        $routes->delete('(:num)', 'WorkCategoriesController::delete/$1', ['filter' => 'apiPermission:master.delete']);
    }
);

$routes->group(
    'api/clients',
    [
        'namespace' => 'App\Controllers\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'ClientsController::index', ['filter' => 'apiPermission:client.view']);
        $routes->post('', 'ClientsController::create', ['filter' => 'apiPermission:client.create']);
        $routes->get('(:num)/addresses', 'ClientAddressesController::index/$1', ['filter' => 'apiPermission:client.view']);
        $routes->post('(:num)/addresses', 'ClientAddressesController::create/$1', ['filter' => 'apiPermission:client.create']);
        $routes->get('(:num)/addresses/(:num)', 'ClientAddressesController::show/$1/$2', ['filter' => 'apiPermission:client.view']);
        $routes->put('(:num)/addresses/(:num)', 'ClientAddressesController::update/$1/$2', ['filter' => 'apiPermission:client.update']);
        $routes->patch('(:num)/addresses/(:num)', 'ClientAddressesController::update/$1/$2', ['filter' => 'apiPermission:client.update']);
        $routes->delete('(:num)/addresses/(:num)', 'ClientAddressesController::delete/$1/$2', ['filter' => 'apiPermission:client.delete']);
        $routes->get('(:num)/contacts', 'ClientContactsController::index/$1', ['filter' => 'apiPermission:client.view']);
        $routes->post('(:num)/contacts', 'ClientContactsController::create/$1', ['filter' => 'apiPermission:client.create']);
        $routes->get('(:num)/contacts/(:num)', 'ClientContactsController::show/$1/$2', ['filter' => 'apiPermission:client.view']);
        $routes->put('(:num)/contacts/(:num)', 'ClientContactsController::update/$1/$2', ['filter' => 'apiPermission:client.update']);
        $routes->patch('(:num)/contacts/(:num)', 'ClientContactsController::update/$1/$2', ['filter' => 'apiPermission:client.update']);
        $routes->delete('(:num)/contacts/(:num)', 'ClientContactsController::delete/$1/$2', ['filter' => 'apiPermission:client.delete']);
        $routes->get('(:num)/documents', 'ClientDocumentsController::index/$1', ['filter' => 'apiPermission:client.view']);
        $routes->post('(:num)/documents', 'ClientDocumentsController::create/$1', ['filter' => 'apiPermission:client.create']);
        $routes->get('(:num)/documents/(:num)/download', 'ClientDocumentsController::download/$1/$2', ['filter' => 'apiPermission:client.view']);
        $routes->get('(:num)/documents/(:num)', 'ClientDocumentsController::show/$1/$2', ['filter' => 'apiPermission:client.view']);
        $routes->put('(:num)/documents/(:num)', 'ClientDocumentsController::update/$1/$2', ['filter' => 'apiPermission:client.update']);
        $routes->patch('(:num)/documents/(:num)', 'ClientDocumentsController::update/$1/$2', ['filter' => 'apiPermission:client.update']);
        $routes->delete('(:num)/documents/(:num)', 'ClientDocumentsController::delete/$1/$2', ['filter' => 'apiPermission:client.delete']);
        $routes->get('(:num)', 'ClientsController::show/$1', ['filter' => 'apiPermission:client.view']);
        $routes->put('(:num)', 'ClientsController::update/$1', ['filter' => 'apiPermission:client.update']);
        $routes->patch('(:num)', 'ClientsController::update/$1', ['filter' => 'apiPermission:client.update']);
        $routes->delete('(:num)', 'ClientsController::delete/$1', ['filter' => 'apiPermission:client.delete']);
    }
);

// Module 8 - Subcontract Management
$routes->group(
    'api/subcontracts',
    [
        'namespace' => 'App\\Controllers\\Api',
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('masters', 'SubcontractMastersController::index', ['filter' => 'apiPermission:subcontractors.view']);

        $routes->get('types', 'SubcontractMastersController::types', ['filter' => 'apiPermission:subcontractors.view']);
        $routes->post('types', 'SubcontractMastersController::saveType', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->put('types/(:num)', 'SubcontractMastersController::saveType/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->patch('types/(:num)', 'SubcontractMastersController::saveType/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->delete('types/(:num)', 'SubcontractMastersController::deleteType/$1', ['filter' => 'apiPermission:subcontractors.manage']);

        $routes->get('types/(:num)/templates', 'SubcontractMastersController::typeTemplates/$1', ['filter' => 'apiPermission:subcontractors.view']);
        $routes->post('types/(:num)/templates', 'SubcontractMastersController::createTypeTemplate/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->put('types/(:num)/templates/(:num)', 'SubcontractMastersController::updateTypeTemplate/$1/$2', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->patch('types/(:num)/templates/(:num)', 'SubcontractMastersController::updateTypeTemplate/$1/$2', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->delete('types/(:num)/templates/(:num)', 'SubcontractMastersController::deleteTypeTemplate/$1/$2', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->post('types/(:num)/templates/reorder', 'SubcontractMastersController::reorderTypeTemplates/$1', ['filter' => 'apiPermission:subcontractors.manage']);

        $routes->get('contractors', 'SubcontractMastersController::contractors', ['filter' => 'apiPermission:subcontractors.view']);
        $routes->post('contractors', 'SubcontractMastersController::create', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->get('contractors/(:num)', 'SubcontractMastersController::contractor/$1', ['filter' => 'apiPermission:subcontractors.view']);
        $routes->get('contractors/(:num)/templates', 'SubcontractMastersController::contractorTemplates/$1', ['filter' => 'apiPermission:subcontractors.view']);
        $routes->put('contractors/(:num)', 'SubcontractMastersController::update/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->patch('contractors/(:num)', 'SubcontractMastersController::update/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->delete('contractors/(:num)', 'SubcontractMastersController::delete/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->post('contractors/(:num)/toggle-status', 'SubcontractMastersController::toggleStatus/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->post('contractors/(:num)/documents', 'SubcontractMastersController::addDocument/$1', ['filter' => 'apiPermission:subcontractors.manage']);
        $routes->post('contractors/(:num)/documents/(:num)/verify', 'SubcontractMastersController::verifyDocument/$1/$2', ['filter' => 'apiPermission:subcontractors.manage']);

        foreach ([
            'work-orders'  => ['view' => 'work_orders.view',  'write' => 'work_orders.create'],
            'measurements' => ['view' => 'measurements.view', 'write' => 'measurements.create'],
            'ra-bills'     => ['view' => 'ra_bills.view',     'write' => 'ra_bills.create'],
            'payments'     => ['view' => 'payments.view',     'write' => 'payments.create'],
        ] as $documentType => $permissions) {
            $routes->get($documentType, 'SubcontractDocumentsController::index/' . $documentType, ['filter' => 'apiPermission:' . $permissions['view']]);
            $routes->post($documentType, 'SubcontractDocumentsController::create/' . $documentType, ['filter' => 'apiPermission:' . $permissions['write']]);
            $routes->get($documentType . '/(:num)', 'SubcontractDocumentsController::show/' . $documentType . '/$1', ['filter' => 'apiPermission:' . $permissions['view']]);
            $routes->put($documentType . '/(:num)', 'SubcontractDocumentsController::update/' . $documentType . '/$1', ['filter' => 'apiPermission:' . $permissions['write']]);
            $routes->patch($documentType . '/(:num)', 'SubcontractDocumentsController::update/' . $documentType . '/$1', ['filter' => 'apiPermission:' . $permissions['write']]);

            if ($documentType !== 'payments') {
                $routes->post($documentType . '/(:num)/items', 'SubcontractDocumentsController::addItem/' . $documentType . '/$1', ['filter' => 'apiPermission:' . $permissions['write']]);
                $routes->patch($documentType . '/(:num)/items/(:num)', 'SubcontractDocumentsController::updateItem/' . $documentType . '/$1/$2', ['filter' => 'apiPermission:' . $permissions['write']]);
            }
        }

        foreach (['submit', 'approve', 'reject', 'activate', 'complete', 'close', 'cancel'] as $action) {
            $permission = in_array($action, ['approve', 'reject'], true)
                ? 'work_orders.approve'
                : ($action === 'submit' ? 'work_orders.submit' : 'work_orders.create');
            $routes->post('work-orders/(:num)/' . $action, 'SubcontractDocumentsController::action/work-orders/$1/' . $action, ['filter' => 'apiPermission:' . $permission]);
        }

        foreach (['submit', 'verify', 'approve', 'reject', 'cancel'] as $action) {
            $permission = in_array($action, ['verify', 'approve', 'reject'], true)
                ? 'measurements.approve'
                : 'measurements.create';
            $routes->post('measurements/(:num)/' . $action, 'SubcontractDocumentsController::action/measurements/$1/' . $action, ['filter' => 'apiPermission:' . $permission]);
        }

        foreach (['submit', 'verify', 'approve', 'certify', 'reject', 'cancel'] as $action) {
            $permission = in_array($action, ['verify', 'approve', 'certify', 'reject'], true)
                ? 'ra_bills.certify'
                : 'ra_bills.create';
            $routes->post('ra-bills/(:num)/' . $action, 'SubcontractDocumentsController::action/ra-bills/$1/' . $action, ['filter' => 'apiPermission:' . $permission]);
        }

        foreach (['submit', 'approve', 'mark-paid', 'reject', 'cancel'] as $action) {
            $permission = in_array($action, ['approve', 'reject', 'mark-paid'], true)
                ? 'payments.approve'
                : 'payments.create';
            $routes->post('payments/(:num)/' . $action, 'SubcontractDocumentsController::action/payments/$1/' . $action, ['filter' => 'apiPermission:' . $permission]);
        }

        $routes->get('work-orders/(:num)/integrations', 'SubcontractDocumentsController::integrations/$1', ['filter' => 'apiPermission:subcontractors.view']);
    }
);

// Module 10 - Standalone Approvals API routes.
$routes->group('api/approvals', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    $routes->get('', 'ApprovalsController::index', ['filter' => 'apiPermission:approvals.view']);
    $routes->get('summary', 'ApprovalsController::summary', ['filter' => 'apiPermission:approvals.view']);
    $routes->get('history', 'ApprovalsController::history', ['filter' => 'apiPermission:approvals.view']);
    $routes->get('(:segment)/(:num)', 'ApprovalsController::show/$1/$2', ['filter' => 'apiPermission:approvals.view']);
    $routes->post('(:segment)/(:num)/(:segment)', 'ApprovalsController::action/$1/$2/$3', ['filter' => 'apiPermission:approvals.action']);
});

// Module 12 - Notifications, Audit and Final Administration.
$routes->group('api/system-admin', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    $routes->get('masters', 'SystemAdministrationController::masters', ['filter' => 'apiPermission:system_admin.view']);
    $routes->get('integrity', 'SystemAdministrationController::integrity', ['filter' => 'apiPermission:system_admin.view']);
    $routes->get('notifications/summary', 'SystemAdministrationController::notificationSummary', ['filter' => 'apiPermission:system_admin.view']);
    $routes->get('notifications', 'SystemAdministrationController::notifications', ['filter' => 'apiPermission:system_admin.view']);
    $routes->get('audit-logs', 'SystemAdministrationController::auditLogs', ['filter' => 'apiPermission:system_admin.view']);
    $routes->post('audit-logs', 'SystemAdministrationController::recordAudit', ['filter' => 'apiPermission:audit.create']);
    $routes->get('audit-logs/(:num)', 'SystemAdministrationController::auditDetail/$1', ['filter' => 'apiPermission:system_admin.view']);
    $routes->get('login-history', 'SystemAdministrationController::loginHistory', ['filter' => 'apiPermission:system_admin.view']);
});

// ═══════════════════════════════════════════════════════════════════
// Module 13 — Employee GPS Attendance & Payroll
// ═══════════════════════════════════════════════════════════════════

// 13a. Employee Attendance (GPS check-in/out, register, corrections, overtime, holidays, settings)
$routes->group('api/employee-attendance', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    // GPS Check-In / Check-Out
    $routes->post('check-in', 'EmployeeAttendanceController::checkIn');
    $routes->post('check-out', 'EmployeeAttendanceController::checkOut');
    $routes->get('today', 'EmployeeAttendanceController::todayStatus');

    // Attendance Register
    $routes->get('', 'EmployeeAttendanceController::index');
    $routes->get('monthly-summary', 'EmployeeAttendanceController::monthlySummary');

    // Corrections
    $routes->get('corrections', 'EmployeeAttendanceController::corrections');
    $routes->post('corrections', 'EmployeeAttendanceController::createCorrection');
    $routes->post('corrections/(:num)/review', 'EmployeeAttendanceController::reviewCorrection/$1');

    // Overtime
    $routes->get('overtime', 'EmployeeAttendanceController::overtime');
    $routes->post('overtime/(:num)/review', 'EmployeeAttendanceController::reviewOvertime/$1');

    // Site Attendance Settings
    $routes->get('settings', 'EmployeeAttendanceController::settings');
    $routes->post('settings', 'EmployeeAttendanceController::saveSettings');

    // Employee Site Assignments
    $routes->get('assignments', 'EmployeeAttendanceController::assignments');
    $routes->post('assignments', 'EmployeeAttendanceController::saveAssignment');

    // Holidays
    $routes->get('holidays', 'EmployeeAttendanceController::holidays');
    $routes->post('holidays', 'EmployeeAttendanceController::saveHoliday');
    $routes->delete('holidays/(:num)', 'EmployeeAttendanceController::deleteHoliday/$1');
});

// 13b. Employee Leaves & Permissions
$routes->group('api/employee-leaves', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    // Leave Types
    $routes->get('types', 'EmployeeLeaveController::leaveTypes');
    $routes->post('types', 'EmployeeLeaveController::saveLeaveType');

    // Leave Balances
    $routes->get('balances', 'EmployeeLeaveController::leaveBalances');
    $routes->post('balances', 'EmployeeLeaveController::saveLeaveBalance');

    // Leave Requests
    $routes->get('requests', 'EmployeeLeaveController::leaveRequests');
    $routes->post('requests', 'EmployeeLeaveController::createLeaveRequest');
    $routes->post('requests/(:num)/review', 'EmployeeLeaveController::reviewLeaveRequest/$1');

    // Permission Requests
    $routes->get('permissions', 'EmployeeLeaveController::permissionRequests');
    $routes->post('permissions', 'EmployeeLeaveController::createPermissionRequest');
    $routes->post('permissions/(:num)/review', 'EmployeeLeaveController::reviewPermissionRequest/$1');
});

// 13c. Employee Payroll
$routes->group('api/employee-payroll', ['namespace' => 'App\\Controllers\\Api', 'filter' => 'apiAuth'], static function ($routes): void {
    // Salary Structures
    $routes->get('salary-structures', 'EmployeePayrollController::salaryStructures');
    $routes->post('salary-structures', 'EmployeePayrollController::saveSalaryStructure');

    // Advances & Loans
    $routes->get('advances', 'EmployeePayrollController::advances');
    $routes->post('advances', 'EmployeePayrollController::saveAdvance');

    // Payroll Generation & List
    $routes->post('generate', 'EmployeePayrollController::generatePayroll');
    $routes->get('', 'EmployeePayrollController::payrolls');
    $routes->get('(:num)', 'EmployeePayrollController::payrollDetail/$1');
    $routes->get('summary', 'EmployeePayrollController::payrollSummary');

    // Payroll Actions
    $routes->post('(:num)/approve', 'EmployeePayrollController::approvePayroll/$1');
    $routes->post('(:num)/lock', 'EmployeePayrollController::lockPayroll/$1');
    $routes->post('(:num)/reopen', 'EmployeePayrollController::reopenPayroll/$1');
    $routes->post('bulk-approve', 'EmployeePayrollController::bulkApprovePayroll');
    $routes->post('bulk-lock', 'EmployeePayrollController::bulkLockPayroll');

    // Dashboard Stats
    $routes->get('dashboard-stats', 'EmployeePayrollController::dashboardStats');
});
