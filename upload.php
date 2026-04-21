<?php
header('Content-Type: application/json');

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$json_file = 'products.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['product_image'])) {
    $file = $_FILES['product_image'];
    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $new_filename = uniqid() . '.' . $file_extension;
    $target_file = $target_dir . $new_filename;

    // Check if image file is a actual image
    $check = getimagesize($file['tmp_name']);
    if($check !== false) {
        if (move_uploaded_file($file['tmp_name'], $target_file)) {

            // Get product details from POST
            $newProduct = [
                "id" => uniqid(),
                "name" => $_POST['name'] ?? 'New Product',
                "price" => (int)($_POST['price'] ?? 0),
                "stock" => (int)($_POST['stock'] ?? 0),
                "category" => $_POST['category'] ?? 'Groceries',
                "image" => $target_file,
                "timestamp" => time()
            ];

            // Save to products.json
            $products = [];
            if (file_exists($json_file)) {
                $products = json_decode(file_get_contents($json_file), true);
            }
            $products[] = $newProduct;
            file_put_contents($json_file, json_encode($products, JSON_PRETTY_PRINT));

            echo json_encode([
                "status" => "success",
                "message" => "Product and Image saved successfully",
                "url" => $target_file,
                "product" => $newProduct
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to move uploaded file."]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "File is not an image."]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Return all products
    if (file_exists($json_file)) {
        echo file_get_contents($json_file);
    } else {
        echo json_encode([]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request."]);
}
?>
