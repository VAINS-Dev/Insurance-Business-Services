const { loadConfig } = require("./../config/configLoader");
const apiProductBaseUrl = configurationLoader.getConfig('ProductAPI').baseUrl;
const apiPolicyBaseUrl = configurationLoader.getConfig('PolicyAPI').baseUrl;
const apiPartyBaseUrl  = configurationLoader.getConfig('PartyAPI').baseUrl;

async function checkApiStatus(apiName, apiUrl) {
    try {
        const response = await fetch(apiUrl);

        if(response.ok) {
            console.log(`${apiName} is online. Status Code: ${response.status}`);
            return `\x1b[32mOnline\x1b[0m`;
        } else {
            console.error(`${apiName} is offline or unresponsive. Status Code: ${response.status}`)
            return `\x1b[31mOffline\x1b[0m`;
        }
    } catch(error) {
        console.error(`Error checking ${apiName} status,`, error.message);
        return `\x1b[31mOffline\x1b[0m`;
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
    return isSystemOnline;
};

module.exports = systemCheck;