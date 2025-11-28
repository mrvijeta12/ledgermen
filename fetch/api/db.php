<?php

$host = '109.106.254.201';
$dbname = 'u187264443_tekAlgo';
$username = 'u187264443_aman';
$password = 'Aman@8602';

$conn = new mysqli($host, $username, $password, $dbname);

// if ($conn->connect_error) {
//     die("Database Connection failed: " . $conn->connect_error);
// }
if ($conn->connect_error) {
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

?>