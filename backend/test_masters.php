<?php
require '/home/u589483802/domains/foundation.civildesk.in/public_html/backend/vendor/autoload.php';
require '/home/u589483802/domains/foundation.civildesk.in/public_html/backend/app/Config/Paths.php';
$paths = new Config\Paths();
require '/home/u589483802/domains/foundation.civildesk.in/public_html/backend/vendor/codeigniter4/framework/system/Boot.php';
CodeIgniter\Boot::bootTest($paths);
$controller = new App\Controllers\Api\MastersController();
$response = $controller->index();
echo substr($response->getBody(), 0, 500) . PHP_EOL;
echo "SUCCESS STATUS: " . $response->getStatusCode() . PHP_EOL;
