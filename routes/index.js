const express = require('express');
const router = express.Router();
const axios = require('axios');
const {WebClient} = require('@slack/web-api');

router.get('/', (req, res, next) => {
    res.status(200).send('ok');
});

router.post('/chat', async (req, res, next) => {

    const slackEvent = req.body;
    if (req.headers['x-slack-retry-num']) return res.status(200).send('OK');

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

    const channel = slackEvent.event.channel;   // Channel
    const thread_ts = slackEvent.event.ts;      // Thread
    const client = new WebClient(process.env.SLACK_TOKEN);

    try {
        if (eventType === 'app_mention') {
            const userQuery = slackEvent.event.blocks[0].elements[0].elements[1].text;
            const answer = await openAi(userQuery);

            await client.chat.postMessage({
                channel: channel, text: answer, thread_ts: thread_ts
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
            model: 'gpt-3.5-turbo', messages: [{role: 'user', content: query}], temperature: 0.7
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
