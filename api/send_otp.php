<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php'; // your DB connection
require_once __DIR__ . '/../phpmailer/PHPMailer.php';
require_once __DIR__ . '/../phpmailer/SMTP.php';
require_once __DIR__ . '/../phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --------------------------
// Get & validate email
// --------------------------
$email = trim($_POST['email'] ?? "");

if (empty($email)) {
    echo json_encode(["error" => "Email is required"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["error" => "Invalid email format"]);
    exit;
}

// Check MX records
$domain = substr(strrchr($email, "@"), 1);
if (!checkdnsrr($domain, "MX")) {
    echo json_encode(["error" => "Invalid email domain"]);
    exit;
}

// --------------------------
// Generate OTP & hash it
// --------------------------
$otp = rand(100000, 999999);
$hashedOtp = password_hash($otp, PASSWORD_DEFAULT);

// --------------------------
// Set timezone & timestamps
// --------------------------
date_default_timezone_set('Asia/Kolkata');
$created_at = date("Y-m-d H:i:s");
$expires_at = date("Y-m-d H:i:s", time() + 300); // 5 minutes from now

// --------------------------
// Remove old OTPs for same email
// --------------------------
$stmt = $conn->prepare("DELETE FROM lead_verification WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->close();

// --------------------------
// Insert new OTP
// --------------------------
try {
    $stmt = $conn->prepare("INSERT INTO lead_verification (email, otp, created_at, expires_at) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $email, $hashedOtp, $created_at, $expires_at);
    $stmt->execute();
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["error" => "Database insert failed: " . $e->getMessage()]);
    exit;
}

// --------------------------
// Send OTP email
// --------------------------
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'aaravmahima4@gmail.com';
    $mail->Password = 'xsdciteithgwpzeh';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom('aaravmahima4@gmail.com', 'Aarav');
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = "Your OTP Verification Code";
    $mail->Body = "
        <h2>Your OTP Code</h2>
        <h1 style='font-size:32px; letter-spacing:4px;'>{$otp}</h1>
        <p>This OTP is valid for only 5 minutes.</p>
    ";
    $mail->send();

    echo json_encode(["success" => "OTP sent successfully!"]);

} catch (Exception $e) {
    echo json_encode(["error" => "OTP email failed: " . $mail->ErrorInfo]);
}

$conn->close();
?>
