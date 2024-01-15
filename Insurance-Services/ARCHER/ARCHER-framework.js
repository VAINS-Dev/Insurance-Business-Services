const s = require('./systemCheck')
const sql = require('mssql')
const d = require('../ARCHER/ARCHER-helper')


async function runARCHER() {
    const options = { timeZone: 'America/New_York' };
        const now = new Date(new Date().toLocaleString('en-US', options));
        const currentHour = now.getHours();
        const startHour = 5;  // 5:00 AM - Start Time
        const endHour = 17;   // 5:00 PM - Last End Time to stay out of cycle

            const systemCheck = require('../ARCHER/systemCheck')


    if (currentHour >= startHour && currentHour < endHour) {
        console.log("Executing task: " + now.toLocaleString());
        try{
            //await confirmation;
            const systemStatus = await s.systemCheck();
            console.log('Overall System Status:', systemStatus);
            if(!systemStatus) {
                console.log('LIPAS REST API is offline. Process Stopped');
                process.exit(1);

            } else {
                const loanFolder = path.join(__dirname, 'SqlQueries/loan');
                const premiumFolder = path.join(__dirname, 'SqlQueries/premium');
                
                await d.runAllQueriesInFolder( loanFolder , 1 ) //Executes the Entire Loan Service using helper agents
                await d.runAllQueriesInFolder( premiumFolder, 2 )   //Executes the Entire Premium Service using helper agents
                
}
        } catch (error) {
            console.log('Error during system check:', error.message);
            process.exit(1);
        }






    } else {
        console.log("Outside of the time window: " + now.toLocaleString());
    }
}













module.export = runARCHER;