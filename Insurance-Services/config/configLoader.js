// configLoader.js
const fs = require('fs');
//const config = require('../../Insurance-Services/config')

function loadConfig() {
    const configPath = 'Insurance-Services/config/configuration/config.json'; 
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    const environment = config.envfeatureSwitch.preprodEnabled ? 'preprod' : 'prod';
    const sqlLoggingEnabled = config.loggingFeatureSwitch.sqlLoggingEnabled;
    const sqlReadEnabled = config.dataReadFeatureSwitch.sqlDataReadEnabled;
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
    const sqlServerConfig = {
        host: environmentConfig.sqlServer.host,
        user: environmentConfig.sqlServer.user,
        password: environmentConfig.sqlServer.password
    };

    return {
        environment,
        sqlLoggingEnabled,
        sqlReadEnabled,
        ProductAPI,
        PartyAPI,
        PolicyAPI,
        sqlServerConfig,
    };
};

function getConfig(apiName) {
    const config = loadConfig();
    if(config[apiName]) {
        return {
         baseUrl: config[apiName].baseUrl,
         apiKey: config[apiName].apiKey,   
         environment: config.environment,
         host: config[apiName].host,
         user: config[apiName].user,
         password: config[apiName].password
        };
    } else {
        throw new Error(`API ${apiName} was not found in configuration.`);

    }
}


module.exports = {loadConfig, getConfig};
