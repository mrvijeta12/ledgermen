<?php
if (ob_get_length()) ob_clean();
header("Content-Type: application/json");
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php'; 

// --- Set server timezone (optional, adjust as needed) ---
date_default_timezone_set('Asia/Kolkata');

// --- Get and sanitize form data ---
$name = trim($_POST['name'] ?? "");
$email = trim($_POST['email'] ?? "");
$contact_number = trim($_POST['phone'] ?? "");
$message = trim($_POST['message'] ?? "");
$page = trim($_POST['page'] ?? "");
$location = trim($_POST['location'] ?? "Unknown");

// --- Generate current date and time ---
$date = date("Y-m-d");      // MySQL DATE format
$time = date("H:i:s");      // MySQL TIME format
$created_at = date("Y-m-d H:i:s");

// --- Use prepared statement for security ---
$stmt = $conn->prepare(
    "INSERT INTO website_lead_form (name, email, contact_number, message, page, location, date, time, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)"
);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed: " . $conn->error]);
    exit;
}

$stmt->bind_param(
    "sssssssss",
    $name,
    $email,
    $contact_number,
    $message,
    $page,
    $location,
    $date,
    $time,
    $created_at
);

if ($stmt->execute()) {
    echo json_encode(["success" => "Your details have been submitted successfully!"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save data. Please try again."]);
}

$stmt->close();
$conn->close();
?>
