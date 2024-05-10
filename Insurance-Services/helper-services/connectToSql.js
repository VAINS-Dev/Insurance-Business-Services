/*---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*
    SOFTWARE USE NOTICE: This software is intended for use by the DEPARTMENT OF VETERANS AFFAIRS: INSURANCE CENTER
*---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') })


const sqlHostName = process.env.DB_HOST;
const sqlDatabase = process.env.DB_DATABASE;
const sqlUserName = process.env.DB_USERNAME;
const sqlPassword = process.env.DB_PASSWORD;

async function connectToSql() {
    const config = {
        driver: 'msnodesqlv8',
        server: sqlHostName,
        database: sqlDatabase,
        user: sqlUserName,
        password: sqlPassword,
        pool: { // Creates SQL Connection pool
            max: 3,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options: {
            trustedConnection: true,
            encrypt: true, // keep sql encryption on
            integratedSecurity: false,
            trustServerCertificate: true,
            requestTimeout: 50000
        }
    }

    try {
        await sql.connect(config);
        console.log(`Connection to SQL Server: ${sqlHostName} was established successfully!`)
        console.warn('Connection Gripped...')
        return true
    } catch (err) {
        console.error(`Connection to SQL Server: ${sqlHostName} could not be established!`)
        console.error(err.message)
        console.log(config);
        console.log(err)
        return false
    }
}

module.exports = { connectToSql }


