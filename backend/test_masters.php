<?php
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/app/Config/Paths.php';
$paths = new Config\Paths();
require __DIR__ . '/vendor/codeigniter4/framework/system/Boot.php';
CodeIgniter\Boot::bootTest($paths);
$controller = new App\Controllers\Api\MastersController();
$response = $controller->index();
echo substr($response->getBody(), 0, 500) . PHP_EOL;
echo "SUCCESS STATUS: " . $response->getStatusCode() . PHP_EOL;
