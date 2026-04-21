<?php
header('Content-Type: application/json');

// تصاویر محفوظ کرنے کے لیے فولڈرز
$targetDir = "../uploads/";
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// فولڈر کا نام (products یا banners)
$folder = isset($_POST['folder']) ? $_POST['folder'] : (isset($_POST['type']) ? $_POST['type'] : 'general');
$uploadPath = $targetDir . $folder . "/";
if (!file_exists($uploadPath)) {
    mkdir($uploadPath, 0777, true);
}

// فائل کو چیک کریں (file یا image دونوں ناموں کو سپورٹ کرتا ہے)
$fileKey = isset($_FILES['file']) ? 'file' : (isset($_FILES['image']) ? 'image' : null);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $fileKey) {
    $file = $_FILES[$fileKey];
    $fileName = time() . '_' . basename($file['name']);
    $targetFilePath = $uploadPath . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];

        // راستہ درست کریں تاکہ ویب سائٹ سے ایکسیس ہو سکے
        $publicUrl = $protocol . "://" . $host . "/uploads/" . $folder . "/" . $fileName;

        echo json_encode([
            "status" => "success",
            "url" => $publicUrl
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Could not save file"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No file received"]);
}
?>