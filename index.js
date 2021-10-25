const express = require('express');
const fs = require('fs');
const mysql = require('mysql');
// Grab database credentials
const json = fs.readFileSync('credentials.json', 'utf8');
const credentials = JSON.parse(json);
// Open a connection to the database






// Set up the service
const service = express();
service.use(express.json());
// Get all restaurants with the name
service.get('/:restaurantName', (request, response) => {
    console.log("Request was gotten for a restaurants data");

});
// Get restaurant info based on its location




//Specify the port and start the service
const port = 8443;
service.listen(port, () => {
    console.log("Drivethru webservice is live");
});