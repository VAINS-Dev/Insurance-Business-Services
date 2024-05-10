/*---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*
    SOFTWARE USE NOTICE: This software is intended for use by the DEPARTMENT OF VETERANS AFFAIRS: INSURANCE CENTER
*---------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') })


const apiPolicyBaseUrl = process.env.EXL_LIFEPRO_POLICY_ENDPOINT;
const apiPolicyKey = process.env.EXL_LIFEPRO_POLICY_KEY;
const systemAccount = process.env.SYSTEM_ACCOUNT;


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
};

async function insertPRMPDetail(PolicyNumber, ParmDefinitionID, AllowableValueId, ParameterValue){

    const GUID = generateGuid();
    const insertPRMPDetailURL =`${apiPolicyBaseUrl}/v1/PolicyCustomParameter/InsertPRMPDetails`
  
    const requestBody = {
      "GUID": GUID,
      "CompanyCode": "01",
      "PolicyNumber": PolicyNumber,
      "AllowableValueId": AllowableValueId,
      "ParamValue": ParameterValue,
      "ParamDefinitionId": ParmDefinitionID
    }
    const requestOptions = {
      method: 'POST',
      headers:{
        'CoderID': systemAccount,
        'UserType': systemAccount,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiPolicyKey}`
      },
      body: JSON.stringify(requestBody)
    };
  
    try{
        const insertPRMPResponse = await fetch(insertPRMPDetailURL, requestOptions);
        const insertPRMPResponseData = await insertPRMPResponse.json();
        if (insertPRMPResponse.status === 200){
          return 0
        } else {
          console.error('Error inserting new custom parameter.', insertPRMPResponse);
          let status = insertPRMPResponse.status
          let statusText = insertPRMPResponse.statusText
          return 1
        }
  
  
    } catch(error) {
      if(error.message && error.status === 417){
        let errorMessage = error.message
        let errorStatus = error.status
          return 1
        
    } else {
      console.error(`PolicyNumber - error during Insert PRMP Details request: `, error);
      let errorMessage = error.message
      let errorStatus = error.status

      return 1
    }
  }
  }

  module.exports = { insertPRMPDetail }