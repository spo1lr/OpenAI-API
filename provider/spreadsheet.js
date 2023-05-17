const {google} = require('googleapis');
const {client_email, private_key} = require('../credentials.json');

async function getSpreadsheetValues(spreadsheetId, range) {
    const authorize = new google.auth.JWT(client_email, null, private_key, [
        'https://www.googleapis.com/auth/spreadsheets'
    ]);

    const googleSheet = google.sheets({
        version: 'v4',
        auth: authorize,
    });

    const response = await googleSheet.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    return response.data.values;
}

module.exports = {
    getSpreadsheetValues,
};