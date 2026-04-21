<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$targetDir = "../uploads/";

// Create folders with proper permissions for most servers
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0755, true);
}

$folder = $_POST['folder'] ?? 'products';
$uploadPath = $targetDir . $folder . "/";

if (!file_exists($uploadPath)) {
    mkdir($uploadPath, 0755, true);
}

$fileKey = isset($_FILES['file']) ? 'file' : (isset($_FILES['image']) ? 'image' : null);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $fileKey) {
    $file = $_FILES[$fileKey];
    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $fileName = time() . '_' . uniqid() . '.webp'; // Force webp extension
    $targetFilePath = $uploadPath . $fileName;

    if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
        chmod($targetFilePath, 0644); // Make file readable by everyone

        // Return relative path for better stability
        echo json_encode([
            "status" => "success",
            "url" => "uploads/" . $folder . "/" . $fileName
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Permission denied on server"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "No file uploaded"]);
}
?>