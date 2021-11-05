/*
* -------------------------------------------------------
*
*                       IMPORTS
*
* -------------------------------------------------------
*/

// Import needed libraries as constants
const { response } = require('express');
const express = require('express');
const fs = require('fs');
const path = require('path');
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
// Function that removes characters that allow a SQL Injection attack to be performed
function filterText(text) {
    return text.replace(/[^a-zA-Z0-9()-:]/g, "");
}
// Function that performs a request and responds with a silent success but will provide an error message upon failure
function respondSilently(query, response) {
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
                results: 'Success'
            });
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

//Variable to hold the service
let service = null;
// Function to set up the service
function setupService() {
    // Initialize the express service
    service = express();
    // Tell the service to use JSON request and response formats
    service.use(express.json());
    // Tell the servie to allow Cross-Origin resource sharing
    service.use((request, response, next) => {
        response.set('Access-Control-Allow-Origin', '*');
        next();
    });
    // Get the ERD
    service.use('/pdf', express.static(__dirname));
    // Allow the options endpoint to work
    service.options('*', (request, response) => {
        response.set('Access-Control-Allow-Headers', 'Content-Type');
        response.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE');
        response.sendStatus(200);
      });

    /*
    *
    *             CREATE REQUESTS
    *
    */

    // Inserts a new chain into the chains table
    service.post('/chain', (request, response) => {
        const chainName = filterText(request.body.name);
        const chainPhone = filterText(request.body.phone);
        const query = `INSERT INTO drivethru.chain (drivethru.chain.CHAIN_NAME, drivethru.chain.CHAIN_PHONE) VALUES ("${chainName}", "${chainPhone}");`;
        respondSilently(query, response);
    });
    // Inserts a new restaurant into the restaurants table
    service.post('/restaurant', (request, response) => {
        const restLocation = filterText(request.body.location);
        const chainId = request.body.chainId;
        const query = `INSERT INTO drivethru.restaurant (drivethru.restaurant.REST_LOCATION, drivethru.restaurant.CHAIN_ID) VALUES ("${restLocation}", ${chainId});`;
        respondSilently(query, response);
    });
    // Inserts a new measurement into the measurements table
    service.post('/measurement', (request, response) => {
        const restId = request.body.restId;
        const yearIn = request.body.yearIn;
        const monthIn = request.body.monthIn;
        const dayIn = request.body.dayIn;
        const timeIn = filterText(request.body.timeIn);
        const yearOut = request.body.yearOut;
        const monthOut = request.body.monthOut;
        const dayOut = request.body.dayOut;
        const timeOut = filterText(request.body.timeOut);
        const driveThrough = request.body.driveThrough;
        const measIn = `${yearIn}-${monthIn}-${dayIn}T${timeIn}`;
        const measOut = `${yearOut}-${monthOut}-${dayOut}T${timeOut}`;
        const query = `INSERT INTO drivethru.measurement (drivethru.measurement.REST_ID, drivethru.measurement.MEAS_TIME_IN, drivethru.measurement.MEAS_TIME_OUT, drivethru.measurement.MEAS_DRIVETHROUGH) VALUES ("${restId}", "${measIn}", "${measOut}", "${driveThrough}");`;
        respondSilently(query, response);
    });
    // Inserts an option into the options table
    service.post('/option', (request, response) => {
        const optionName = filterText(request.body.name);
        const query = `INSERT INTO drivethru.option (drivethru.option.OPTION_NAME) VALUES ("${optionName}");`;
        respondSilently(query, response);
    });
    // Inserts an accessibility binding into the accessibiltiy table
    service.post('/accessibility', (request, response) => {
        const optionId = request.body.optionId;
        const restId = request.body.restId;
        const query = `INSERT INTO drivethru.accessibility (drivethru.accessibility.OPTION_ID, drivethru.accessibility.REST_ID) VALUES ("${optionId}", "${restId}");`;
        respondSilently(query, response);
    });

    /*
    *
    *             READ REQUESTS
    *
    */
    // Get a chain
    service.get('/chain/:chainId', (request, response) => {
        const chainId = request.params.chainId;
        const query = `SELECT * from drivethru.chain WHERE drivethru.chain.CHAIN_ID = ${chainId}`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                let chain = `{ "chainId":${chainId}, "chainName":"${json[0].CHAIN_NAME}", "chainPhone":"${json[0].CHAIN_PHONE}"}`;
                response.json({
                    ok: true,
                    results: JSON.parse(chain),
                });
            }
        });
    });
    // Get a restaurant
    service.get('/restaurant/:restId', (request, response) => {
        const restId = request.params.restId;
        const query = `SELECT * FROM drivethru.restaurant WHERE drivethru.restaurant.REST_ID = ${restId}`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                const rest = `{"restId": ${json[0].REST_ID}, "chainId": ${json[0].CHAIN_ID}, "restLocation": "${json[0].REST_LOCATION}"}`;
                response.json({
                    ok: true,
                    results: JSON.parse(rest),
                });
            }
        });
    });
    // Get a Measurement
    service.get('/measurement/:measId', (request, response) => {
        const measId = request.params.measId;
        const query = `SELECT * FROM drivethru.measurement WHERE drivethru.measurement.MEAS_ID = ${measId}`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                console.log(json)
                const meas = `{"measId": ${json[0].MEAS_ID}, "restId": ${json[0].REST_ID}, "timeIn": "${json[0].MEAS_TIME_IN}", "timeOut": "${json[0].MEAS_TIME_OUT}", "driveThrough": ${json[0].MEAS_DRIVETHROUGH}}`;
                response.json({
                    ok: true,
                    results: JSON.parse(meas),
                });
            }
        });
    });
    // Get an option
    service.get('/option/:optionId', (request, response) => {
        const optionId = request.params.optionId;
        const query = `SELECT * FROM drivethru.option WHERE drivethru.option.OPTION_ID = ${optionId}`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                const options = `{"optionId":${optionId}, "optionName":"${json[0].OPTION_NAME}"}`;
                response.json({
                    ok: true,
                    results: JSON.parse(options),
                });
            }
        });
    });
    // Get an accessibility binding
    service.get('/accessibility/:restId/:optionId', (request, response) => {
        const restId = request.params.restId;
        const optionId = request.params.optionId;
        const query = `SELECT * FROM drivethru.accessibility WHERE drivethru.accessibility.REST_ID = ${restId} AND drivethru.accessibility.OPTION_ID = ${optionId}`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                let accessibility = `{"restId": ${json[0].REST_ID}, "optionId": ${json[0].OPTION_ID}}`;
                response.json({
                    ok: true,
                    results: JSON.parse(accessibility),
                });
            }
        });
    });
    // Get all chains and their contact info
    service.get('/chainNames', (request, response) => {
        const query = 'SELECT drivethru.chain.CHAIN_NAME FROM drivethru.chain;';
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                let chains = '{ "names": [';
                for (let i = 0; i < json.length; i++) {
                    chains += '"' + json[i].CHAIN_NAME + '", ';
                }
                chains = chains.substring(0, chains.length - 2);
                chains += '] }';
                response.json({
                    ok: true,
                    results: JSON.parse(chains),
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
                const json = JSON.parse(JSON.stringify(rows));
                let contacts = '{ ';
                for (let i = 0; i < json.length; i++) {
                    contacts += '"' + json[i].CHAIN_NAME + '":"' + json[i].CHAIN_PHONE + '", '
                }
                contacts = contacts.substring(0, contacts.length - 2);
                contacts += '}';
                response.json({
                    ok: true,
                    results: JSON.parse(contacts),
                });
            }
        });
    });
    // Get a specific chain's contact info
    service.get('/phoneNumber/:chainName', (request, response) => {
        const chainName = filterText(request.params.chainName);
        console.log(chainName);
        const query = `SELECT drivethru.chain.CHAIN_PHONE FROM drivethru.chain WHERE drivethru.chain.CHAIN_NAME = "${chainName}"`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                const contact = `{ "${chainName}":"${json[0].CHAIN_PHONE}" }`; 
                response.json({ 
                    ok: true,
                    results: JSON.parse(contact),
                });
            }
        });
    });
    // Get all restaurants that have a drivethrough or not
    service.get('/restaurantLocations/:drivethrough', (request, response) => {
        const driveThrough = request.params.drivethrough == 0 ? 0 : 1;
        const query = `SELECT DISTINCT drivethru.restaurant.REST_LOCATION FROM drivethru.restaurant JOIN drivethru.measurement ON drivethru.restaurant.REST_ID = drivethru.measurement.REST_ID WHERE drivethru.measurement.MEAS_DRIVETHROUGH = ${driveThrough};`;
        connection.query(query, (error, rows) => {
            if (error) {
                response.status(500);
                response.json({
                    ok: false,
                    results: error.message,
                });
            } else {
                const json = JSON.parse(JSON.stringify(rows));
                let locations = '{ "locations": ['
                for (let i = 0; i < json.length; i++) {
                    locations += `"${json[i].REST_LOCATION}", `
                }
                locations = locations.substring(0, locations.length - 2);
                locations += ']}';
                response.json({
                    ok: true,
                    results: JSON.parse(locations),
                });
            }
        });
    });
    // Get the report.html page
    service.get('/report.html', (request, response) => {
        response.sendFile(path.join(__dirname, 'report.html'));
    });
    // Dump the chains table

    // Dump the restaurants table

    // Dump the Measurements table

    // Dump the Options table

    // Dump the accessibiltiy table

    /*
    *
    *             UPDATE REQUESTS
    *
    */

    // Updates a chain
    service.patch('/chain/:chainId', (request, response) => {
        const chainId = request.params.chainId;
        const chainName = filterText(request.body.name);
        const chainPhone = filterText(request.body.phone);
        const query = `UPDATE drivethru.chain SET drivethru.chain.CHAIN_NAME = 
    "${chainName}", drivethru.CHAIN_PHONE = "${chainPhone}" WHERE 
    drivethru.chain.CHAIN_ID = ${chainId}`;
        respondSilently(query, response);
    });
    // Updates a restaurant
    service.patch('/restaurant/:restId', (request, response) => {
        const restId = request.params.restId;
        const restLocation = filterText(request.body.location);
        const chainId = request.body.chainId;
        const query = `UPDATE drivethru.restaurant SET drivethru.restaurant.REST_LOCATION = 
    "${restLocation}", drivethru.restaurant.CHAIN_ID = ${chainId} WHERE 
    drivethru.restaurant.REST_ID = ${restId}`;
        respondSilently(query, response);
    });
    // Updates an option
    service.patch('/option/:optionId', (request, response) => {
        const optionId = request.params.optionId;
        const optionName = filterText(request.body.name);
        const query = `UPDATE drivethru.option SET drivethru.option.OPTION_NAME = 
    "${optionName}" WHERE drivethru.option.OPTION_ID = ${optionId}`;
        respondSilently(query, response);
    });
    // Updates a measurement
    service.patch('/measurement/:measId', (request, response) => {
        const measId = request.params.measId;
        const restId = request.body.restId;
        const yearIn = request.body.yearIn;
        const monthIn = request.body.monthIn;
        const dayIn = request.body.dayIn;
        const timeIn = filterText(request.body.timeIn);
        const yearOut = request.body.yearOut;
        const monthOut = request.body.monthOut;
        const dayOut = request.body.dayOut;
        const timeOut = filterText(request.body.timeOut);
        const driveThrough = request.body.driveThrough;
        const measIn = `${yearIn}-${monthIn}-${dayIn}T${timeIn}`;
        const measOut = `${yearOut}-${monthOut}-${dayOut}T${timeOut}`;
        const query = `UPDATE drivethru.measurement SET drivethru.measurement.REST_ID = 
    ${restId}, drivethru.measurement.MEAS_TIME_IN = "${measIn}", 
    drivethru.measurement.MEAS_TIME_OUT = "${measOut}", drivethru.measurement.MEAS_DRIVETHROUGH = 
    ${driveThrough} WHERE drivethru.measurement.MEAS_ID = ${measId};`;
        respondSilently(query, response);
    });
    // Updates a chain's phone number
    service.patch('/chain/phoneNumber/:chainId', (request, response) => {
        const chainId = request.params.chainId;;
        const newPhoneNumber = filterText(request.body.phone);
        const query = `UPDATE drivethru.chain SET drivethru.chain.CHAIN_PHONE = 
        "${newPhoneNumber}" WHERE drivethru.chain.CHAIN_ID = ${chainId};`;
        respondSilently(query, response);
    });
    // Updates a restaurant's location
    service.patch('/restaurant/location/:restId', (request, response) => {
        const restId = request.params.restId;
        const newLocation = filterText(request.body.location);
        const query = `UPDATE drivethru.restaurant SET drivethru.restaurant.REST_LOCATION = 
        "${newLocation}" WHERE drivethru.restaurant.REST_ID = ${restId};`;
        respondSilently(query, response);
    });
    // Updates a chain's name
    service.patch('/chain/name/:chainId', (request, response) => {
        const chainId = request.params.chainId;
        const newName = filterText(request.body.name);
        const query = `UPDATE drivethru.chain SET drivethru.chain.CHAIN_NAME = 
        "${newName}" WHERE drivethru.chain.CHAIN_ID = ${chainId};`;
        respondSilently(query, response);
    });

    /*
    *
    *             DELETE REQUESTS
    *
    */

    // Delete a measurement
    service.delete('/measurement', (request, response) => {
        const measId = request.body.id;
        const query = `DELETE FROM drivethru.measurement WHERE drivethru.measurement.MEAS_ID = ${measId};`;
        respondSilently(query, response);
    });
    // Delete an accessibility binding
    service.delete('/accessibility', (request, response) => {
        const restId = request.body.restId;
        const optionId = request.body.optionId;
        const query = `DELETE FROM drivethru.accessibility WHERE  drivethru.accessibility.REST_ID = 
        ${restId} AND drivethru.accessibility.OPTION_ID = ${optionId};`;
        respondSilently(query, response);
    });
    // Delete and option and all ot it's accessibility bindings
    service.delete('/option', (request, response) => {
        const optionId = request.body.id;
        const query = `DELETE FROM drivethru.accessibility WHERE drivethru.accessibility.OPTION_ID = 
        ${optionId}; DELETE FROM drivethru.option WHERE drivethru.option.OPTION_ID = ${optionId};`
        respondSilently(query, response);
    });
    // Delete a restaurant, all of it's measurements, and all of its accessibility bindings
    service.delete('/restaurant', (request, response) => {
        const restId = request.body.id;
        const query = `DELETE FROM drivethru.measurement WHERE drivethru.measurement.REST_ID = 
        ${restId}; DELETE FROM drivethru.accessibility WHERE drivethru.accessibility.REST_ID = 
        ${restId}; DELETE FROM drivethru.restaurant WHERE drivethru.restaurant.REST_ID = ${restId};`
        respondSilently(query, response);
    });
    // Delete a chain, all of it's restaurants, all of it's restaurant's measurements, and all of it's restaurant's accessibility bindings
    service.delete('/chain', (request, response) => {
        const chainId = request.body.id;
        const query = `DELETE drivethru.measurement FROM drivethru.measurement JOIN 
        drivethru.restaurant ON drivethru.measurement.REST_ID = drivethru.restaurant.REST_ID 
        JOIN drivethru.chain ON drivethru.chain.CHAIN_ID = drivethru.restaurant.CHAIN_ID WHERE 
        drivethru.restaurant.CHAIN_ID = ${chainId}; DELETE drivethru.accessibility FROM 
        drivethru.accessibility JOIN drivethru.restaurant ON drivethru.accessibility.REST_ID = 
        drivethru.restaurant.REST_ID JOIN drivethru.chain ON drivethru.chain.CHAIN_ID = 
        drivethru.restaurant.CHAIN_ID WHERE drivethru.restaurant.CHAIN_ID = 
        ${chainId}; DELETE drivethru.restaurant FROM drivethru.restaurant WHERE 
        drivethru.restaurant.CHAIN_ID = ${chainId};`;
        respondSilently(query, response);
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
    setupService();
    // Start the web service
    const port = 8443;
    service.listen(port, () => {
        console.log("The drivethru webservice is live.");
    });
})();