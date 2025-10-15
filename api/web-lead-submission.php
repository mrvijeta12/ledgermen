<?php
header("Content-Type: application/json");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php'; 

// --- Get and sanitize form data ---
$name = trim($_POST['name'] ?? "");
$email = trim($_POST['email'] ?? "");
$contact_number = trim($_POST['phone'] ?? "");
$message = trim($_POST['message'] ?? "");
$page = trim($_POST['page'] ?? "");
$location = trim($_POST['location'] ?? "Unknown");



// --- Use prepared statement for security ---
$stmt = $conn->prepare("INSERT INTO website_lead_form (name, email, contact_number, message, page, location) VALUES (?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    // Output JSON error instead of plain text
    http_response_code(500);
    echo json_encode(["error" => "Prepare failed: " . $conn->error]);
    exit;
}
$stmt->bind_param("ssssss", $name, $email, $contact_number, $message, $page, $location);

if ($stmt->execute()) {
    echo json_encode(["success" => "Your details have been submitted successfully!"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to save data. Please try again."]);
}

$stmt->close();
$conn->close();
?>
