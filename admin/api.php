<?php
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$type = $_GET['type'] ?? ''; // products or banners

$dataFile = "../data/" . $type . ".json";

if (!file_exists("../data/")) {
    mkdir("../data/", 0755, true);
}

if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

switch ($action) {
    case 'list':
        echo file_get_contents($dataFile);
        break;

    case 'save':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            echo json_encode(["status" => "error", "message" => "No data provided"]);
            break;
        }

        $currentData = json_decode(file_get_contents($dataFile), true);

        if (isset($data['id']) && $data['id'] !== '') {
            // Update existing
            foreach ($currentData as &$item) {
                if ($item['id'] == $data['id']) {
                    $item = array_merge($item, $data);
                    break;
                }
            }
        } else {
            // Add new
            $data['id'] = time();
            $data['created_at'] = date('Y-m-d H:i:s');
            $currentData[] = $data;
        }

        if (file_put_contents($dataFile, json_encode($currentData, JSON_PRETTY_PRINT))) {
            echo json_encode(["status" => "success", "message" => "Data saved successfully", "id" => $data['id']]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to save data"]);
        }
        break;

    case 'delete':
        $id = $_GET['id'] ?? '';
        if (!$id) {
            echo json_encode(["status" => "error", "message" => "No ID provided"]);
            break;
        }

        $currentData = json_decode(file_get_contents($dataFile), true);
        $newData = array_filter($currentData, function($item) use ($id) {
            return $item['id'] != $id;
        });

        if (file_put_contents($dataFile, json_encode(array_values($newData), JSON_PRETTY_PRINT))) {
            echo json_encode(["status" => "success", "message" => "Deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to delete"]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
        break;
}
?>