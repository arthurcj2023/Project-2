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
    await new Promise((resolve) => {
        connection.connect(error => {
            if (error) {
                console.error(error);
                process.exit(-1);
            }
            console.log("An SQL connection was established to: " + credentials.database + " at: " + credentials.host + " by: " + credentials.user + ".");
            resolve(0);
        })
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
    // Initialize the express service
    service = express();
    // Tell the service to use JSON request and response formats
    service.use(express.json());

    /*
    *
    *             READ REQUESTS
    *
    */

    // Get all chains and their contact info
    service.get('/chains', (request, response) => {
        const query = 'SELECT drivethru.chain.CHAIN_NAME FROM drivethru.chain;';
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                response.json({
                    ok: true,
                    results: rows,
                    // TODO format output
                });
            }
        });
    });
    // Get all chains' contact info
    service.get('/phoneNumbers', (request, response) => {
        const query = 'SELECT drivethru.chain.CHAIN_NAME, drivethru.chain.CHAIN_PHONE FROM drivethru.chain;';
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                response.json({
                    ok: true,
                    results: rows,
                    // TODO format output
                });
            }
        });
    });
    // Get a specific chain's contact info
    service.get('/phoneNumber/:chainName', (request, response) => {
        const chainName = request.params.chainName;
        console.log(chainName);
        const query = `SELECT drivethru.chain.CHAIN_PHONE FROM drivethru.chain WHERE driveThru.chain.CHAIN_NAME = "${chainName}"`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                response.json({
                    ok: true,
                    results: rows,
                    // TODO format output
                });
            }
        });
    });
    // Get all restaurants of a chain
    service.get('/restaurantLocations/:chainName', (request, response) => {

    });

    /*
    *
    *             UPDATE REQUESTS
    *
    */

    // Updates a chain's phone number
    service.patch('/phoneNumber/:chainId', (request, response) => {
        const chainId = request.params.chainId;;
        const newPhoneNumber = request.body.newPhoneNumber;
        const query = `UPDATE drivethru.chain SET drivethru.chain.CHAIN_PHONE = "${newPhoneNumber}" WHERE drivethru.chain.CHAIN_ID = ${chainId};`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                response.status(204);
                response.json({
                    ok: true,
                });
            }
        });
    });
    // Updates a restaurant's location
    service.patch('/location/:restId', (request, response) => {
        const restId = request.params.restId;
        const newLocation = request.body.newLocation;
        const query = `UPDATE drivethru.restaurant SET drivethru.restaurant.REST_LOCATION = "${newLocation}" WHERE drivethru.restaurant.REST_ID = ${restId};`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                response.status(204);
                response.json({
                    ok: true,
                });
            }
        });
    });
    // Updates a chain's name
    service.patch('/name/:chainId', (request, response) => {
        const chainId = request.params.chainId;
        const newName = request.body.newName;
        const query = `UPDATE drivethru.chain SET drivethru.chain.CHAIN_NAME = "${newName}" WHERE drivethru.chain.CHAIN_ID = ${chainId};`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                response.status(204);
                response.json({
                    ok: true,
                });
            }
        });
    });

    /*
    *
    *             DELETE REQUESTS
    *
    */


    /*
    Delete a measurement
    `DELETE FROM drivethru.measurement WHERE drivethru.measurement.MEAS_ID = ${measId};`;

    Delete an accessibility binding
    `DELETE FROM drivethru.accessibility WHERE drivethru.accessibility.OPTION_ID = ${optionId} AND drivethru.accessibility.REST_ID = ${restId};`;

    Delete an option and all of its uses in accessibility
    `DELETE FROM drivethru.accessibility WHERE drivethru.accessibility.OPTION_ID = ${optionId}; DELETE FROM drivethru.option WHERE drivethru.option.OPTION_ID = ${optionId};`

    Delete a restaurant, all of its measurements, and all of its accessibility bindings
    `DELETE FROM drivethru.measurement WHERE drivethru.measurement.REST_ID = ${restId}; DELETE FROM drivethru.accessibility WHERE drivethru.accessibility.REST_ID = ${restId}; DELETE FROM drivethru.restaurant WHERE drivethru.restaurant.REST_ID = ${restId};`

    Delete a chain, all of its restaurants, all of its restaurants measurements, and all of its restaurants accessibility bindings

    */
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