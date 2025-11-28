<?php
header("Content-Type: application/json; charset=UTF-8");
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/db.php'; // Include your database connection file

date_default_timezone_set('Asia/Kolkata');

try {
    // Prepare and execute the SQL query
    $sql = "SELECT id, name, email, contact_number, message, page, location, country_code ,cta, date, time, created_at 
            FROM website_lead_form 
            ORDER BY created_at DESC";

    $result = $conn->query($sql);

    if (!$result) {
        echo json_encode(["error" => "Database query failed: " . $conn->error]);
        exit;
    }

    $leads = [];

    while ($row = $result->fetch_assoc()) {
        $leads[] = $row;
    }

    // Send JSON response
    echo json_encode([
        "success" => true,
        "count" => count($leads),
        "data" => $leads
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        "error" => "An unexpected error occurred: " . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>
