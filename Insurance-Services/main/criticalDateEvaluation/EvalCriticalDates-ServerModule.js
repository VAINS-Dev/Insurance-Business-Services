// Import necessary modules and functions
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const loadConfig = require('../../config/configLoader'); // Adjust the path as needed
const guid = require('../../helper-services/helper');
const randomGuid = guid.generateGuid();

const apiPolicyBaseUrl = loadConfig.getConfig('PolicyAPI').baseUrl;
const apiPolicyKey = loadConfig.getConfig('PolicyAPI').apiKey;
const apiToken = apiPolicyKey;

const surrenderQuoteEndpoint = `/v3/Quote/${randomGuid}/SurrenderQuote`;
const surrQuoteApiUrl = `${apiPolicyBaseUrl}${surrenderQuoteEndpoint}`;

function reformatDate(yyyyMMddDate) {
    const year = yyyyMMddDate.substring(0, 4);
    const month = yyyyMMddDate.substring(4, 6);
    const day = yyyyMMddDate.substring(6, 8);
    return `${month}-${day}-${year}`;
}

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

async function getSurrenderQuote(policyNumber, surrenderDate) {
    const PN = policyNumber;
    const QuoteDate = surrenderDate;
    let surrQuoteResponseData; // Declare here to make it accessible outside the try block

    const requestBody = {
        "surrenderQuoteInput": {
            "CompanyCode": "01",
            "EffectiveDate": QuoteDate,
            "IncludeETIQuote": true,
            "IncludeLoanQuote": true,
            "IncludeRPUQuote": true,
            "OverrideFutureDateEdits": true,
            "PolicyNumber": PN
        }
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'CoderId': 'DAD1',
            'UserType': 'DAD1',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(requestBody),
    };

    try {
        const surrQuoteResponse = await fetch(surrQuoteApiUrl, requestOptions);
        const surrQuoteResponseData = await surrQuoteResponse.json();
        const surrQuoteResponseResult = surrQuoteResponseData.SurrenderQuoteResult;

        const surrQuoteResponseCode = surrQuoteResponseData.SurrenderQuoteResult.ReturnCode;
        console.log('Processing Surrender REQ:', PN);
        console.log('SURR Response Code', surrQuoteResponseCode);


        //console.log(`Policy: ${policyNumber} - Surrender quote response:`, surrQuoteResponseData);

        if (!surrQuoteResponseData || surrQuoteResponseData.SurrenderQuoteResult === null || surrQuoteResponseCode !== 0) {
            throw new Error(`Surrender quote response is null or does not have SurrenderQuoteResult for policy ${policyNumber} at date ${surrenderDate}`);
        }
        const totalCV = surrQuoteResponseResult.CashValues.CashValue + surrQuoteResponseResult.CashValues.CashValuePUA
        const totalLoan = surrQuoteResponseResult.Loan.LoanBalance

        const netSurrenderAmt = (totalCV-totalLoan)

        console.log('Total CV:', totalCV, 'Total Loan:', totalLoan)
        console.log('NetSurrenderAmount:', netSurrenderAmt)

        if (!netSurrenderAmt) {
            throw new Error(`Net Surrender Amount is null or undefined in the response for policy ${policyNumber} and date ${surrenderDate}`);
        } 

        console.log(`Policy: ${policyNumber} - NetSurrenderAmount: ${surrQuoteResponseResult.NetSurrenderAmount}`);

        const surrQuoteDateUsed = surrQuoteResponseResult.EffectiveDateUsed;
        console.log('QuoteDateUsed:', surrQuoteDateUsed, 'Response Code:', surrQuoteResponseCode)

        return {
            netSurr: netSurrenderAmt,
            cV: surrQuoteResponseResult.CashValues.CashValue,
            lI: surrQuoteResponseResult.Loan.LoanBalance
            //This above update takes into consideration only cash value + loan balances, it removes the unapplied cash and unprocessed premiums.
        };
    } catch (error) {
        console.error(`Policy: ${policyNumber} - Error during surrender quote request:`, error);
        return null; // Return null to indicate an error
    }
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


function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
}

