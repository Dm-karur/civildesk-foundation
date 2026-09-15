<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/**
 * Cross-Origin Resource Sharing (CORS) Configuration
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
 */
class Cors extends BaseConfig
{
    /**
     * The default CORS configuration.
     *
     * @var array{
     *      allowedOrigins: list<string>,
     *      allowedOriginsPatterns: list<string>,
     *      supportsCredentials: bool,
     *      allowedHeaders: list<string>,
     *      exposedHeaders: list<string>,
     *      allowedMethods: list<string>,
     *      maxAge: int,
     *  }
     */
    public array $default = [
		'allowedOrigins' => [
			'http://localhost:5173',
            'https://white-marten-572750.hostingersite.com',
		],

		'allowedOriginsPatterns' => [],

		'supportsCredentials' => true,

		'allowedHeaders' => [
			'Content-Type',
			'X-Requested-With',
			'Accept',
			'Origin',
			'Authorization',
		],

		'exposedHeaders' => [],

		'allowedMethods' => [
			'GET',
			'POST',
			'PUT',
			'PATCH',
			'DELETE',
			'OPTIONS',
		],

		'maxAge' => 7200,
	];
}
