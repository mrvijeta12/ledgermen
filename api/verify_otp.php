<?php
session_start(); // ✅ Add this

header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php'; // your DB connection

$email = trim($_POST['email'] ?? "");
$otp = trim($_POST['otp'] ?? "");

if (empty($email) || empty($otp)) {
    echo json_encode(["error" => "Email and OTP are required"]);
    exit;
}

// Fetch latest unverified OTP for this email
$stmt = $conn->prepare("SELECT id, otp, expires_at, verified FROM lead_verification WHERE email = ? ORDER BY created_at DESC LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stmt->close();

if (!$row) {
    echo json_encode(["error" => "No OTP found for this email"]);
    exit;
}

// Check if already verified
if ($row['verified'] == 1) {
    echo json_encode(["error" => "OTP already verified"]);
    exit;
}

// Check if expired
$current_time = date("Y-m-d H:i:s");
if ($current_time > $row['expires_at']) {
    echo json_encode(["error" => "OTP expired"]);
    exit;
}

// Verify OTP (hashed)
if (password_verify($otp, $row['otp'])) {
    $stmt = $conn->prepare("UPDATE lead_verification SET verified = 1, verified_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $row['id']);
    $stmt->execute();
    $stmt->close();

    // ✅ Set session so PHP submission knows email is verified
    $_SESSION['email_verified'] = true;
    $_SESSION['otp_email'] = $email;

    echo json_encode(["success" => "OTP verified successfully"]);
    exit;
} else {
    echo json_encode(["error" => "Invalid OTP"]);
    exit;
}
?>
