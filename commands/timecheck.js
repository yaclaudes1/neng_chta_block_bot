const fetch = require('node-fetch');

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timecheck')
        .setDescription('Displays solve time for last 20 blocks on CHTA & NENG blockchains'),
    async execute(interaction) {


        interaction.deferReply();
        // TODO: After a working prototype is made first task towards easier to read code is to make two arrays/maps one of the specific blockchain url and the other of the specific API components such as getblockcount, etc.
        // TODO: Simplify readibility of variable names.
        // Get current block index and place in corresponding promiseArray
        const getCurrentNengBlockHeightAPI = fetch('http://nengexplorer.mooo.com:3001/api/getblockcount').then(response => response.json());
        const getCurrentChtaBlockHeightAPI = fetch('http://chtaexplorer.mooo.com:3002/api/getblockcount').then(response => response.json());
        const promiseDataArray = await Promise.all([getCurrentNengBlockHeightAPI, getCurrentChtaBlockHeightAPI]);

        const currentNengBlockHeight = 'http://nengexplorer.mooo.com:3001/api/getblockhash?index=' + (promiseDataArray[0]);
        const currentChtaBlockHeight = 'http://chtaexplorer.mooo.com:3002/api/getblockhash?index=' + (promiseDataArray[1]);

        // Getblockhash[index] and append to promise array after setting lower bounds
        const previousNengBlockHeightAtTwenty = 'http://nengexplorer.mooo.com:3001/api/getblockhash?index=' + (promiseDataArray[0] - 20);
        const previousChtaBlockHeightAtTwenty = 'http://chtaexplorer.mooo.com:3002/api/getblockhash?index=' + (promiseDataArray[1] - 20);
        // hash too big to fit in buffer directly as json so trying string() instead. NOTE:WORKED!


        const getCurrentNengBlockHashAPI = fetch(currentNengBlockHeight).then(response => response.text());
        const getCurrentChtaBlockHashAPI = fetch(currentChtaBlockHeight).then(response => response.text());
        const getPreviousNengBlockHashAPI = fetch(previousNengBlockHeightAtTwenty).then(response => response.text());
        const getPreviousChtaBlockHashAPI = fetch(previousChtaBlockHeightAtTwenty).then(response => response.text());

        const blockHashArray = await Promise.all([getCurrentNengBlockHashAPI, getCurrentChtaBlockHashAPI, getPreviousNengBlockHashAPI, getPreviousChtaBlockHashAPI]);
        // promiseDataArray.concat(blockHashArray);
        // Getblock[hash] info -->Return json with info relevant to timestamp

        const currentNengBlockHash = 'http://nengexplorer.mooo.com:3001/api/getblock?hash=' + blockHashArray[0];
        const currentChtaBlockHash = 'http://chtaexplorer.mooo.com:3002/api/getblock?hash=' + blockHashArray[1];
        const previousNengBlockHash = 'http://nengexplorer.mooo.com:3001/api/getblock?hash=' + blockHashArray[2];
        const previousChtaBlockHash = 'http://chtaexplorer.mooo.com:3002/api/getblock?hash=' + blockHashArray[3];

        const timeRegEx = (/"time": \d+/i);
        const filterLetterRegEx = (/\D/g);

        const getCurrentNengBlockHashInfoAPI = fetch(currentNengBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));
        const getCurrentChtaBlockHashInfoAPI = fetch(currentChtaBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));
        const getPreviousNengBlockHashInfoAPI = fetch(previousNengBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));
        const getPreviousChtaBlockHashInfoAPI = fetch(previousChtaBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));

        const filteredTimeArray = await Promise.all([getCurrentNengBlockHashInfoAPI, getCurrentChtaBlockHashInfoAPI, getPreviousNengBlockHashInfoAPI, getPreviousChtaBlockHashInfoAPI]);
        //in days
        const nengTimeTwentyLastTwentyBlocks = ((filteredTimeArray[0] - filteredTimeArray[2]) / (1000));
        const chtaTimeTwentyLastTwentyBlocks = ((filteredTimeArray[1] - filteredTimeArray[3]) / (1000));

        // ***DONE***S1 fetch Block height and calculate prior 20.
        // ***DONE***S2 ReturnblockHash
        // ***DONE*** S3 use S2 to return block hash stats
        // ***DONE***+***Temp Workaround used regexp to process response.text() + splice string method ***S4 parse JSON and keep time 
        // ***DONE***S5 Get time of currentBlockTime - time of currentBlockTimeMinusTwenty
        // ***DONE***Echo info from S5 as reply in human readable language
        interaction.editReply('Neng solve time for the previous 20 blocks is: ' + nengTimeTwentyLastTwentyBlocks + ' seconds' + '\n\nChta solve time for the previous 20 blocks is: ' + chtaTimeTwentyLastTwentyBlocks) + ' seconds';
        // NOTE: multiple edit replies will overwrite previous. a single reply after doesn't work in a defer reply chain.
        // TODO: Check for correctness of time. Then write a global time function that produces readable format.
        // interaction.followUp('\n' + previousNengBlockHeightAtTwenty + '\n' + previousChtaBlockHeightAtTwenty);
        // interaction.followUp('\n' + filteredTimeArray[0] + '\n' + filteredTimeArray[1] + '\n' + filteredTimeArray[2] + '\n' + filteredTimeArray[3]);


        // Find currentBlockIndexTime - BlockIndex[current - 20] convert into minutes to show length of time to solve last 20 blocks, repeat on both chains');
    },
};