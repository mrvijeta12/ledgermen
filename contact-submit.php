<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=UTF-8');

require './phpmailer/Exception.php';
require './phpmailer/PHPMailer.php';
require './phpmailer/SMTP.php';

$response = ['status' => 'error', 'message' => 'Unknown error'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = trim($_POST['first_name'] ?? '');
    $lastName  = trim($_POST['last_name'] ?? '');
    $email     = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $phone     = trim($_POST['phone'] ?? '');

    if (!$firstName || !$lastName || !$email || !$phone) {
        $response['message'] = 'All fields are required.';
        echo json_encode($response);
        exit;
    }

    try {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'YOUR EMAIL'; // USE YOUR EMAIL HERE
        $mail->Password   = 'YOUR PASSKEY';     // USE YOUR PASSKEY HERE 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 465;

        $mail->setFrom('sender@gmail.com', 'Website Contact');
        $mail->addAddress('receiver@gmail.com', 'Receiver');
        $mail->addReplyTo($email, "$firstName $lastName");

        $mail->isHTML(true);
        $mail->Subject = 'Contact Form Submission';
        $mail->Body    = "
            <p><strong>Name:</strong> {$firstName} {$lastName}</p>
            <p><strong>Email:</strong> {$email}</p>
            <p><strong>Phone:</strong> {$phone}</p>
        ";

        if ($mail->send()) {
            $response = ['status' => 'success', 'message' => 'Message sent successfully.'];
        } else {
            $response['message'] = 'Mailer Error: ' . $mail->ErrorInfo;
        }
    } catch (Exception $e) {
        $response['message'] = 'Mailer Exception: ' . $e->getMessage();
    }
} else {
    $response['message'] = 'Invalid request method.';
}

echo json_encode($response);
exit;
