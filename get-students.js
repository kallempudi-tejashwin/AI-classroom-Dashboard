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
    const studentsCollection = db.collection('students');

    // Find all documents in the 'students' collection
    const students = await studentsCollection.find({}).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(students),
    };
  } catch (error) {
    console.error('Error fetching students:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Failed to fetch students' }) };
  }
};