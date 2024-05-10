const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const { request } = require('express');
const loadConfig = require('../config/configLoader')
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') })

const apiPolicyBaseUrl = process.env.EXL_LIFEPRO_POLICY_ENDPOINT;
const BenefitDetailsAPI = apiPolicyBaseUrl + `/v1/Policy/GetBenefitDetails`

const policyAPIKey = process.env.EXL_LIFEPRO_POLICY_KEY;

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

const randomGuid = generateGuid();

async function GetBenefitDetails(policyNumber){
    const policyIdentifier = policyNumber
    const companyCode = '01'
    const benefitType = 'BA'
    const benefitSequence = 1


    const requestBody = {
        "getBenefitRequest": {
            "GUID": randomGuid,
            "UserType": "DAD1",
            "CoderID": "DAD1",
            "CompanyCode": companyCode,
            "PolicyNumber": policyIdentifier,
            "BenefitSequence": benefitSequence,
            "BenefitType": benefitType,
        }
    };
    const requestOptions = {
        method: 'POST',
        headers:{
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${policyAPIKey}`
        },
        body: JSON.stringify(requestBody),
    };
        try{
            const GetBenefitDetailResponse = await fetch(BenefitDetailsAPI, requestOptions);
            const GetBenefitDetailsResponseData = await GetBenefitDetailResponse.json();
            const GetBenefitDetailsReturnCode = GetBenefitDetailsResponseData.GetBenefitDetailsResult.ReturnCode

            if (GetBenefitDetailsReturnCode === 0 ) {
                const policyNumber = policyIdentifier
                const processedToDate = GetBenefitDetailsResponseData.GetBenefitDetailsResult.BenefitDetails[0].ProcessedToDate;
                const policyStatus = GetBenefitDetailsResponseData.GetBenefitDetailsResult.BenefitDetails[0].StatusCode
                const planCode = GetBenefitDetailsResponseData.GetBenefitDetailsResult.BenefitDetails[0].PlanCode
            
                return {
                    policyNumber,
                    processedToDate,
                    policyStatus,
                    planCode
                }
            
            } else {
                console.error('Invalid response structure:', GetBenefitDetailsResponseData)
            }
            } catch (error) {
                console.error('Error during benefit detail query', error.message);
            }

        }
















module.exports = { GetBenefitDetails, generateGuid };


