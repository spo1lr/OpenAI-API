const express = require('express');
const router = express.Router();
const axios = require('axios');
const {WebClient} = require('@slack/web-api');
const {getSpreadsheetValues} = require("../provider/spreadsheet");
const {calculateKeywordSimilarity} = require("../provider/levenshtein");

router.get('/', (req, res, next) => {
    res.status(200).send('ok');
});

router.post('/sheets', async (req, res, next) => {
    const values = await getSpreadsheetValues('sheetId', 'range');

    const testKeywords = ['키워드1', '키워드2', '키워드3', '키워드4', '키워드5'];

    const sheets = values.map((array) => {
        return {
            title: array[0],
            text: array[1].replace(/\s+/g, ' ').trim(),
            keywords: array.slice(2, 7),
            similarity: 0
        };
    });

    let data = calculateKeywordSimilarity(sheets, testKeywords);
    const mostSimilar = data.reduce((maxObject, object) => object.field > maxObject.field ? object : maxObject);

    res.status(200).send('ok');
});


router.post('/chat', async (req, res, next) => {

    const slackEvent = req.body;

    if (req.headers['x-slack-retry-num'] || slackEvent?.event?.bot_id) return res.status(200).send('OK');

    if ('challenge' in slackEvent) {
        return res.status(200).json({challenge: slackEvent.challenge});
    }

    if ('event' in slackEvent) {
        const eventType = slackEvent.event.type;
        const response = await eventHandler(eventType, slackEvent);
        return res.status(200).send(response);
    }

    return res.status(404).send('There are no slack request events');
});


const eventHandler = async (eventType, slackEvent) => {

    const client = new WebClient(process.env.SLACK_TOKEN, {
        retryConfig: {retries: 0}
    });

    const channel = slackEvent.event.channel;
    const channelType = slackEvent.event.channel_type;
    const thread_ts = slackEvent.event.thread_ts;
    const ts = slackEvent.event.ts;

    try {
        if (eventType === 'app_mention' || (eventType === 'message' && channelType === 'im')) {

            const threadReplies = await client.conversations.replies({
                channel: channel,
                ts: thread_ts ?? ts,
            });

            let output = [];
            if (threadReplies.length !== 0) {
                output = threadReplies.messages.map(message => {
                    const role = message.bot_id ? 'assistant' : 'user';
                    const content = message.text.replace(/<@.*?>/g, '');
                    return {role, content};
                });
            }

            // const userQuery = slackEvent.event.blocks[0].elements[0].elements[1].text;
            const answer = await openAi(output);

            await client.chat.postMessage({
                channel: channel, text: answer, thread_ts: ts
            });
            return 'ok';
        }
    } catch (error) {
        console.error(error);
    }

    return `[${eventType}] cannot find event handler`;
}


const openAi = async (query) => {
    let resMessage = '';
    try {
        // OPENAI 통신
        const content = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo-0301', messages: query, temperature: 1
        }, {
            headers: {
                'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`
            },
        });
        resMessage = content.data.choices[0].message.content;
    } catch (err) {
        console.error(err);
        resMessage = 'OPEN AI와의 통신이 실패되었습니다.';
    }
    return resMessage;
}


module.exports = router;