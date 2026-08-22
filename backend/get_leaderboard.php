<?php

include "config.php";

// Endpoint hanya menerima GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);

    echo json_encode([
        "status" => "error",
        "message" => "Method tidak diizinkan."
    ]);

    exit;
}

$sql = "SELECT nickname, score
        FROM leaderboard
        ORDER BY score DESC
        LIMIT 10";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Gagal mengambil data leaderboard."
    ]);

    $conn->close();
    exit;
}

$leaderboard = [];

while ($row = $result->fetch_assoc()) {

    $leaderboard[] = [
        "nickname" => $row['nickname'],
        "score" => (int) $row['score']
    ];
}

echo json_encode($leaderboard);

$conn->close();
?>