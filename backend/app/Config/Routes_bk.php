<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

service('auth')->routes($routes);

$routes->options('api/(:any)', static function () {
    return service('response')->setStatusCode(204);
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
        'filter'    => 'apiAuth',
    ],
    static function ($routes): void {
        $routes->get('', 'MastersController::index');
    }
);

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
