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

$name = $_POST['name'];
$score = $_POST['score'];

$sql = "INSERT INTO scores (name, score) VALUES ('$name', '$score')";

if ($conn->query($sql) === TRUE) {
    echo "New record created successfully";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();
?>
