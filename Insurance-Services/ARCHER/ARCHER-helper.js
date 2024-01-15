
const loadConfig = require('../config/configLoader')
const sql = require('mssql');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');


const configurationLoader = require('../LIPAS_webServices/config/configLoader')
const apiProductBaseUrl = configurationLoader.getConfig('ProductAPI').baseUrl;
const apiPolicyBaseUrl = configurationLoader.getConfig('PolicyAPI').baseUrl;
const apiPartyBaseUrl  = configurationLoader.getConfig('PartyAPI').baseUrl;

const apiToken = apiPolicyKey;


//System Check Functionality
async function checkApiStatus(apiName, apiUrl) {
    try {
        const response = await fetch(apiUrl);

        if(response.ok) {
            console.log(`${apiName} is online. Status Code: ${response.status}`);
            return `\x1b[32mOnline\x1b[0m`;
        } else {
            console.error(`${apiName} is offline or unresponsive. Status Code: ${response.status}`)
            return `\x1b[31mOffline\x1b[0m`;
        }
    } catch(error) {
        console.error(`Error checking ${apiName} status,`, error.message);
        return `\x1b[31mOffline\x1b[0m`;
    }
};
async function systemCheck() {
    const definitions = [
        { name: 'PartyAPI' , url: apiPartyBaseUrl },
        { name: 'PolicyAPI', url: apiPolicyBaseUrl },
        { name: 'ProductAPI', url: apiProductBaseUrl }
    ]
    console.log('Starting API uptime check....')
    let isSystemOnline = true;
    
    for (const { name, url } of definitions) {
        const apiStatus = await checkApiStatus(name, url);
        isSystemOnline = isSystemOnline && apiStatus;
    }
    console.log('System Check Complete.')
    console.clear();
    return isSystemOnline;
};


function parseDateString(dateString) {
    if (dateString.length !== 8) {
        console.error('Invalid date format:', dateString);
        return null;
    }
    const year = parseInt(dateString.substring(0, 4), 10);
    const month = parseInt(dateString.substring(4, 6), 10) - 1; // Month is 0-indexed
    const day = parseInt(dateString.substring(6, 8), 10);
    return new Date(year, month, day);
}

const unformatDate = (formattedDate) => {
        const dateString = String(formattedDate);
            if( dateString.length !== 8) {
                console.error('Invalid API Date format', dateString);
                return null
            }
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            return `${month}-${day}-${year}`;
    };

function formatDateToyyyyMMdd(date) {
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);

    return `${year}${month}${day}`;
    }

function formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
}

//Random GUID Generator - This will be needed for other web service calls to LIPAS.
function generateGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return (
        s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4()
    );
}

async function ARCHERProcessPremiumPayment(POLICY_NUMBER, AMOUNT, TAX_YEAR, PAYMENT_DATE) {

    const randomGuid = generateGuid();

    const processPremiumPaymentEndPoint = `/v3/Policy/${randomGuid}/ProcessPayments`;

    const requestBody = {
        "ApplySuspenseFrom": "U",
        "CompanyCode": "01",
        "PolicyNumber": POLICY_NUMBER,
        "PremiumDetails": [
          {
            "Amount": AMOUNT,
            "CommissionType": "N",
            "Confirm": false,
            "Load": "N",
            "OriginalCode": "S",
            "PayCommission": "Y",
            "PremiumTax": "N",
            "TaxYear": TAX_YEAR,
            "TranCode": 110
          }
        ],
        "PremiumPaymentDate": PAYMENT_DATE,
        "UpdatePaidToDate": true,
        "WaiveApplicationFee": true,
};
    const premiumAPI = apiPolicyBaseUrl+processPremiumPaymentEndPoint

    async function ARCHERSendProcessPremiumPayment(requestBody){
    
        const requestOptions = {
            method: 'POST',
            headers: {
                'CoderID': 'API1',
                'UserType': 'API1',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            },
            body: JSON.stringify(requestBody)
        };
            try {

                const response = await fetch(premiumAPI,requestOptions)
                const responseData = await response.json();
                const responseCode = response.status;

                return { responseData, responseCode }

            } catch (error) {
                console.error('Error sending data to EXL LifePRO Premium REST API: ', error)
                throw error;
            }
        }

        const { responseData, responseCode } = await ARCHERSendProcessPremiumPayment(requestBody);
        //Return response data and response code back to main framework.
        return { responseData, responseCode }
}

