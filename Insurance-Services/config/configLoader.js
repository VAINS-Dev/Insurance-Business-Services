// configLoader.js
const fs = require('fs');
//const config = require('../../Insurance-Services/config')

function loadConfig() {
    const configPath = 'Insurance-Services/config/configuration/config.json'; 
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    const environment = config.envfeatureSwitch.preprodEnabled ? 'preprod' : 'prod';
    const environmentConfig = config.environment[environment];

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
