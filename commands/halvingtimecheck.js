const fetch = require('node-fetch');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('halvingtimecheck')
        .setDescription('Displays estimated time for next halving rewards event on NENG & CHTA blockchain.'),
    async execute(interaction) {
        await interaction.deferReply();

        const NENG_EXPLORER = 'http://nengexplorer.mooo.com:3001/api/';
        const CHTA_EXPLORER = 'http://chtaexplorer.mooo.com:3002/api/';

        const NENG_HALVING_HEIGHT = 2100000;
        const CHTA_HALVING_HEIGHT = 1050000;
        const NENG_BLOCK_TIME_DAY = 1440;
        const CHTA_BLOCK_TIME_DAY = 720;

        // Get current block index and place in corresponding promiseArray
        const getCurrentNengBlockHeightAPI = fetch(NENG_EXPLORER + 'getblockcount').then(response => response.json());
        const getCurrentChtaBlockHeightAPI = fetch(CHTA_EXPLORER + 'getblockcount').then(response => response.json());
        const promiseDataArray = await Promise.all([getCurrentNengBlockHeightAPI, getCurrentChtaBlockHeightAPI]);

        const currentNengBlockHeight = NENG_EXPLORER + 'getblockhash?index=' + (promiseDataArray[0]);
        const currentChtaBlockHeight = CHTA_EXPLORER + 'getblockhash?index=' + (promiseDataArray[1]);

        // Getblockhash[index] and append to promise array after setting lower bounds
        const previousNengBlockHeightAtFourteenFourty = NENG_EXPLORER + 'getblockhash?index=' + (promiseDataArray[0] - 1440);
        const previousChtaBlockHeightAtSevenTwenty = CHTA_EXPLORER + 'getblockhash?index=' + (promiseDataArray[1] - 720);

        const getCurrentNengBlockHashAPI = fetch(currentNengBlockHeight).then(response => response.text());
        const getCurrentChtaBlockHashAPI = fetch(currentChtaBlockHeight).then(response => response.text());
        const getPreviousNengBlockHashAPI = fetch(previousNengBlockHeightAtFourteenFourty).then(response => response.text());
        const getPreviousChtaBlockHashAPI = fetch(previousChtaBlockHeightAtSevenTwenty).then(response => response.text());

        const blockHashArray = await Promise.all([getCurrentNengBlockHashAPI, getCurrentChtaBlockHashAPI, getPreviousNengBlockHashAPI, getPreviousChtaBlockHashAPI]);

        // Getblock[hash] info -->Return json/text with info relevant to median timestamp; Note: timestamp with attribute time is based on the miner's time and will have variation between block solves.
        const currentNengBlockHash = NENG_EXPLORER + 'getblock?hash=' + blockHashArray[0];
        const currentChtaBlockHash = CHTA_EXPLORER + 'getblock?hash=' + blockHashArray[1];
        const previousNengBlockHash = NENG_EXPLORER + 'getblock?hash=' + blockHashArray[2];
        const previousChtaBlockHash = CHTA_EXPLORER + 'getblock?hash=' + blockHashArray[3];

        const timeRegEx = (/"mediantime": \d+/i);
        const filterLetterRegEx = (/\D/g);

        const getCurrentNengBlockHashInfoAPI = fetch(currentNengBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));
        const getCurrentChtaBlockHashInfoAPI = fetch(currentChtaBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));
        const getPreviousNengBlockHashInfoAPI = fetch(previousNengBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));
        const getPreviousChtaBlockHashInfoAPI = fetch(previousChtaBlockHash).then(response => response.text()).then(extractTime => extractTime.match(timeRegEx)).then(keepNumbers => keepNumbers.toString().replace(filterLetterRegEx, ''));

        const filteredTimeArray = await Promise.all([getCurrentNengBlockHashInfoAPI, getCurrentChtaBlockHashInfoAPI, getPreviousNengBlockHashInfoAPI, getPreviousChtaBlockHashInfoAPI]);

        // Take one full day estimate of Neng Block and divide against 2.1 million (halving) / Chta Block 1.05 million
        const nengTimeLastFourteenFortyBlocks = Math.round(((filteredTimeArray[0] - filteredTimeArray[2]) / 60));
        const chtaTimeLastSevenTwentyBlocks = Math.round(((filteredTimeArray[1] - filteredTimeArray[3]) / 60));
        let nengHalvingTimeEstimate = 0;
        let chtaHalvingTimeEstimate = 0;
        let numOfNengHalvingEvents = 0;
        let numOfChtaHalvingEvents = 0;

        // Estimate amount of time until next halving event on the Neng Block Chain based on time to solve a full 1440 neng blocks
        if ((promiseDataArray[0] % NENG_HALVING_HEIGHT) != 0) {
            numOfNengHalvingEvents = Math.ceil(promiseDataArray[0] / NENG_HALVING_HEIGHT);
            nengHalvingTimeEstimate = ((((numOfNengHalvingEvents * NENG_HALVING_HEIGHT) - promiseDataArray[0]) / NENG_BLOCK_TIME_DAY) * nengTimeLastFourteenFortyBlocks) / 1440;
        }
        else {
            nengHalvingTimeEstimate = ((NENG_HALVING_HEIGHT / NENG_BLOCK_TIME_DAY) * nengTimeLastFourteenFortyBlocks) / 1440;
        }

        // Estimate amount of time until next halving event on the Chta Block Chain based on time to solve a full 720 chta blocks converted to days
        if ((promiseDataArray[1] % CHTA_HALVING_HEIGHT) != 0) {
            numOfChtaHalvingEvents = Math.ceil(promiseDataArray[1] / CHTA_HALVING_HEIGHT);
            chtaHalvingTimeEstimate = ((((numOfChtaHalvingEvents * CHTA_HALVING_HEIGHT) - promiseDataArray[1]) / CHTA_BLOCK_TIME_DAY) * chtaTimeLastSevenTwentyBlocks) / 1440;
        }
        else {
            chtaHalvingTimeEstimate = ((CHTA_HALVING_HEIGHT / CHTA_BLOCK_TIME_DAY) * chtaTimeLastSevenTwentyBlocks) / 1440;
        }

        interaction.editReply('Next Neng Halving event will occur in: ' + Math.round(nengHalvingTimeEstimate) + ' days' + '\n\nNext Chta Halving event will occur in: ' + Math.round(chtaHalvingTimeEstimate) + ' days');
    }
};
