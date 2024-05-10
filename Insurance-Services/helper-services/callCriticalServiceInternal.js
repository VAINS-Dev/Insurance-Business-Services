const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));



async function asyncCallCriticalDateServiceInternal(policyNumber) {
    const host = `http://localhost:3000`
    try {
        const endpoint = `/INSBusinessServiceAPI/evaluatePolicy/evaluateCriticalDates/${policyNumber}`
        const url = host + endpoint;
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/Json'
            }
        }
        try {
            const result = await fetch(url, requestOptions);
            const resultData = await result.json();
            return { resultData }

        } catch (error) {
            console.error('There was an error fetching the results from the local server instance.');
            console.error('Stack: ', error);
            return null;
        }

    } catch (error) {
        console.error('There was an error processing the critical date calculation')
        console.error('Stack: ', error);
        return null;
    }
}


module.exports = { asyncCallCriticalDateServiceInternal }

