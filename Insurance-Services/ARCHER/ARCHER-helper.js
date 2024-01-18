
const loadConfig = require('../config/configLoader')
const sql = require('mssql');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');


const configurationLoader = require('../config/configLoader')
const apiProductBaseUrl = configurationLoader.getConfig('ProductAPI').baseUrl;
const apiPolicyBaseUrl = configurationLoader.getConfig('PolicyAPI').baseUrl;
const apiPolicyKey = configurationLoader.getConfig('PolicyAPI').apiKey;
const apiPartyBaseUrl = configurationLoader.getConfig('PartyAPI').baseUrl;
const sqlLoggerEnabled = configurationLoader.loadConfig.sqlLoggerEnabled

const PolicyAPIToken = apiPolicyKey;


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
            process.exit(1);
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

//This will be for SQL logging
async function ARCHERLogPayment(PolicyNumber, ServiceType, SuspenseAmount, PaymentAmount, PriorLoanBalance, NewLoanBalance, PaymentStatus, PaymentDate, CurrPaidToDate, NewPaidToDate) {
    const polNum = PolicyNumber;
    const paymentCode = ServiceType;
    const suspenseAmount = SuspenseAmount;
    const paymentAmount = PaymentAmount;
    const priorLoanBalance = PriorLoanBalance;
    const newLoanBalance = NewLoanBalance;
    const paymentStatus = PaymentStatus;
    const paymentDate = PaymentDate;
    const currPaidToDate = CurrPaidToDate;
    const newPaidToDate = NewPaidToDate


    if (sqlLoggerEnabled === true) {
        if (ServiceType === 1) {
            const insertQuery = `
        INSERT INTO ARCHER_LoanPayments (PolicyNumber, PaymentCode, SuspenseAmount, PriorLoanBalance, NewLoanBalance, PaymentStatus, PaymentDate)
        VALUES (@PolicyNumber, @PaymentCode, @SuspenseAmount, @PriorLoanBalance, @NewLoanBalance, @PaymentStatus, @PaymentDate)`;

            await sql.query(insertQuery, {
                PolicyNumber: polNum,
                PaymentCode: paymentCode,
                SuspenseAmount: suspenseAmount,
                PaymentAmount: paymentAmount,
                PriorLoanBalance: priorLoanBalance,
                NewLoanBalance: newLoanBalance,
                PaymentStatus: paymentStatus,
                PaymentDate: paymentDate,
            });
        } else if (ServiceType === 2) {
            const insertQuery = `
        INSERT INTO ARCHER_PremiumPayments (PolicyNumber, PaymentCode, SuspenseAmount, PaymentAmount, CurrPaidToDate, NewPaidToDate, PaymentStatus, PaymentDate)
        VALUES (@PolicyNumber, @PaymentCode, @SuspenseAmount, @PaymentAmount, @CurrPaidToDate, @NewPaidToDate, @PaymentStatus, @PaymentDate)
    `;
            await sql.query(insertQuery, {
                PolicyNumber: polNum,
                PaymentCode: paymentCode,
                SuspenseAmount: suspenseAmount,
                PaymentAmount: paymentAmount,
                CurrPaidToDate: currPaidToDate,
                NewPaidToDate: newPaidToDate,
                PaymentStatus: paymentStatus,
                PaymentDate: paymentDate,
            });
        }

    } else if (sqlLoggerEnabled === false) {
        //This will be used for File Driven logging.
    } else {
        console.error('Service Type not provided.')
        return;
    }
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
                'Authorization': `Bearer ${PolicyAPIToken}`
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
        //Updates made 2024-01-17 - @Drew-Schnabel
        //Utilized Documentation ProcessPayments(V3) EXL LifePRO Swagger
        "ApplySuspenseFrom": "U",
        "CompanyCode": "01",
        "LoanConfirm": true,
        "LoanPaymentDate": PAYMENT_DATE,
        "LoanRepay": AMOUNT,
        "PolicyNumber": POLICY_NUMBER,
        "UpdatePaidToDate": false,
    };
    const loanAPI = apiPolicyBaseUrl + processLoanPaymentEndPoint

    async function ARCHERSendProcessLoanPayment(requestBody) {

        const requestOptions = {
            method: 'POST',
            headers: {
                'CoderID': 'API1',
                'UserType': 'API1',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PolicyAPIToken}`
            },
            body: JSON.stringify(requestBody)
        };
        try {

            const response = await fetch(loanAPI, requestOptions)
            const responseData = await response.json();
            const responseCode = response.status;

            return { responseData, responseCode }

        } catch (error) {
            console.error('Error sending data to EXL LifePRO Premium REST API: ', error)
            throw error;
        }
    }

    //Loan Logic - @Drew-Schnabel
    const validateLoan = await ARCHERValidatePayment(POLICY_NUMBER, 1);
    const loanAccrual = validateLoan.AllLoans.AccrualDate;
    const currentDate = new Date()
    const formatDate = formatDateToyyyyMMdd(currentDate);
    if (loanAccrual > currentDate) {
        throw new Error('Loan Accrual Date in Advance of Current Date. Failed Business Rule!')
    } else if (PAYMENT_DATE < loanAccrual) {
        throw new Error('Payment Date in arrears to current loan accrual date. Failed Business Rule!');
    } else if (!validateLoan) {
        throw new Error('Loan Validation failed. Failed Business Rule!');
    } else {
        const { responseData, responseCode } = await ARCHERSendProcessLoanPayment(requestBody);
        //Return response data and response code back to main framework.
        return { responseData, responseCode }
    }
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
                            'Authorization': `Bearer ${PolicyAPIToken}`
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
                            'Authorization': `Bearer ${PolicyAPIToken}`
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
function readSqlFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}
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


async function ARCHERDataRequest (SQLFilePath, ServiceType) {

        const SqlUser = configurationLoader.getConfig('sqlServerConfig').user;
        const SqlPassword = configurationLoader.getConfig('sqlServerConfig').password;
        const sqlHost = configurationLoader.getConfig('sqlServerConfig').host;


    const sqlConfig = {
        user: SqlUser,
        password: SqlPassword,
        server: `${sqlHost}`, 
        database: 'ARCHER',
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    }

        async function executeQuery(SQLFilePath, ServiceType) {
            try{
                await sql.connect(sqlConfig);
                const readFileData = await readSqlFile(SQLFilePath)
                const result = await sql.query(readFileData);
                
                // Processing each row in the result
                result.recordset.forEach(async row => {

                  //In this section we also want to create a function to log the results, there should either be two functions to save to specific
                  //tables or the function should be dynamic with If/Else logic with saving data for the loan or premium services.
                    if (ServiceType === 1) {
                        await ARCHERProcessLoanPayment()
                        await ARCHERValidatePayment(row.POLICY_NUMBER, ServiceType);  
                        return;
                    } else if (ServiceType === 2) {
                        await ARCHERProcessPremiumPayment(row.POLICY_NUMBER, row.AMOUNT, row.TAX_YEAR, row.PAID_TO_DATE)
                        await ARCHERValidatePayment(row.POLICY_NUMBER, ServiceType)
                        return;
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

    executeQuery(SQLFilePath, ServiceType);

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

function readJSONFileDirectory(directory) {
    return new Promise((resolve, reject) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(files.filter(file => file.endsWith('.json')));
        });
    });
}

async function runAllQueriesInFolder(queryFolderPath, ServiceType) {
    try {
        const files = await readSqlFileDirectory(queryFolderPath);
        let allResults = [];
        for (const file of files) {
            const filePath = path.join(queryFolderPath, file);
            try {
                const results = await ARCHERDataRequest(filePath, ServiceType);
                allResults.push({ file, results }); // Add results to the array
                console.log(`Results for ${file}:`, results);
            } catch (err) {
                console.error(`Error processing file ${file}:`, err);
            } 
        }

        return allResults; // Return aggregated results after processing all files
    } catch (err) {
        console.error('Error reading SQL file directory:', err);
    }
}

const config = require('../config/configLoader')
async function readFolderResults(folderPath, ServiceType) {
    try {
        if (config.sqlReadEnabled === true) {
            const files = await readSqlFileDirectory(folderPath);
            let allResults = [];
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const results = await fs.readFile(filePath);
                allResults.push({ file, results });
                console.log('File Concate/Read completed.')
            }
        } else if (config.sqlReadEnabled === false) {
            const files = await readJSONFileDirectory(folderPath);
            let allResults = [];
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const results = await fs.readFile(filePath, 'utf-8');
                allResults.push({ file, results });
                console.log('File Concate/Read completed.')
            }
        } else {
            console.error('Invalid/Miss Matched Configuration. Please review configuration file.')
        }
        return allResults; //Return aggregated results after processing all files in folder

        } catch (err) {
            console.error('Error Reading file directory: ', err);
            }
}


async function moveFilesToCompletedFolder(sourceDir, destDir) {
    try {
        const files = await fs.promises.readdir(sourceDir);

        for (const file of files) {
            const oldPath = path.join(sourceDir, file);
            const newPath = path.join(destDir, file);
            await fs.promises.rename(oldPath, newPath);
            console.log(`Successfully moved file: ${file}`);
        }
        console.log('All files moved successfully.');
    } catch (err) {
        console.error('Error moving files:', err);
    }
}


function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return date.toLocaleDateString('en-US', options).replace(/\//g, '-').replace(',', '').replace(/:/g, '-').replace(' ', ' ');
}

async function appendDateTimeToFiles(directory) {
    try {
        const files = await fs.promises.readdir(directory);

        for (const file of files) {
            const oldPath = path.join(directory, file);
            const dateTimeString = formatDate(new Date());
            const fileExtension = path.extname(file);
            const fileNameWithoutExtension = path.basename(file, fileExtension);
            const newPath = path.join(directory, `${fileNameWithoutExtension}-Processed ${dateTimeString}${fileExtension}`);

            await fs.promises.rename(oldPath, newPath);
            console.log(`Renamed file: ${file} to ${path.basename(newPath)}`);
        }
    } catch (err) {
        console.error('Error renaming files:', err);
    }
}


module.exports = { appendDateTimeToFiles , moveFilesToCompletedFolder , readFolderResults , systemCheck, generateGuid, ARCHERProcessPremiumPayment , ARCHERProcessLoanPayment , ARCHERValidatePayment , readSqlFile , runAllQueriesInFolder };

