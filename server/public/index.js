document.getElementById('GetCriticalDateButton').addEventListener('click', function{

            const apiBaseUrl = 'http://localhost:3000'
            const apiEndpoint = '/INSBusinessServiceAPI/evaluatePolicy/evaluateCriticalDates/RH50046040'
            var inputValue = document.getElementById('policyNumber').value
            if(!inputValue) {
            fetch(`${apiBaseUrl}${apiEndpoint}`)

            const getCriticalDateData = getCriticalDateResponse.Json();
            const PolicyNumberReturned = getCriticalDateData.policyNumber;
            const criticalDateReturned = getCriticalDateData.criticalDate;
            const cashValueReturned = getCriticalDateData.cashValue;
            const loanIndebtedness = getCriticalDateData.loanIndebtedness;
            const additionalInfo = getCriticalDateData.additionalInfo;
            
            document.getElementById('PolicyNumberAPIResponse').innerText = PolicyNumberReturned
            document.getElementById('CriticalDateAPIResponse').innerText = criticalDateReturned
            document.getElementById('CashValueAPIResponse').innerText = cashValueReturned;
            document.getElementById('LoanIndebtednessAPIResponse').innerText = loanIndebtedness;
            document.getElementById('AdditionalInfoAPIResponse').innerText = additionalInfo
    } 
    else {
        alert("Please enter a policy number")
    }

})