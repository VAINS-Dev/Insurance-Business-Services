const { asyncCallCriticalDateServiceInternal } = require("./helper-services/callCriticalServiceInternal");


async function test(){
try{
    const test = await asyncCallCriticalDateServiceInternal('J81007911')
    console.log(test);
}catch(error){
    console.error('Stack: ', error);
}

}

test();