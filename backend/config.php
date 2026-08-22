<?php

header("Content-Type: application/json; charset=UTF-8");

// CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Railway
$host = getenv('MYSQLHOST');
$user = getenv('MYSQLUSER');
$pass = getenv('MYSQLPASSWORD');
$db_name = getenv('MYSQLDATABASE');
$port = (int) getenv('MYSQLPORT');

$conn = new mysqli(
    $host,
    $user,
    $pass,
    $db_name,
    $port
);

if ($conn->connect_error) {

    error_log("Database connection error: " . $conn->connect_error);

    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal: " . $conn->connect_error
    ]);

    exit;
}

$conn->set_charset("utf8mb4");

?>