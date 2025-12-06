<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// Get latitude and longitude from the request
$lat = $_GET['lat'] ?? null;
$lon = $_GET['lon'] ?? null;

// Check if latitude and longitude are provided
if (!$lat || !$lon) {
    echo json_encode(['error' => 'Missing lat or lon']);
    exit;
}

// Check if latitude and longitude are valid numbers
if (!is_numeric($lat) || !is_numeric($lon)) {
    echo json_encode(['error' => 'Invalid lat or lon. They must be numeric.']);
    exit;
}

// Check if latitude and longitude are within valid ranges
if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    echo json_encode(['error' => 'Invalid lat or lon. Latitude must be between -90 and 90, and longitude must be between -180 and 180.']);
    exit;
}

// BigDataCloud reverse geocode API URL
$url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=$lat&longitude=$lon&localityLanguage=en";

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// Enable cURL to follow redirects
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Execute cURL request
$response = curl_exec($ch);

// Check for cURL errors
if (curl_errno($ch)) {
    echo json_encode(['error' => 'Failed to fetch data from BigDataCloud', 'details' => curl_error($ch)]);
} else {
    // Check HTTP response code
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($httpCode != 200) {
        echo json_encode(['error' => 'Failed to fetch valid data from BigDataCloud', 'http_code' => $httpCode]);
    } else {
        // Check if the response is empty or invalid
        if (empty($response)) {
            echo json_encode(['error' => 'No data received from BigDataCloud']);
        } else {
            // Output the response from the API
            echo $response;
        }
    }
}

// Close cURL connection
curl_close($ch);
?>