async function getPolicyAnniversaryDate(policyNumber) {
    const policyIdentifier = policyNumber;
    const companyCode = "01";
    const BenefitDetailsAPI = apiPolicyBaseUrl + `/v1/Policy/GetBenefitDetails`;

    const requestBody = {
        "getBenefitRequest": {
            "GUID": randomGuid,
            "UserType": "DAD1",
            "CoderID": "DAD1",
            "CompanyCode": companyCode,
            "PolicyNumber": policyIdentifier,
            "BenefitSequence": 1,
            "BenefitType": "BA",
        }
    };
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(requestBody)
    };
    try {
        const getBenefitDetails = await fetch(BenefitDetailsAPI, requestOptions);
        const getBenefitDetailsData = await getBenefitDetails.json();
        //console.log(getBenefitDetailsData)
        const getBenefitDetailsReturnCode = getBenefitDetailsData.GetBenefitDetailsResult.ReturnCode;
        //console.log(getBenefitDetailsReturnCode)

        if (getBenefitDetailsReturnCode === 0) {
            const processedToDate = getBenefitDetailsData.GetBenefitDetailsResult.BenefitDetails[0].ProcessedToDate;
            if ( processedToDate.length = 8) {
                const processedToDateFormatted = processedToDate;
                //console.log(processedToDateFormatted);
                return processedToDateFormatted;
            } else {
                console.error('Invalid ProcessedToDate format:', processedToDate);
            }
        } else {
            console.error('Invalid response structure:', getBenefitDetailsData);
        }
    } catch (error) {
        console.error('Error during benefit detail query:', error.message);
    }
}



async function getPolicyIssueDay(policyNumber) {
    const policyIdentifier = policyNumber;
    const companyCode = "01";
    const policySearchApi = apiPolicyBaseUrl + `/v3/Policy/${randomGuid}/PolicySearch`;

    const requestBody = {
        "policySearchReq": {
            "CompanyCode": companyCode,
            "PolicyNumber": policyIdentifier
        }
    };
    const requestOptions = {
        method: 'POST',
        headers: {
            'CoderId': 'DAD1',
            'UserType': 'DAD1',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify(requestBody)
    };
    try {
        const policySearchResponse = await fetch(policySearchApi, requestOptions);
        const policySearchResponseData = await policySearchResponse.json();
        const policySearchResponseCode = policySearchResponseData.PolicySearchRESTResult.ReturnCode

        if (policySearchResponseCode === 0) {
            const policyIssueDate = policySearchResponseData.PolicySearchRESTResult.PolicySearchResp[0].IssueDate;
            console.log(policyIssueDate);

            if (policyIssueDate && policyIssueDate.length >= 8) {
                const policyIssueDay = policyIssueDate.substring(6, 8);
                console.log(policyIssueDay);
                return policyIssueDay;
            } else {
                console.error('Invalid IssueDate format:', policyIssueDate);
            }
        } else {
            console.error('Invalid response structure:', policySearchResponseData);
        }
    } catch (error) {
        console.error('Error during policy search:', error.message);
    }

}

const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2,'0');
    const day = date.getDate().toString().padStart(2,'0');
    return `${year}${month}${day}`
}


