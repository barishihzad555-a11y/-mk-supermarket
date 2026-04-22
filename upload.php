<?php
header('Content-Type: application/json');

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$products_json = 'products.json';
$banners_json = 'banners.json';

function getData($file) {
    if (file_exists($file)) {
        return json_decode(file_get_contents($file), true) ?: [];
    }
    return [];
}

function saveData($file, $data) {
    file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $action = $_POST['action'] ?? '';
    $type = $_POST['type'] ?? 'product'; // 'product' or 'banner'
    $json_file = ($type === 'banner') ? $banners_json : $products_json;

    // Handle Delete
    if ($action === 'delete' && isset($_POST['id'])) {
        $id = $_POST['id'];
        $data = getData($json_file);
        $found = false;

        foreach ($data as $key => $item) {
            if ($item['id'] == $id) {
                if (file_exists($item['image'])) {
                    unlink($item['image']);
                }
                unset($data[$key]);
                $found = true;
                break;
            }
        }

        if ($found) {
            saveData($json_file, $data);
            echo json_encode(["status" => "success", "message" => ucfirst($type) . " deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Item not found"]);
        }
        exit;
    }

    // Handle Upload (New or Update)
    $id = $_POST['id'] ?? uniqid();
    $data = getData($json_file);
    $itemIndex = -1;

    foreach ($data as $key => $item) {
        if ($item['id'] == $id) {
            $itemIndex = $key;
            break;
        }
    }

    $image_path = ($itemIndex !== -1) ? $data[$itemIndex]['image'] : '';

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = $type . "_" . uniqid() . "." . $ext;
        $target_file = $target_dir . $filename;

        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            if ($image_path && file_exists($image_path)) {
                unlink($image_path);
            }
            $image_path = $target_file;
        }
    }
    // Handle Base64 (for cropped banners)
    else if (isset($_POST['image_base64'])) {
        $img = $_POST['image_base64'];
        $img = str_replace('data:image/webp;base64,', '', $img);
        $img = str_replace(' ', '+', $img);
        $fileData = base64_decode($img);
        $filename = "banner_" . uniqid() . ".webp";
        $target_file = $target_dir . $filename;

        if (file_put_contents($target_file, $fileData)) {
            if ($image_path && file_exists($image_path)) {
                unlink($image_path);
            }
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

} else if ($method === 'GET') {
    $type = $_GET['type'] ?? 'product';
    $json_file = ($type === 'banner') ? $banners_json : $products_json;
    echo json_encode(getData($json_file));
    exit;
}
?>