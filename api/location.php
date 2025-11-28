<?php
header("Content-Type: application/json; charset=UTF-8");

// Reject if missing parameters
if (!isset($_GET['lat']) || !isset($_GET['lon'])) {
    echo json_encode(["error" => "Missing latitude or longitude"]);
    exit;
}

$lat = urlencode($_GET['lat']);
$lon = urlencode($_GET['lon']);

$apiUrl = "https://api-bdc.io/data/reverse-geocode-client?latitude=$lat&longitude=$lon&localityLanguage=en";

// Call BigDataCloud server-to-server
$response = file_get_contents($apiUrl);

// Output API response back to frontend
echo $response;
?>
