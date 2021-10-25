/*
* -------------------------------------------------------
*
*                       IMPORTS
*
* -------------------------------------------------------
*/
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
function createSQLConnection() {
    const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
    connection = mysql.createConnection(credentials);
    connection.connect(error => {
        if (error) {
            console.error(error);
            process.exit(-1);
        }
        console.log("An SQL connection was established to: " + credentials.database + " located at: " + credentials.host + " by: " + credentials.user);
    });
}
// Function to query the SQL connection
async function querySQLConnection(query) {
    await connection.query(query, (error, rows) => {
        if (error) {
            return -1;
        } else {
            return rows;
        }
    });  
}

/*
* -------------------------------------------------------
*
*                       SERVICE
*
* -------------------------------------------------------
*/

//  Set up the service
const service = express();
service.use(express.json());
// Get all restaurants with the name
service.get('/:restaurantName', (request, response) => {
    console.log("Request was gotten for a restaurants data");

});
// Get restaurant info based on its location


// TODO



/*
* -------------------------------------------------------
*
*                      INITIALIZE
*
* -------------------------------------------------------
*/

// Set up the SQL connection
createSQLConnection();
// Start the web service
const port = 8443;
service.listen(port, () => {
    console.log("Drivethru webservice is live");
});