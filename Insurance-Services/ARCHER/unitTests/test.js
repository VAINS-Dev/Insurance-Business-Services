const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testWebServiceCall(){
    const policyNumber = 'RH19452876';
    const apiurl = `/INSBusinessServiceAPI/evaluatePolicy/evaluateCriticalDates/${policyNumber}`

    const response = await fetch(apiurl)
    console.log(response)


}

testWebServiceCall();