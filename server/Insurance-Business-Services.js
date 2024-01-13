const express = require('express');
const app = express();
const path = require('path');


function setRequestTimeout(req, res, next) {
    const timeoutInSeconds = 60; 
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            res.status(408).send('Request timeout');
        }
    }, timeoutInSeconds * 1000);

    // Clear the timeout if the response has been sent

    next();
}

app.use(express.json()); // for parsing application/json

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(setRequestTimeout);

const loadConfig = require('../Insurance-Services/config/configLoader')

const BA = require('../Insurance-Services/helper-services/helper')
app.get('/INSBusinessServiceAPI/evaluatePolicy/getBenefitDetails/:policyNumber', async (req, res, timeout) => {
        try {
            const policyNumber = req.params.policyNumber;
            if (!policyNumber) {
                return res.status(400).json({ MessageInfo: 'Policy number is required' });
            }
            const result = await BA.GetBenefitDetails(policyNumber);
            if (result) {
                res.json({
                    policyNumber: result.policyNumber,
                    processedToDate: result.processedToDate,
                    policyStatus: result.policyStatus,
                    planCode: result.planCode
                });
            } else {
                res.status(404).json({ MessageInfo: 'No data found for the provided policy number' });
            }
            res.on('finish', () => clearTimeout(timeout));
        } catch (error) {
            console.error('Error:', error);
            if (!res.headersSent) {
                res.status(500).json({ Error: 'Internal Server Error' });
            }
        }
    });

const evaluateCriticalDates = require('../Insurance-Services/main/criticalDateEvaluation/EvalCriticalDates-ServerModule')
app.get('/INSBusinessServiceAPI/evaluatePolicy/evaluateCriticalDates/:policyNumber', async (req, res, timeout) => {
    try {
        const policyNumber = req.params.policyNumber;
        if (!policyNumber) {
            return res.status(400).json({ MessageInfo: 'Policy number is required' });
        }
        const result = await evaluateCriticalDates(policyNumber);
        if (result) {
            res.json({
                policyNumber: result.policyNumber,
                criticalDate: result.criticalDate,
                cashValue: result.cashValue,
                loanIndebtedness: result.loanIndebtedness,
                MessageInfo: result.MessageInfo
            });
        } else {
            res.status(404).json({ MessageInfo: 'No data found for the provided policy number' });
        }
        res.on('finish', () => clearTimeout(timeout));
    } catch (error) {
        console.error('Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ Error: 'Internal Server Error' });
        }
    }
});



const port = 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });