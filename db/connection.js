const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

async function connect() {
  try {
    await client.connect();
    db = client.db("InTouchDB");
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connect() first.");
  }
  return db;
}

module.exports = {
  connect,
  getDb
};
