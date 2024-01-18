//const s = require('./systemCheck')
const sql = require('mssql')
const d = require('../ARCHER/ARCHER-helper')
const path = require('path');
const config = require('../config/configLoader');
const fs = require('fs');
const s = require('../config/systemCheck');
const system = require('../ARCHER/ARCHER-helper')



async function runARCHER() {
    const options = { timeZone: 'America/New_York' };
        const now = new Date(new Date().toLocaleString('en-US', options));
        const currentHour = now.getHours();
        const startHour = 5;  // 5:00 AM - Start Time
        const endHour = 24;   // 5:00 PM - Last End Time to stay out of cycle

            //const systemCheck = require('../ARCHER/systemCheck')


    if (currentHour >= startHour && currentHour < endHour) {
        console.log("Initiating A.R.C.H.E.R (Automated Remittance Control Handling and Electronic Reconciliation)" + now.toLocaleString());
                try{
                    //await confirmation;
                    const systemStatus = await system.systemCheck();
                    console.log('Overall System Status:', systemStatus);
                    if (!systemStatus) {
                        console.log('LIPAS REST API is offline. Process Stopped');
                        process.exit(1);

                    } else {
                        if (config.sqlReadEnabled === true) {

                            const loanFolder = path.join(__dirname, 'SqlQueries/loan');
                            const premiumFolder = path.join(__dirname, 'SqlQueries/premium-test');

                            await d.runAllQueriesInFolder(loanFolder, 1) //Executes the Entire Loan Service using helper agents
                            await d.runAllQueriesInFolder(premiumFolder, 2)   //Executes the Entire Premium Service using helper agents



                        } else if (config.sqlReadEnabled === false) {
                            if (config.sqlLoggingEnabled === false) { //If Config settings are mis-matched, do not allow the process to continue
                                console.log('Test Mode Enabled: Logging files locally.')

                                //      Establish Global Variables      //


                                const loanFolder = path.join(__dirname, 'WORKAREA/loan/loan.intake/new');
                                const premiumFolder = path.join(__dirname, 'WORKAREA/premium/premium.intake/new');
                                const loanFailureLogFolderPath = path.join(__dirname, 'WORKAREA/loan/loan.log/loan.failure');
                                const loanSuccessLogFolderPath = path.join(__dirname, 'WORKAREA/loan/loan.log/loan.success');
                                const premiumFailureLogFolderPath = path.join(__dirname, 'WORKAREA/premium/premium.log/premium.failure');
                                const premiumSuccessLogFolderPath = path.join(__dirname, 'WORKAREA/premium/premium.log/premium.success');
                                const currentDate = new Date().toISOString().replace(/:/g, '-');
                                const premiumSuccessLog = `PremiumPayments - Success - ${currentDate}.txt`;
                                const premiumFailureLog = `PremiumPayments - Failures - ${currentDate}.txt`;
                                const loanSuccessLog = `LoanPayments - Success - ${currentDate}.txt`;
                                const loanFailureLog = `LoanPayments - Failures - ${currentDate}.txt`;

                                //      End Declaration of Global Var    //

                                const loanResult = d.readFolderResults(loanFolder, 1);                   //Read Loan Folder
                                const jsonLoanResult = JSON.parse(loanResult);                              //Parse Aggregate Loan Folder Results
                                if (Array.isArray(jsonLoanResult) && jsonLoanResult.length > 0) {           //Determine if proper format/array
                                    await fs.writeFile(loanFailureLogFolderPath + loanFailureLog, 'Loan Payment Failure Log:');
                                    await fs.appendFile(loanFailureLogFolderPath + loanFailureLog, 'Status, PolicyNumber, Amount, TaxYear, PaymentDate');
                                    await fs.writeFile(loanSuccessLogFolderPath + loanSuccessLog, 'Loan Payment Success Log:');
                                    await fs.appendFile(loanSuccessLogFolderPath + loanSuccessLog, 'Status, PolicyNumber, Amount, Tax Year, PaymentDate, PriorLoanBalance, NewLoanBalance');

                                    for (const jsonLoanResultItem of jsonLoanResult) {
                                        const policyNumber = jsonLoanResultItem.POLICY_NUMBER;
                                        const amount = jsonLoanResultItem.AMOUNT
                                        const taxYear = jsonLoanResultItem.TAX_YEAR
                                        const paymentDate = jsonLoanResultItem.PAYMENT_DATE
                                        const loanPayment = await d.ARCHERProcessLoanPayment(policyNumber, amount, taxYear, paymentDate)
                                        if (!loanPayment) {
                                            //If ProcessPremium for Loan Payment Service is fail, logs to loan.log/loan.failure
                                            console.error('Process Loan Payment Service Failed.')
                                            await fs.appendFile(loanFailureLogFolderPath + loanFailureLog, `Failed ,${policyNumber}, ${amount}, ${taxYear}, ${paymentDate}`)
                                        } else {
                                            console.log('Process Loan Payment Processed Successfully.');
                                            //If ProcessPremium for Loan Payment Service is fail, logs to loan.log/loan.success
                                            const loanValidate = await d.ARCHERValidatePayment(policyNumber, 1) //Validate payment for Loan Service - AllLoanList
                                            const priorLoanBalance = loanValidate.AllLoans.PriorLoan;
                                            const newLoanBalance = loanValidate.Allloans.NewLoan;
                                            await fs.appendFile(loanSuccessLogFolderPath + loanSuccessLog, `Success ,${policyNumber}, ${amount}, ${taxYear}, ${paymentDate}, ${priorLoanBalance}, ${newLoanBalance}`);
                                        }
                                    }
                                } else {
                                    console.error('Loan File is not in Array Format!');
                                }

                                const premiumResult = d.readFolderResults(premiumFolder, 2);             //Read Premium Folder
                                const jsonPremiumResult = JSON.parse(premiumResult);                        //Parse Aggregate Premium Folder Results
                                if (Array.isArray(jsonPremiumResult) && jsonPremiumResult.length > 0) {     //Determine if proper format/array
                                    await fs.writeFIle(premiumFailureLogFolderPath + premiumFailureLog, 'Premium Payment Failure Log:');
                                    await fs.appendFile(premiumFailureLogFolderPath + premiumFailureLog, 'Status, PolicyNumber, Amount, TaxYear, Payment Date, PriorPaidToDate');
                                    await fs.writeFile(premiumSuccessLogFolderPath + premiumSuccessLog, 'Premium Payment Success Log:');
                                    await fs.appendFile(premiumSuccessLogFolderPath + premiumSuccessLog, 'Status, PolicyNumber, Amount, TaxYear, Payment Date, PriorPaidToDate, NewPaidToDate');

                                    for (const jsonPremiumResultItem of jsonPremiumResult) {
                                        const policyNumber = jsonPremiumResultItem.POLICY_NUMBER;
                                        const amount = jsonPremiumResultItem.AMOUNT;
                                        const taxYear = jsonPremiumResultItem.TAX_YEAR;
                                        const paymentDate = jsonPremiumResultItem.PAYMENT_DATE;
                                        const preValidation = await d.ARCHERValidatePayment(policyNumber, 2)
                                        const priorPTD = preValidation.GetPolicyResult.GetPolicyResp.Paid_To_Date;
                                        const premiumPayment = await d.ARCHERProcessPremiumPayment(policyNumber, amount, taxYear, paymentDate)
                                        if (!premiumPayment) {
                                            //If ProcessPremium Payment Service is fail, logs to premium.log/premium.failure
                                            console.error('Process Premium Payment Service Failed.');
                                            await fs.appendFile(premiumFailureLogFolderPath + premiumFailureLog, `Failed, ${policyNumber}, ${amount}, ${taxYear}, ${paymentDate}, ${priorPTD}`);
                                        } else {
                                            //If ProcessPremium Payment Service is successful, logs to premium.log/premium.success
                                            console.log('Process Premium Payment Processed Successfully.');
                                            const premiumValidate = await d.ARCHERValidatePayment(policyNumber, 2);
                                            const newPaidToDate = premiumValidate.GetPolicyResult.GetPolicyResp.Paid_To_Date;
                                            await fs.appendFile(premiumSuccessLogFolderPath + premiumSuccessLog, `Success, ${policyNumber}, ${amount}, ${taxYear}, ${paymentDate}, ${priorPTD}, ${newPaidToDate}`);

                                        }
                                    }

                                } else {
                                    console.error('Premium File is not in Array Format!')
                                }
                            } else {
                                console.log('Mismatched configuration. Process Stopped!')
                                process.exit(1)
                            }
                        }
                        //Incorporating changing of directory contents and file names when configuration file meets pre-requisites.
                        if (config.sqlReadEnabled === false) {
                            const loanFolder = path.join(__dirname, 'WORKAREA/loan/loan.intake/new');
                            const premiumFolder = path.join(__dirname, 'WORKAREA/premium/premium.intake/new');
                            const loanCompletedFolder = path.join(__dirname, 'WORKAREA/loan/loan.intake/completed');
                            const premiumCompletedFolder = path.join(__dirname, 'WORKAREA/premium/premium.intake/completed');

                            //Once file processing is done, we will rename the files to append the date time it was processed.
                            //then file processing is done, we will move the present files into the intake/Completed Folders.
                            await d.appendDateTimeToFiles(loanFolder);
                            await d.appendDateTImeToFiles(premiumFolder);
                            await d.moveFilesToCompletedFolder(loanFolder, loanCompletedFolder);
                            await d.moveFilesToCompletedFolder(premiumFolder, premiumCompletedFolder)
                        }

                    }
                }
        catch (error) {
            console.log('Error during system check:', error.message);
            process.exit(1);
        }
    } else {
        console.log("Outside of the time window: " + now.toLocaleString());
    }
}







runARCHER();





//module.export = runARCHER;