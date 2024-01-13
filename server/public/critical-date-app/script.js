

function validateForm() {
    let x = document.forms["PolicyNumberForm"]["input"].value;
    if (x == "") {
        alert("Policy Number must be completed")
        return false
    }
}

let input = document.querySelector(".input");
let button = document.querySelector(".button-21");

button.disable = true
input.addEventListener("change", stateHandle);
function stateHandle(){
    if (document.querySelector(".input").value === ""){
        button.disabled = true
    } else {
        button.disabled = false
    }
}

async function GetCriticalDateButton(){
    const policyNumber = document.getElementById('policyNumber').value
        if(policyNumber=== ""){
            alert("Policy Number is required")
        }else {
            try {
                const getCriticalDateResponse = await evaluateCriticalDates();
                const getCriticalDateData = getCriticalDateResponse.Json();
                const PolicyNumberReturned = getCriticalDateData.policyNumber;
                const criticalDateReturned = getCriticalDateData.criticalDate;
                const cashValueReturned = getCriticalDateData.cashValue;
                const loanIndebtedness = getCriticalDateData.loanIndebtedness;
                const MessageInfo = getCriticalDateData.MessageInfo;
                
                document.getElementById('PolicyNumberAPIResponse').innerText = PolicyNumberReturned
                document.getElementById('CriticalDateAPIResponse').innerText = criticalDateReturned
                document.getElementById('CashValueAPIResponse').innerText = cashValueReturned;
                document.getElementById('LoanIndebtednessAPIResponse').innerText = loanIndebtedness;
                document.getElementById('AdditionalInfoAPIResponse').innerText = MessageInfo

            } catch(error){
                console.error(error)
            }
        }

}

document.addEventListener('DOMContentLoaded', async function () {
    const systemStatus = await systemCheck();
    const systemStatusIndicator = document.getElementById('systemStatusIndicator');
    const systemStatusDot = document.getElementById('systemStatusDot');
    const systemStatusText = document.getElementById('systemStatusText');

    // Update system status
    if (systemStatus) {
        systemStatusDot.className = 'status-dot online';
        systemStatusText.textContent = 'Online';
    } else {
        systemStatusDot.className = 'status-dot offline';
        systemStatusText.textContent = 'Offline';
    }

    // Toggle dropdown menu
    systemStatusIndicator.addEventListener('click', function() {
        const dropdown = document.getElementById('serviceStatusDropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
});
