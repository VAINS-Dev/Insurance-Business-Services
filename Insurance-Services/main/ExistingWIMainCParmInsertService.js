const { executeStoredProcedure } = require("../helper-services/executeStoredProcedure");
const path = require('path');
const { asyncCallCriticalDateServiceInternal } = require("../helper-services/callCriticalServiceInternal");
const { insertPRMPDetail } = require("../helper-services/lipas-helper-api/insertCparm_LIPAS");
const { connectToSql } = require("../helper-services/connectToSql");
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const sql = require('mssql');

const StoredProc = process.env.getActiveAutoSurrWorkItems;
const cparmID = process.env.CriticalDateCParm

async function main() {
    try{
        const sql = await connectToSql();
        if(!sql){
            console.log('Connection to Sql Server failed');
            process.exit(1)
        }
    }catch(error){
        console.error('There was an error establsihing a connection to the sql server');
        console.error('Stack: ', error);
    }

    let obtainRecords
    try {
        obtainRecords = await asyncfetchRecordsFromWorkflowTable(); //Main process to obtain stored proc results....
        if (!obtainRecords) {
            console.error('There was an error obtaining the records from the workflow table.');
        }
    } catch (error) {
        console.error('There was an error obtaining the records from the workflow table.')
        console.error('Stack: ', error);
        process.exit(1);
    }

    console.log('Records obtained: ', obtainRecords.storedResults.length);
    try {
        const processRecords = await asyncProcessRecordTableReceived(obtainRecords);
        if (!processRecords) {
            console.error('There was an error processing the records and inserting the custom parameter.');
            process.exit(1)
        }
    } catch (error) {
        console.error('There was an issue processing the records through the async processRecord Table method');
        console.error('Stack: ', error);
        process.exit(1);
    } finally{
        sql.close();
    }


}


async function asyncfetchRecordsFromWorkflowTable() {

    let storedResults = null;

    try {
        storedResults = await executeStoredProcedure(StoredProc);
        if (!storedResults) {
            return null;
        }
    } catch (error) {
        console.error('There was an error obtaining the stored procedure results')
        return null;
    }

    return storedResults;
}




async function asyncProcessRecordTableReceived(RecordsRecordSet) {

    const recordSet = RecordsRecordSet.storedResults;

    for (record of recordSet) {

        const POLICY_NUMBER = record.POLICY_NUMBER;
        let cparmValue

        try {
            //First we find the critical date information
            const obtainCriticalDate = await asyncCallCriticalDateServiceInternal(POLICY_NUMBER);
            if (obtainCriticalDate=== null) {
                continue;
            } else if (obtainCriticalDate.resultData.criticalDate ===null){
                cparmValue = 'Request By YourIT Ticket.';
            } else {
                const data = obtainCriticalDate.resultData
                const criticalDate = data.criticalDate;
                cparmValue = `Critical Date: ${criticalDate}`
            }
        } catch (error) {
            console.error('There was an error obtaining the critical date from the internal service');
            console.error('Stack: ', error);
            continue;
        }

        try {
            // then we insert the data objects into the CPARM.
            // IF NULL is returned from Critical service, then we insert 'Submit YourIT Ticket'
            // ELSE insert "XX/XX/XXXX as of {Date Calculated}"
            const insertCparm = await insertPRMPDetail(POLICY_NUMBER, cparmID, 0, cparmValue);
            if (insertCparm===0) {
                console.error('There was an error submitting an insert request for the custom parm detail.');
                continue;
            }

        } catch (error) {
            console.error('There was an issue with the insert service.');
            console.error('Stack: ', error);
            continue;
        }
    }
}

main();


module.exports = {
    asyncfetchRecordsFromWorkflowTable
    , asyncProcessRecordTableReceived
}