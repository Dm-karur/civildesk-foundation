<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database credentials
$hostname = 'localhost';
$username = 'u589483802_civilpro';
$password = 'Civilpro@123#';
$database = 'u589483802_civilpro';
$port = 3306;

echo "<h2>Database Connection Test</h2>";
echo "Attempting to connect to database '{$database}' as '{$username}' on {$hostname}...<br><br>";

// Create connection
$mysqli = new mysqli($hostname, $username, $password, $database, $port);

// Check connection
if ($mysqli->connect_error) {
    die("<span style='color:red;'><b>Connection failed:</b> " . $mysqli->connect_error . "</span>");
}

echo "<span style='color:green;'><b>Success!</b> Connected to the database successfully.</span>";
$mysqli->close();
?>
