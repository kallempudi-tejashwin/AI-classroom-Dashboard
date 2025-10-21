import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

// This line loads the variables from your .env file into process.env
dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('The MONGODB_URI environment variable must be defined.');
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

/**
 * Connects to the MongoDB database and returns the database instance.
 * It uses a cached connection if one is already available.
 */
export async function connectToDatabase() {
  if (db) {
    return db;
  }

  await client.connect();
  console.log('Successfully connected to MongoDB Atlas!');

  // The database name is taken from your connection string.
  db = client.db();

  return db;
}