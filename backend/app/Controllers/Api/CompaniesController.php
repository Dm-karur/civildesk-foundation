<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Libraries\AuthorizationService;
use App\Models\CompanyModel;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class CompaniesController extends BaseController
{
    private CompanyModel $companyModel;
    private AuthorizationService $authorization;

    public function __construct()
    {
        $this->companyModel = new CompanyModel();
        $this->authorization = new AuthorizationService();
    }

    /**
     * Return companies accessible to the authenticated user.
     */
    public function index(): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->unauthorized();
        }

        try {
            $builder = $this->companyModel
                ->select([
                    'companies.id',
                    'companies.company_code',
                    'companies.company_name',
                    'companies.legal_name',
                    'companies.company_type_id',
                    'company_types.type_code AS company_type_code',
                    'company_types.type_name AS company_type_name',
                    'companies.gstin',
                    'companies.email',
                    'companies.phone',
                    'companies.city',
                    'companies.state_name',
                    'companies.subscription_status_id',
                    'subscription_statuses.status_code AS subscription_status_code',
                    'subscription_statuses.status_name AS subscription_status_name',
                    'companies.subscription_start',
                    'companies.subscription_end',
                    'companies.is_active',
                    'companies.created_at',
                    'companies.updated_at',
                ])
                ->join('company_types', 'company_types.id = companies.company_type_id')
                ->join('subscription_statuses', 'subscription_statuses.id = companies.subscription_status_id');

            if (! $this->authorization->isSuperAdmin($user)) {
                $builder->where('companies.id', (int) $user->company_id);
            }

            $companies = $builder
                ->orderBy('company_name', 'ASC')
                ->findAll();

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Companies retrieved successfully.',
                'data' => [
                    'companies' => $companies,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'Company list retrieval failed.',
                $exception
            );
        }
    }

    /**
     * Return one accessible company.
     */
    public function show(int $id): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->unauthorized();
        }

        if (
            $id <= 0
            || ! $this->authorization->belongsToCompany($id, $user)
        ) {
            return $this->notFound();
        }

        try {
            $company = $this->companyModel
                ->select('companies.*, company_types.type_code AS company_type_code, company_types.type_name AS company_type_name, subscription_statuses.status_code AS subscription_status_code, subscription_statuses.status_name AS subscription_status_name')
                ->join('company_types', 'company_types.id = companies.company_type_id')
                ->join('subscription_statuses', 'subscription_statuses.id = companies.subscription_status_id')
                ->find($id);

            if ($company === null) {
                return $this->notFound();
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Company retrieved successfully.',
                'data' => [
                    'company' => $company,
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'Company retrieval failed.',
                $exception
            );
        }
    }

    /**
     * Update an accessible company.
     */
    public function update(int $id): ResponseInterface
    {
        $user = auth('session')->user();

        if ($user === null) {
            return $this->unauthorized();
        }

        if (
            $id <= 0
            || ! $this->authorization->belongsToCompany($id, $user)
        ) {
            return $this->notFound();
        }

        try {
            $existingCompany = $this->companyModel->find($id);

            if ($existingCompany === null) {
                return $this->notFound();
            }

            $payload = $this->request->getJSON(true);

            if (! is_array($payload) || $payload === []) {
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_BAD_REQUEST)
                    ->setJSON([
                        'success' => false,
                        'message' => 'A valid JSON request body is required.',
                    ]);
            }

            // These fields are controlled internally and cannot be
            // updated through the standard company profile API.
            unset(
                $payload['id'],
                $payload['company_code'],
                $payload['subscription_status_id'],
                $payload['subscription_start'],
                $payload['subscription_end'],
                $payload['is_active'],
                $payload['created_at'],
                $payload['updated_at'],
                $payload['deleted_at']
            );

            $allowedUpdateFields = [
                'company_name',
                'legal_name',
                'company_type_id',
                'gstin',
                'pan',
                'cin',
                'email',
                'phone',
                'website',
                'address_line1',
                'address_line2',
                'city',
                'district',
                'state_name',
                'state_code',
                'country_code',
                'postal_code',
                'logo_path',
                'date_format',
                'currency_code',
                'timezone',
            ];

            $updateData = array_intersect_key(
                $payload,
                array_flip($allowedUpdateFields)
            );

            if ($updateData === []) {
                return $this->response
                    ->setStatusCode(ResponseInterface::HTTP_BAD_REQUEST)
                    ->setJSON([
                        'success' => false,
                        'message' =>
                            'No permitted company fields were supplied.',
                    ]);
            }

            if (! $this->companyModel->update($id, $updateData)) {
                return $this->response
                    ->setStatusCode(
                        ResponseInterface::HTTP_UNPROCESSABLE_ENTITY
                    )
                    ->setJSON([
                        'success' => false,
                        'message' => 'Company validation failed.',
                        'errors' => $this->companyModel->errors(),
                    ]);
            }

            return $this->response->setJSON([
                'success' => true,
                'message' => 'Company updated successfully.',
                'data' => [
                    'company' => $this->companyModel->find($id),
                ],
            ]);
        } catch (Throwable $exception) {
            return $this->serverError(
                'Company update failed.',
                $exception
            );
        }
    }

    private function unauthorized(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
            ->setJSON([
                'success' => false,
                'message' => 'Authentication required.',
            ]);
    }

    /**
     * Return 404 for missing and inaccessible companies to avoid
     * revealing records belonging to another company.
     */
    private function notFound(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(ResponseInterface::HTTP_NOT_FOUND)
            ->setJSON([
                'success' => false,
                'message' => 'Company not found.',
            ]);
    }

    private function serverError(
        string $logMessage,
        Throwable $exception
    ): ResponseInterface {
        log_message(
            'error',
            $logMessage . ' {message}',
            ['message' => $exception->getMessage()]
        );

        return $this->response
            ->setStatusCode(
                ResponseInterface::HTTP_INTERNAL_SERVER_ERROR
            )
            ->setJSON([
                'success' => false,
                'message' => 'Unable to process the company request.',
            ]);
    }
}
