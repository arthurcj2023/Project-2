/*
* -------------------------------------------------------
*
*                       IMPORTS
*
* -------------------------------------------------------
*/

// Import needed libraries as constants
const express = require('express');
const fs = require('fs');
const mysql = require('mysql');

/*
* -------------------------------------------------------
*
*                          SQL
*
* -------------------------------------------------------
*/

// Variable to hold SQL connection
let connection = null;
// Function to create the SQL connection
async function createSQLConnection() {
    // Load in credentials from credentials.json
    const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
    // Create the SQL connection
    connection = mysql.createConnection(credentials);
    // Attempt to connect to the database pointed to by the JSON data
    await new Promise((resolve) => { connection.connect(error => {
        if (error) {
            console.error(error);
            process.exit(-1);
        }
        console.log("An SQL connection was established to: " + credentials.database + " at: " + credentials.host + " by: " + credentials.user + ".");
        resolve(0);
    })});
}
// Function to query the SQL connection
function querySQLConnection(query) {
    return new Promise((resolve) => {
        // Send the query to the connection
        connection.query(query, (error, rows) => {
            if (error) {
                resolve(error);
            } else {
                resolve(rows);
            }
        });
    });
}

/*
* -------------------------------------------------------
*
*                       SERVICE
*
* -------------------------------------------------------
*/

//Variable to hold the service
let service = null;
// Function to set up the service
async function setupService() {
    service = express();
    service.use(express.json());
    // Get all restaurants with the name
    service.get('/:restaurantName', (request, response) => {
        console.log("Request was gotten for a restaurants data.");
        output = querySQLConnection('SELECT * FROM drivethru.restaurant');
        console.log(output);
    });
}

/*
* -------------------------------------------------------
*
*                      INITIALIZE
*
* -------------------------------------------------------
*/

// Async top level function to support async requests
(async function () {
    // Set up the SQL connection
    await createSQLConnection();
    // Set up the service
    await setupService();
    // Start the web service
    const port = 8443;
    service.listen(port, () => {
        console.log("The drivethru webservice is live.");
    });
})();