async function ARCHERProcessLoanPayment(POLICY_NUMBER, AMOUNT, TAX_YEAR, PAYMENT_DATE) {

    const randomGuid = generateGuid();

    const processLoanPaymentEndPoint = `/v3/Policy/${randomGuid}/ProcessPayments`;

    const requestBody = {
        //Need to make adjustments in here when I have payload information
        //@Drew-Schnabel
        //Make these changes on tuesday if Node.Js is avaialble.
        "ApplySuspenseFrom": "U",
        "CompanyCode": "01",
        "PolicyNumber": POLICY_NUMBER,
        "PremiumDetails": [
          {
            "Amount": AMOUNT,
            "CommissionType": "N",
            "Confirm": false,
            "Load": "N",
            "OriginalCode": "S",
            "PayCommission": "Y",
            "PremiumTax": "N",
            "TaxYear": TAX_YEAR,
            "TranCode": 110
          }
        ],
        "PremiumPaymentDate": PAYMENT_DATE,
        "UpdatePaidToDate": false,
        "WaiveApplicationFee": true,
};
    const loanAPI = apiPolicyBaseUrl+processLoanPaymentEndPoint

    async function ARCHERSendProcessLoanPayment(requestBody){
    
        const requestOptions = {
            method: 'POST',
            headers: {
                'CoderID': 'API1',
                'UserType': 'API1',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`
            },
            body: JSON.stringify(requestBody)
        };
            try {

                const response = await fetch(loanAPI,requestOptions)
                const responseData = await response.json();
                const responseCode = response.status;

                return { responseData, responseCode }

            } catch (error) {
                console.error('Error sending data to EXL LifePRO Premium REST API: ', error)
                throw error;
            }
        }

        const { responseData, responseCode } = await ARCHERSendProcessLoanPayment(requestBody);
        //Return response data and response code back to main framework.
        return { responseData, responseCode }
}


async function ARCHERValidatePayment(POLICY_NUMBER, ServiceType) {
    const GUID = generateGuid();
    const CompanyCode = '01'
    const PolicyNumber = POLICY_NUMBER
    
    if( ServiceType === 1 ){
            //Service to Return loan related inforamtion when the ServiceType is Loan
                const GetAllLoanListEndPoint = `/LPRestPolicyAPI/v1/Loan/${GUID}/${CompanyCode}/${PolicyNumber}/GetAllLoanList`
                const GetAllLoanListAPI = apiPolicyBaseUrl+GetAllLoanListEndPoint
                const requestOptions = {
                    method: 'GET',
                        headers: {
                            'CoderId': 'DAD1',
                            'UserType': 'DAD1',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiToken}`
                        }
                }
                try {
                    const getResponse = await fetch(GetAllLoanListAPI, requestOptions);
                    const getResponseData = await getResponse.json(); 
                    const getResponseReturnCode = getResponseData.ReturnCode; 
                    if (getResponseReturnCode === 0) {
                        const activeLoan = getActiveLoan(getResponseData)
                        return activeLoan
                    } else {
                        console.error('Error sending data request to GetAllLoanList API.');
                    }
                } catch (error) {
                    console.error('Error sending data to API:', error);
                    throw error;
                } 
    }else if( ServiceType === 2 ) {
            //Service to Return policy related inforamtion when the ServiceType is Premium
                const getPolicyEndpoint = `Endpoint: /LPRestPolicyAPI/v4/Policy/${GUID}/${CompanyCode}/${PolicyNumber}/GetPolicy`
                const GetPolicyAPI = apiPolicyBaseUrl+getPolicyEndpoint
                const requestOptions = {
                    method: 'GET',
                        headers: {
                            'CoderId': 'DAD1',
                            'UserType': 'DAD1',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiToken}`
                        }
                }
                try {
                    const getPolicyResponse = await fetch(GetPolicyAPI, requestOptions);
                    const getPolicyResponseData = await getPolicyResponse.json();
                    const getPolicyReturnCode = getPolicyResponseData.ReturnCode;

                    if(getPolicyReturnCode === 0){
                        const Paid_to_date = getPolicyResponseData.GetPolicyResp.Paid_To_Date;
                        const PolicyNumber = getPolicyResponseData.GetPolicyResp.PolicyNumber;
                        const ProductCode = getPolicyResponseData.GetPolicyResp.Product_Code;
                        return { Paid_to_date , PolicyNumber , ProductCode };
                    } else {
                        console.error('Error sending data to GETPOLICY API.')
                    }
                } catch(error){
                    console.error('Error sending data to GETPOLICY API: ', error);
                    throw error;
                }
    }
    //Inner-Support Function to Get the Active Loan List out of all Objects/Array.
    function getActiveLoan(AllLoanList){
        return AllLoanList.find(loan => loan.StatusCode === "A")
    }

}


//Read SQL Server File in ARCHER/SqlQueries Folder
async function readSqlFile(SQLFilePath) {

    return new Promise((resolve, reject)=>{
        fs.readFile(SQLFilePath, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
/*
    Example SQL Usage:
    const filePath = path.join(__dirname, 'query.sql');

    readSqlFile(filePath)
        .then(sqlQuery => {
            console.log(sqlQuery); // Log the SQL query
            // Further logic to execute this query
        })
        .catch(err => {
            console.error(err);
        });


*/

}

async function ARCHERDataRequest (SQLFilePath, ServiceType) {

        const SqlUser = configurationLoader.getConfig('sqlServerConfig').user;
        const SqlPassword = configurationLoader.getConfig('sqlServerConfig').password;
        const sqlHost = configurationLoader.getConfig('sqlServerConfig').host;


    const sqlConfig = {
        user: SqlUser,
        password: SqlPassword,
        server: sqlHost, 
        database: 'LIFEPRO'
    }

        async function executeQuery(SQLFilePath, ServiceType) {
            try{
                await sql.connect(sqlConfig);
                const readFileData = await readSqlFile(SQLFilePath)
                const result = await sql.query`${readFileData}`;
                
                // Processing each row in the result
                result.recordset.forEach(row => {


                    //In this section we also want to create a function to log the results, there should either be two functions to save to specific
                    //tables or the function should be dynamic with If/Else logic with saving data for the loan or premium services.
                    if(ServiceType === 1){
                        //insert loan services here
                    } else if(ServiceType === 2){
                        //insert premium services here
                    } else {
                        console.error('ServiceType was not provided.')
                    }

                console.log(row); // Each row is a JSON object
                // Additional processing here
                });
            } catch(err){
                    console.error('Unable to Establish SQL Connection: ', err);
            }
        }    

        executeQuery();

    }

    //Reads Directory - Returns all Files presently in the folder.
    function readSqlFileDirectory(directory) {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(files.filter(file => file.endsWith('.sql')));
            });
        });
    }

    async function runAllQueriesInFolder(queryFolderPath , ServiceType) {
        try {
            const files = await readSqlFileDirectory(queryFolderPath);
    
            for (const file of files) {
                const filePath = path.join(queryFolderPath, file);
                const sqlQuery = await readSqlFile(filePath);
                const results = await ARCHERDataRequest(sqlQuery, ServiceType);
                console.log(`Results for ${file}:`, results);
                // Additional processing here
            }
    
        } catch (err) {
            console.error(err);
        }
    }




//Still Need Loan Logic, we need to use the GetAllLoanList service to find the current Loan Accrual date. The Accrual Date CANNOT be in advance
//of the current date. Will need to use GETDATE() then convert GETDATE to YYYYmmDD format We should be able to do a simple 
//const currentDate = formatDateToyyyyMMdd(getDate());
//Loan Accrual Date (YYYYmmDD) <= currentDate







module.exports = { systemCheck, generateGuid, ARCHERProcessPremiumPayment , ARCHERProcessLoanPayment , ARCHERValidatePayment , readSqlFile , runAllQueriesInFolder };

