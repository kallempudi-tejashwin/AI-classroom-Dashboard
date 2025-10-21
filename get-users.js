import { connectToDatabase } from '../../src/db/connect.js';

export const handler = async (event) => {
  // We only want to handle GET requests to this endpoint
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'GET' },
    };
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find all documents in the 'users' collection
    const usersFromDB = await usersCollection.find({}).toArray();

    // IMPORTANT: Ensure the `id` field is consistent for the frontend.
    // If a document has a custom `id` (like 'DEV001'), use it.
    // Otherwise, use the MongoDB `_id` as the `id`.
    const users = usersFromDB.map(user => {
      return { ...user, id: user.id || user._id.toString() };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to fetch users' }) };
  }
};
