<?php
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "space_invaders";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$sql = "SELECT name, score FROM scores ORDER BY score DESC LIMIT 10";
$result = $conn->query($sql);

$scores = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $scores[] = $row;
    }
}

echo json_encode($scores);

$conn->close();
?>
