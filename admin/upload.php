<?php
header('Content-Type: application/json');

// تصاویر محفوظ کرنے کے لیے فولڈرز
$targetDir = "../uploads/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

// اگر پروڈکٹ یا بینر کا الگ فولڈر بنانا ہو
$type = isset($_POST['type']) ? $_POST['type'] : 'general';
$uploadPath = $targetDir . $type . "/";
if (!file_exists($uploadPath)) {
    mkdir($uploadPath, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $fileName = time() . '_' . basename($file['name']);
    $targetFilePath = $uploadPath . $fileName;
    $fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);

    // صرف مخصوص فارمیٹس کی اجازت
    $allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'webp');
    if (in_array(strtolower($fileType), $allowTypes)) {
        if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
            // ویب سائٹ پر دکھانے کے لیے مکمل لنک
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $publicUrl = $protocol . "://" . $host . "/uploads/" . $type . "/" . $fileName;

            echo json_encode([
                "status" => "success",
                "message" => "Image uploaded successfully",
                "url" => $publicUrl
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Upload failed"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid file type"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No file received"]);
}
?>