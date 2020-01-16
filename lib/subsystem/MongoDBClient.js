const { MongoClient } = require("mongodb");

const DB_URL = "mongodb://localhost:27017/";

class MongoDBClient {
    constructor(client) {
        client.dbName = "prima_db";
        client.db = MongoClient.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    }
}

module.exports = MongoDBClient;
