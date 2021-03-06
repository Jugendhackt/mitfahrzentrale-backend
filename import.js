require('dotenv').config();

const fetch = require('node-fetch');
const databaseManager = require('./src/databaseManager');

/**
 * This file is responsible for exporting all location of the hackerspaces by name
 *
 * @license GPL 3.0
 * @author Jens Hausdorf
 */

/**
 * The directory with all hackerspaces we want to extract.
 */
const DIRECTORY_URL = 'https://spaceapi.fixme.ch/directory.json';


// fetch all hackerspaces from the api
fetch(DIRECTORY_URL).then(res => res.json()).then(async json => {
    let hackspacesCount = 0;

    // connect to database
    let database = databaseManager.getInstance()

    await database.establishConnection();

    // prepare statement
    let sql = 'INSERT IGNORE INTO hackerspaces(name, logo_url, latitude, longitude) VALUES(?, ?, ?, ?);'
    let i = 0;

    for (id in json) {
        fetch(json[id]).then(res => res.json()).then(json => {
            // filter non spec-compliant hackerspaces :|
            if (json.space === void 0 || json.logo === void 0 || json.location.lat === void 0 || json.location.lon === void 0) {
                return;
            }
            return database.queryPromisify(sql, [json.space, json.logo, json.location.lat, json.location.lon]);
        }).catch(() => { /* ignore errors */ })
            .finally(() => {
                if (++i % 5 === 0) {
                    console.log(`${i}…`);
                }

                if (i === hackspacesCount) {
                    console.log('Done.');
                    process.exit(0);
                }
            });
    }
});