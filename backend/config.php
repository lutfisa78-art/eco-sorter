<?php

header("Content-Type: application/json; charset=UTF-8");

// CORS
$allowedOrigin = getenv('FRONTEND_URL');

if (
    isset($_SERVER['HTTP_ORIGIN']) &&
    $_SERVER['HTTP_ORIGIN'] === $allowedOrigin
) {
    header("Access-Control-Allow-Origin: " . $allowedOrigin);
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
}

// Preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Koneksi database menggunakan Environment Variables Railway
$host     = getenv('MYSQLHOST');
$user     = getenv('MYSQLUSER');
$pass     = getenv('MYSQLPASSWORD');
$db_name  = getenv('MYSQLDATABASE');
$port     = (int) getenv('MYSQLPORT');

// Menghubungkan ke database
$conn = new mysqli(
    $host,
    $user,
    $pass,
    $db_name,
    $port
);

// Mengecek koneksi
if ($conn->connect_error) {
    error_log('Database connection error: ' . $conn->connect_error);

    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Koneksi database gagal."
    ]);

    exit;
}

$conn->set_charset("utf8mb4");
?>