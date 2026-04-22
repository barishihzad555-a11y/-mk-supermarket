<?php
header('Content-Type: application/json');

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

// Function to get data
function getData($file) {
    if (file_exists($file)) {
        return json_decode(file_get_contents($file), true) ?: [];
    }
    return [];
}

// Function to save data
function saveData($file, $data) {
    file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($method === 'POST') {
    // --- PRODUCT ACTIONS ---
    if ($action === 'upload_product' || isset($_FILES['product_image'])) {
        $file = $_FILES['product_image'];
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $new_filename = 'prod_' . uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;

        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            $newProduct = [
                "id" => uniqid(),
                "name" => $_POST['name'] ?? 'New Product',
                "price" => (int)($_POST['price'] ?? 0),
                "stock" => (int)($_POST['stock'] ?? 0),
                "category" => $_POST['category'] ?? 'popular',
                "image" => $target_file,
                "timestamp" => time()
            ];
            $products = getData('products.json');
            $products[] = $newProduct;
            saveData('products.json', $products);
            echo json_encode(["status" => "success", "product" => $newProduct]);
        }
        exit;
    }

    if ($action === 'delete_product') {
        $id = $_POST['id'];
        $products = getData('products.json');
        foreach ($products as $key => $p) {
            if ($p['id'] === $id) {
                if (file_exists($p['image'])) unlink($p['image']);
                unset($products[$key]);
                break;
            }
        }
        saveData('products.json', $products);
        echo json_encode(["status" => "success"]);
        exit;
    }

    // --- BANNER ACTIONS ---
    if ($action === 'upload_banner') {
        $data = $_POST['image']; // Base64 from cropper
        if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
            $data = substr($data, strpos($data, ',') + 1);
            $type = strtolower($type[1]);
            $data = base64_decode($data);
            $filename = 'banner_' . uniqid() . '.' . $type;
            $target_file = $target_dir . $filename;

            if (file_put_contents($target_file, $data)) {
                $banners = getData('banners.json');
                $newBanner = ["id" => uniqid(), "image" => $target_file];
                $banners[] = $newBanner;
                saveData('banners.json', $banners);
                echo json_encode(["status" => "success", "banner" => $newBanner]);
            }
        }
        exit;
    }

    if ($action === 'delete_banner') {
        $id = $_POST['id'];
        $banners = getData('banners.json');
        foreach ($banners as $key => $b) {
            if ($b['id'] === $id) {
                if (file_exists($b['image'])) unlink($b['image']);
                unset($banners[$key]);
                break;
            }
        }
        saveData('banners.json', $banners);
        echo json_encode(["status" => "success"]);
        exit;
    }
} else if ($method === 'GET') {
    if ($action === 'get_banners') {
        echo json_encode(getData('banners.json'));
    } else {
        echo json_encode(getData('products.json'));
    }
    exit;
}
?>
