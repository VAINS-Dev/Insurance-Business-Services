

const loadConfig = require('../config/configLoader')

const host = loadConfig.getConfig('sqlServerConfig').host
const user = loadConfig.getConfig('sqlServerConfig').user
const password = loadConfig.getConfig('sqlServerConfig').password



const sql = require('mssql');
const config = {
    user: 'VBAINS',
    password: '1217',
    server: 'localhost',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};


async function executeQuery() {
    try {
        // Establish a connection to the database
        await sql.connect(config);

        // Execute a simple query (e.g., selecting the top 10 rows from a table)
        const result = await sql.query`SELECT TOP 10 * FROM [IdentityManagement].[dbo].[master]`;

        console.dir(result);

        // Process the result as needed
        // For example, you can iterate through the rows
        result.recordset.forEach(row => {
            console.log(row);
        });
    } catch (err) {
        // Error handling
        console.error('SQL Connection or Query Error: ', err);
    } finally {
        // Close the connection
        await sql.close();
    }
}


executeQuery();