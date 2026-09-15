<?php

declare(strict_types=1);

namespace App\Filters;

use App\Libraries\AuthorizationService;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class ApiPermissionFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        if (! auth('session')->loggedIn()) {
            return service('response')
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON([
                    'success' => false,
                    'message' => 'Authentication required.',
                ]);
        }

        $requiredPermissions = array_values(array_filter(
            array_map(
                static fn ($permission): string =>
                    strtolower(trim((string) $permission)),
                $arguments ?? []
            ),
            static fn (string $permission): bool =>
                $permission !== ''
        ));

        if ($requiredPermissions === []) {
            log_message(
                'error',
                'ApiPermissionFilter used without a permission argument for URI: {uri}',
                ['uri' => (string) $request->getUri()]
            );

            return service('response')
                ->setStatusCode(
                    ResponseInterface::HTTP_INTERNAL_SERVER_ERROR
                )
                ->setJSON([
                    'success' => false,
                    'message' => 'Route permission is not configured.',
                ]);
        }

        $authorization = new AuthorizationService();
        $user = auth('session')->user();

        foreach ($requiredPermissions as $permissionCode) {
            if (! $authorization->hasPermission(
                $permissionCode,
                $user
            )) {
                return service('response')
                    ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN)
                    ->setJSON([
                        'success' => false,
                        'message' => 'Permission denied.',
                        'data' => [
                            'required_permission' => $permissionCode,
                        ],
                    ]);
            }
        }

        return null;
    }

    public function after(
        RequestInterface $request,
        ResponseInterface $response,
        $arguments = null
    ) {
        return null;
    }
}
