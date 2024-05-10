/*---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*
    SOFTWARE USE NOTICE: This software is intended for use by the DEPARTMENT OF VETERANS AFFAIRS: INSURANCE CENTER
*---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const sPHostName = process.env.SP_HOST;
const sPDatabase = process.env.SP_DATABASE;
const sPUserName = process.env.SP_USERNAME;
const sPPassword = process.env.SP_PASSWORD;


async function executeStoredProcedure(StoredProcedure) {
    try {
        const config = {
            user: sPUserName,
            password: sPPassword,
            server: sPHostName,
            database: sPDatabase,
            pool: { // Create Connection Pool
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
        const pool = await sql.connect(config)
        try {
            const result = await pool.request().execute(StoredProcedure);
            const storedResults = result.recordset

            if (storedResults.length < 1) {
                return null
            } else {

                return { storedResults }
            }
        } catch (error) {
            if (error.code === 'ETIMEOUT') {
                console.error('Stored Procedure Execution Timed Out');
                process.exit(1);
            } else {
                console.error('Unable to execute Stored Procedure.', error);
                let stackTrace = error.stack
                throw new Error('Stored Procedure Execution Failed!');
            }
        }
    } catch (error) {
        if (error.code === 'ETIMEOUT') {
            console.error('Stored Procedure Execution Timed Out');
            process.exit(1);
        } else {
            console.error('Error Executing Stored Procedure', error);
            let stackTrace = error.stack
        }
    }
}


module.exports = { executeStoredProcedure }