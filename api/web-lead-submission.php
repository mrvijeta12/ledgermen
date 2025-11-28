<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

// $allowed_host = "ledgermen.com"; // No https, no slash

// $origin  = $_SERVER['HTTP_ORIGIN']  ?? "";
// $referer = $_SERVER['HTTP_REFERER'] ?? "";
// $host    = $_SERVER['HTTP_HOST']    ?? "";

// // Allow only your domain
// if (
//     // Not accessed from your own website
//     (
//         strpos($origin, $allowed_host) === false &&
//         strpos($referer, $allowed_host) === false
//     )
//     ||
//     // Ensure API is not called using IP address
//     ($host !== $allowed_host)
// ) {
//     echo json_encode(["error" => "Unauthorized request source"]);
//     exit();
// }

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../phpmailer/PHPMailer.php';
require_once __DIR__ . '/../phpmailer/SMTP.php';
require_once __DIR__ . '/../phpmailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

date_default_timezone_set('Asia/Kolkata');

// ---------------------------------------------------------------
// 🔐 1. BLOCK submission if OTP is NOT verified
// ---------------------------------------------------------------
if (!isset($_SESSION['email_verified']) || $_SESSION['email_verified'] !== true) {
    echo json_encode(["error" => "Please verify your email using OTP before submitting."]);
    exit;
}

// ---------------------------------------------------------------
// 2. Get and sanitize form data
// ---------------------------------------------------------------
$name = trim($_POST['name'] ?? "");
$email = trim($_POST['email'] ?? "");
$contact_number = trim($_POST['phone'] ?? "");
$message = trim($_POST['message'] ?? "");
$page = trim($_POST['page'] ?? "");
$location = trim($_POST['location'] ?? "Unknown");
$countryCode = trim($_POST['countryCode'] ?? "Unknown");
$cta = trim($_POST['cta'] ?? "");
$date = date("Y-m-d");
$time = date("H:i:s");
$created_at = date("Y-m-d H:i:s");

// ---------------------------------------------------------------
// 3. Validate email
// ---------------------------------------------------------------
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["error" => "Invalid email format"]);
    exit;
}

$domain = substr(strrchr($email, "@"), 1);
if (!checkdnsrr($domain, "MX")) {
    echo json_encode(["error" => "Invalid email domain"]);
    exit;
}

// ---------------------------------------------------------------
// 4. Insert into MySQL
// ---------------------------------------------------------------
$stmt = $conn->prepare(
    "INSERT INTO website_lead_form 
    (name,email,contact_number,message,page,location,country_code,cta,date,time,created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

if (!$stmt) {
    echo json_encode(["error" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param(
    "sssssssssss",
    $name, $email, $contact_number, $message,
    $page, $location, $countryCode, $cta, $date, $time, $created_at
);

if (!$stmt->execute()) {
    echo json_encode(["error" => "Database insertion failed: " . $stmt->error]);
    exit;
}

// ---------------------------------------------------------------
// 5. Send confirmation emails
// ---------------------------------------------------------------
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

    // --- Email to user ---
    $mail->clearAllRecipients();
    $mail->addAddress($email, $name);
    $mail->isHTML(true);
    $mail->Subject = "Thank you for contacting us!";
    $mail->Body = "
        <h3>Hello {$name}</h3>
        <p>Thank you for reaching out to us. Your request has been successfully received.</p>
        <p>Our team will contact you within one business day.</p>
        <p>Best Regards,<br>Vinita Goyal<br>Ledgermen</p>
    ";
    $mail->send();

    // --- Email to internal team ---
    $mail->clearAllRecipients();
    $mail->addAddress('vijetavarma1@gmail.com');
    // $mail->addAddress('sonishreyans2@gmail.com');
    $mail->Subject = "New Website Lead: {$name}";
    $mail->Body = "
        <p><strong>Name:</strong> {$name}<br>
        <strong>Email:</strong> {$email}<br>
        <strong>Phone:</strong> {$contact_number}<br>
        <strong>Message:</strong> {$message}<br>
        <strong>Page:</strong> {$page}<br>
        <strong>Location:</strong> {$location}<br>
        <strong>Country Code:</strong> {$countryCode}<br>
        <strong>CTA:</strong> {$cta}<br>
        <strong>Submitted At:</strong> {$created_at}</p>
    ";
    $mail->send();

    // ---------------------------------------------------------------
    // 6. Clear OTP after successful submission (IMPORTANT)
    // ---------------------------------------------------------------
    unset($_SESSION['otp'], $_SESSION['otp_expiry'], $_SESSION['email_verified'], $_SESSION['otp_email']);

    echo json_encode(["success" => "Your details have been submitted successfully!"]);

} catch (Exception $e) {
    echo json_encode(["error" => "Email could not be sent: " . $mail->ErrorInfo]);
}

$stmt->close();
$conn->close();
?>
