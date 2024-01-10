const { loadConfig } = require("../config/configLoader");
const configurationLoader = require('../config/configLoader')
const apiProductBaseUrl = configurationLoader.getConfig('ProductAPI').baseUrl;
const apiPolicyBaseUrl = configurationLoader.getConfig('PolicyAPI').baseUrl;
const apiPartyBaseUrl  = configurationLoader.getConfig('PartyAPI').baseUrl;


async function checkApiStatus(apiName, apiUrl) {
    try {
        const response = await fetch(apiUrl);

        const apiStatusElement = document.getElementById(apiName + 'Status');
        if(response.ok) {
            console.log(`${apiName} is online. Status Code: ${response.status}`);
            apiStatusElement.textContent = `${apiName}: Online`;
            apiStatusElement.className = 'online';
        } else {
            console.error(`${apiName} is offline or unresponsive. Status Code: ${response.status}`);
            apiStatusElement.textContent = `${apiName}: Offline`;
            apiStatusElement.className = 'offline';
        }
    } catch(error) {
        console.error(`Error checking ${apiName} status,`, error.message);
        const apiStatusElement = document.getElementById(apiName + 'Status');
        apiStatusElement.textContent = `${apiName}: Offline`;
        apiStatusElement.className = 'offline';
    }
};


async function systemCheck() {
    const definitions = [
        { name: 'PartyAPI' , url: apiPartyBaseUrl },
        { name: 'PolicyAPI', url: apiPolicyBaseUrl },
        { name: 'ProductAPI', url: apiProductBaseUrl }
    ]
    console.log('Starting API uptime check....')
    let isSystemOnline = true;
    
    for (const { name, url } of definitions) {
        const apiStatus = await checkApiStatus(name, url);
        isSystemOnline = isSystemOnline && apiStatus;
    }
    console.log('System Check Complete.')
    console.clear();
    return isSystemOnline;
};

module.exports = systemCheck;