<?php
header('Content-Type: application/json');

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$json_file = 'products.json';

// Function to get products
function getProducts($json_file) {
    if (file_exists($json_file)) {
        return json_decode(file_get_contents($json_file), true) ?: [];
    }
    return [];
}

// Function to save products
function saveProducts($json_file, $products) {
    file_put_contents($json_file, json_encode(array_values($products), JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Handle Delete Action
    if (isset($_POST['action']) && $_POST['action'] === 'delete' && isset($_POST['id'])) {
        $id = $_POST['id'];
        $products = getProducts($json_file);
        $found = false;

        foreach ($products as $key => $product) {
            if ($product['id'] === $id) {
                // Delete image file
                if (file_exists($product['image'])) {
                    unlink($product['image']);
                }
                unset($products[$key]);
                $found = true;
                break;
            }
        }

        if ($found) {
            saveProducts($json_file, $products);
            echo json_encode(["status" => "success", "message" => "Product deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Product not found"]);
        }
        exit;
    }

    // Handle Update Action
    if (isset($_POST['action']) && $_POST['action'] === 'update' && isset($_POST['id'])) {
        $id = $_POST['id'];
        $products = getProducts($json_file);
        $found = false;

        foreach ($products as &$product) {
            if ($product['id'] === $id) {
                $product['name'] = $_POST['name'] ?? $product['name'];
                $product['price'] = (int)($_POST['price'] ?? $product['price']);
                $product['stock'] = (int)($_POST['stock'] ?? $product['stock']);
                $product['category'] = $_POST['category'] ?? $product['category'];

                // Handle image update if a new one is provided
                if (isset($_FILES['product_image']) && $_FILES['product_image']['error'] === UPLOAD_ERR_OK) {
                    $file = $_FILES['product_image'];
                    $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                    $new_filename = uniqid() . '.' . $file_extension;
                    $target_file = $target_dir . $new_filename;

                    if (move_uploaded_file($file['tmp_name'], $target_file)) {
                        // Delete old image
                        if (file_exists($product['image'])) {
                            unlink($product['image']);
                        }
                        $product['image'] = $target_file;
                    }
                }

                $found = true;
                $updatedProduct = $product;
                break;
            }
        }

        if ($found) {
            saveProducts($json_file, $products);
            echo json_encode(["status" => "success", "message" => "Product updated successfully", "product" => $updatedProduct]);
        } else {
            echo json_encode(["status" => "error", "message" => "Product not found"]);
        }
        exit;
    }

    // Handle Upload Action
    if (isset($_FILES['product_image'])) {
        $file = $_FILES['product_image'];
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $new_filename = uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;

        $check = getimagesize($file['tmp_name']);
        if($check !== false) {
            if (move_uploaded_file($file['tmp_name'], $target_file)) {
                $category = $_POST['category'] ?? 'popular';
                // Standardize category names for the frontend
                if ($category === 'Flash Sale') {
                    $category = 'flash';
                }

                $newProduct = [
                    "id" => uniqid(),
                    "name" => $_POST['name'] ?? 'New Product',
                    "price" => (int)($_POST['price'] ?? 0),
                    "stock" => (int)($_POST['stock'] ?? 0),
                    "category" => $category,
                    "image" => $target_file,
                    "timestamp" => time()
                ];

                $products = getProducts($json_file);
                $products[] = $newProduct;
                saveProducts($json_file, $products);

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
        exit;
    }
} else if ($method === 'GET') {
    echo json_encode(getProducts($json_file));
    exit;
}

echo json_encode(["status" => "error", "message" => "Invalid request."]);
?>