async function evaluateCriticalDates(policyNumber) {
    try {
        const policyAnniversaryDate = await getPolicyAnniversaryDate(policyNumber);
        const policyIssueDay = await getPolicyIssueDay(policyNumber);

        if (!policyAnniversaryDate || !policyIssueDay) {
            throw new Error(`Invalid data for policy ${policyNumber}`);
        }

        const policyAnniversaryDateString = policyAnniversaryDate.toString();
        const endDate = new Date(
            parseInt(policyAnniversaryDateString.substring(0, 4)),
            parseInt(policyAnniversaryDateString.substring(4, 6)) - 1,
            parseInt(policyAnniversaryDateString.substring(6, 8))
        );

        const startDate = new Date(endDate);
        startDate.setFullYear(endDate.getFullYear() - 1);

        const dateRange = Array.from({ length: 12 }, (_, index) => {
            const date = new Date(startDate);
            date.setMonth(startDate.getMonth() + index);
            date.setDate(policyIssueDay);
            return formatDateForAPI(date);
        });

        let quoteDateA = null, quoteDateB = null;
        let netSurrenderAmountA = null, netSurrenderAmountB = null;

        for (const surrenderDate of dateRange) {
            const surrenderQuoteResult = await getSurrenderQuote(policyNumber, surrenderDate);

            if (surrenderQuoteResult) {
                const netSurr = surrenderQuoteResult.netSurr;

                if (!quoteDateA) {
                    quoteDateA = surrenderDate;
                    netSurrenderAmountA = netSurr;

                    // Check if the initial netSurrenderAmountA is negative
                    if (netSurrenderAmountA < 0) {
                        console.log(`Critical Date prior to last anniversary date for policy ${policyNumber}.`);
                        return {
                            policyNumber: policyNumber,
                            criticalDate: null,
                            cashValue: null,
                            loanIndebtedness: null,
                            required_repayment: null,
                            monthly_repayment: null,
                            returnCode: 1,
                            MessageInfo: "Critical Date prior to last anniversary date"
                        };
                    }
                } else if (quoteDateA) {
                    quoteDateB = surrenderDate;
                    netSurrenderAmountB = netSurr;

                    if ((netSurrenderAmountA >= 0) !== (netSurrenderAmountB >= 0)) {
                        // Find a range, now evaluate dates between
                        const criticalDate = await findCriticalDate(policyNumber, quoteDateA, quoteDateB);
                        if (criticalDate) {
                            return criticalDate;
                        }
                    }
                    quoteDateA = surrenderDate;
                    netSurrenderAmountA = netSurr;
                }
            }
        }

        if (!quoteDateB) {
            console.log(`No critical date found for policy ${policyNumber}.`);
            return {
                policyNumber: policyNumber,
                criticalDate: null,
                cashValue: null,
                loanIndebtedness: null,
                required_repayment: required_repayment_amt,
                monthly_repayment: monthly_repayment_amt,
                returnCode: 1,
                MessageInfo: "No critical date found"
            };
        }
    } catch (error) {
        console.error(`Error in evaluateCriticalDates for policy ${policyNumber}:`, error);
        return {
            policyNumber: policyNumber,
            criticalDate: null,
            cashValue: null,
            loanIndebtedness: null,
            required_repayment: null,
            monthly_repayment: null,
            returnCode: 1,
            MessageInfo: error.message
        };
    }
}


function roundToTheNearestHundreth(num) {
    return Math.round(num * 100) / 100;
}

async function findCriticalDate(policyNumber, startDate, endDate) {
    const currentDate = parseDateString(startDate);
    const finalEndDate = parseDateString(endDate);

    while (currentDate <= finalEndDate) {
        const formattedDate = formatDate(currentDate);
        const response = await getSurrenderQuote(policyNumber, formattedDate);
        const required_repayment_amt = roundToTheNearestHundreth(response.cV * 0.06)
        const monthly_repayment_amt = roundToTheNearestHundreth((response.lI - required_repayment_amt) / 5 / 12);

        if (response && response.netSurr >= -1 && response.netSurr <= 1) {
            return {
                policyNumber: policyNumber,
                criticalDate: reformatDate(formattedDate),
                cashValue: response.cV,
                loanIndebtedness: response.lI,
                required_repayment: required_repayment_amt,
                monthly_repayment: monthly_repayment_amt,
                returnCode: 0,
                MessageInfo: null
            
            };
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return null; // No critical date found within the range
}


module.exports = evaluateCriticalDates;
