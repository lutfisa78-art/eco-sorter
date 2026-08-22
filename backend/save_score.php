<?php

include "config.php";

// Endpoint hanya menerima POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);

    echo json_encode([
        "status" => "error",
        "message" => "Method tidak diizinkan."
    ]);

    exit;
}

// Mengambil data JSON dari React
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "status" => "failed",
        "message" => "Format data tidak valid."
    ]);

    exit;
}

// Mengambil nickname
$nickname = $data['nickname'] ?? $data['name'] ?? null;

// Mengambil score
$score = $data['score'] ?? null;

// Validasi nickname
if (!is_string($nickname) || trim($nickname) === '') {
    http_response_code(400);

    echo json_encode([
        "status" => "failed",
        "message" => "Nickname wajib diisi."
    ]);

    exit;
}

$nickname = trim($nickname);

// Maksimal 50 karakter sesuai struktur database
if (mb_strlen($nickname) > 50) {
    http_response_code(400);

    echo json_encode([
        "status" => "failed",
        "message" => "Nickname maksimal 50 karakter."
    ]);

    exit;
}

// Validasi score
if (
    filter_var($score, FILTER_VALIDATE_INT) === false ||
    $score < 0 ||
    $score > 100000
) {
    http_response_code(400);

    echo json_encode([
        "status" => "failed",
        "message" => "Nilai skor tidak valid."
    ]);

    exit;
}

$score = (int) $score;


// ========================================
// CEK NICKNAME
// ========================================

$checkStmt = $conn->prepare(
    "SELECT score
     FROM leaderboard
     WHERE nickname = ?"
);

if (!$checkStmt) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Terjadi kesalahan server."
    ]);

    $conn->close();
    exit;
}

$checkStmt->bind_param("s", $nickname);
$checkStmt->execute();

$result = $checkStmt->get_result();


// ========================================
// NICKNAME SUDAH ADA
// ========================================

if ($result->num_rows > 0) {

    $row = $result->fetch_assoc();
    $oldScore = (int) $row['score'];

    // Update hanya jika skor baru lebih tinggi
    if ($score > $oldScore) {

        $updateStmt = $conn->prepare(
            "UPDATE leaderboard
             SET score = ?
             WHERE nickname = ?"
        );

        if (!$updateStmt) {
            http_response_code(500);

            echo json_encode([
                "status" => "error",
                "message" => "Terjadi kesalahan server."
            ]);

            $checkStmt->close();
            $conn->close();
            exit;
        }

        $updateStmt->bind_param(
            "is",
            $score,
            $nickname
        );

        if ($updateStmt->execute()) {

            echo json_encode([
                "status" => "success",
                "message" => "Skor tertinggi baru diperbarui!"
            ]);

        } else {

            http_response_code(500);

            echo json_encode([
                "status" => "error",
                "message" => "Gagal memperbarui skor."
            ]);
        }

        $updateStmt->close();

    } else {

        echo json_encode([
            "status" => "success",
            "message" => "Skor lama masih lebih tinggi, data tidak diubah."
        ]);
    }


// ========================================
// NICKNAME BELUM ADA
// ========================================

} else {

    $insertStmt = $conn->prepare(
        "INSERT INTO leaderboard (nickname, score)
         VALUES (?, ?)"
    );

    if (!$insertStmt) {
        http_response_code(500);

        echo json_encode([
            "status" => "error",
            "message" => "Terjadi kesalahan server."
        ]);

        $checkStmt->close();
        $conn->close();
        exit;
    }

    $insertStmt->bind_param(
        "si",
        $nickname,
        $score
    );

    if ($insertStmt->execute()) {

        echo json_encode([
            "status" => "success",
            "message" => "Skor baru berhasil disimpan!"
        ]);

    } else {

        http_response_code(500);

        echo json_encode([
            "status" => "error",
            "message" => "Gagal menyimpan skor baru."
        ]);
    }

    $insertStmt->close();
}

$checkStmt->close();
$conn->close();

?>