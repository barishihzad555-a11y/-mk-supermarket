<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$products_json = 'products.json';
$banners_json = 'banners.json';
$settings_json = 'settings.json';

function getData($file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        return json_decode($content, true) ?: [];
    }
    return [];
}

function saveData($file, $data) {
    return file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        $action = $_POST['action'] ?? '';
        $type = $_POST['type'] ?? 'product';
        $json_file = ($type === 'banner') ? $banners_json : $products_json;
        $data = getData($json_file);

        // Handle Delete
        if ($action === 'delete' && isset($_POST['id'])) {
            $id = $_POST['id'];
            $found = false;
            foreach ($data as $key => $item) {
                if ($item['id'] == $id) {
                    if (!empty($item['image']) && file_exists($item['image'])) {
                        unlink($item['image']);
                    }
                    unset($data[$key]);
                    $found = true;
                    break;
                }
            }
            if ($found) {
                saveData($json_file, $data);
                echo json_encode(["status" => "success", "message" => "Deleted successfully"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Item not found"]);
            }
            exit;
        }

        // Handle Upload/Save
        $id = $_POST['id'] ?? uniqid();
        $itemIndex = -1;
        foreach ($data as $key => $item) {
            if ($item['id'] == $id) { $itemIndex = $key; break; }
        }

        $image_path = ($itemIndex !== -1) ? $data[$itemIndex]['image'] : '';

        // Case 1: Normal File Upload
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $ext = strtolower(pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION));
            $filename = $type . "_" . uniqid() . "." . $ext;
            $target_file = $target_dir . $filename;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $target_file)) {
                if ($image_path && file_exists($image_path)) unlink($image_path);
                $image_path = $target_file;
            }
        }
        // Case 2: Base64 Upload (Cropped Banners)
        else if (isset($_POST['image_base64'])) {
            $img = $_POST['image_base64'];
            $img = str_replace('data:image/webp;base64,', '', $img);
            $img = str_replace(' ', '+', $img);
            $fileData = base64_decode($img);
            $filename = "banner_" . uniqid() . ".webp";
            $target_file = $target_dir . $filename;
            if (file_put_contents($target_file, $fileData)) {
                if ($image_path && file_exists($image_path)) unlink($image_path);
                $image_path = $target_file;
            }
        }

        if (!$image_path) {
            echo json_encode(["status" => "error", "message" => "Image is required"]);
            exit;
        }

        if ($type === 'product') {
            $newItem = [
                "id" => $id,
                "name" => $_POST['name'] ?? 'New Product',
                "price" => (int)($_POST['price'] ?? 0),
                "stock" => (int)($_POST['stock'] ?? 0),
                "category" => $_POST['category'] ?? 'popular',
                "image" => $image_path,
                "timestamp" => time()
            ];
        } else {
            $newItem = [
                "id" => $id,
                "image" => $image_path,
                "timestamp" => time()
            ];
        }

        if ($itemIndex !== -1) {
            $data[$itemIndex] = $newItem;
        } else {
            $data[] = $newItem;
        }

        saveData($json_file, $data);
        echo json_encode(["status" => "success", "message" => "Saved successfully", "item" => $newItem]);
        exit;
    }
    else if ($method === 'PATCH') {
        // Simple mechanism for saving settings
        $settings = json_decode(file_get_contents('php://input'), true);
        if ($settings) {
            saveData($settings_json, $settings);
            echo json_encode(["status" => "success", "message" => "Settings updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid settings data"]);
        }
        exit;
    }
    else if ($method === 'GET') {
        $type = $_GET['type'] ?? 'product';
        if ($type === 'settings') {
            echo json_encode(getData($settings_json));
        } else {
            $json_file = ($type === 'banner') ? $banners_json : $products_json;
            echo json_encode(getData($json_file));
        }
        exit;
    }
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>