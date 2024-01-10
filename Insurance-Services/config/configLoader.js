// configLoader.js
const fs = require('fs');
const config = require('../../configuration/config.json')

function loadConfig() {
    const configPath = 'configuration/config.json'; // Adjust the path as needed
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    // Determine which environment configuration to use
    const environment = config.envfeatureSwitch.preprodEnabled ? 'preprod' : 'prod';
    const environmentConfig = config.environment[environment];

    // Extract and provide the required variables
    const ProductAPI = {
        baseUrl: environmentConfig.ProductAPI.baseUrl,
        apiKey: environmentConfig.ProductAPI.apiKey,
    };

    const PartyAPI = {
        baseUrl: environmentConfig.PartyAPI.baseUrl,
        apiKey: environmentConfig.PartyAPI.apiKey,
    };

    const PolicyAPI = {
        baseUrl: environmentConfig.PolicyAPI.baseUrl,
        apiKey: environmentConfig.PolicyAPI.apiKey,
    };

    return {
        environment,
        ProductAPI,
        PartyAPI,
        PolicyAPI,
    };
};

function getConfig(apiName) {
    const config = loadConfig();
    if(config[apiName]) {
        return {
         baseUrl: config[apiName].baseUrl,
         apiKey: config[apiName].apiKey,   
         environment: config.environment,
        };
    } else {
        throw new Error(`API ${apiName} was not found in configuration.`);

    }
}


module.exports = {loadConfig, getConfig};
