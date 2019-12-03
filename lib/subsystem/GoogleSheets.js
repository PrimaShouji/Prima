const fs         = require("fs");
const readline   = require("readline");
const { google } = require("googleapis");
const path       = require("path");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// The file token.json stores the user"s access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, "../../token.json");

const CREDENTIALS_PATH = path.join(__dirname, "../../credentials.json");

class GoogleSheets {
    constructor() {
        this.init = this.setOAuth2();
    }

    async doFunction(callback) {
        await this.init;
        callback(this.sheets);
    }

    async getSpreadsheet(spreadsheetId, range) {
        return new Promise((resolve, reject) => {
            this.doFunction((sheets) => {
                sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range,
                }, (err, res) => {
                    if (err) reject(err);
                    resolve(res);
                });
            });
        });
    }

    async getAPI() {
        await this.init;
        return this.sheets;
    }

    setOAuth2() {
        return new Promise((resolve, reject) => {
            // Load client secrets from a local file.
            fs.readFile(CREDENTIALS_PATH, (err, content) => {
                if (err) reject(`Error loading client secret file: ${err}`);
                // Authorize a client with credentials, then call the Google Sheets API.
                resolve(this.authorize(JSON.parse(content)));
            });
        });
    }

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     */
    authorize(credentials) {
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(
            client_id, client_secret, redirect_uris[0]);

        // Check if we have previously stored a token, and if not then generate one.
        return new Promise((resolve) => {
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) {
                    this.getNewToken(oAuth2Client, (newOAuth2Client) => {
                        console.log("Token created!");
                        this.sheets = google.sheets({version: "v4", auth: newOAuth2Client});
                        resolve();
                    });
                } else {
                    oAuth2Client.setCredentials(JSON.parse(token));
                    this.sheets = google.sheets({version: "v4", auth: oAuth2Client});
                    resolve();
                }
            });
        });
    }

    /**
     * Get and store new token after prompting for user authorization, and then
     * execute the given callback with the authorized OAuth2 client.
     * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
     * @param {getEventsCallback} callback The callback for the authorized client.
     */
    getNewToken(oAuth2Client, callback) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });
        console.log("Authorize this app by visiting this url:", authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("Enter the code from that page here: ", (code) => {
            rl.close();
            oAuth2Client.getToken(code, (err, token) => {
                if (err) return console.error("Error while trying to retrieve access token", err);
                oAuth2Client.setCredentials(token);
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) return console.error(err);
                    console.log("Token stored to", TOKEN_PATH);
                    callback(oAuth2Client);
                });
            });
        });
    }
}

module.exports = GoogleSheets;
