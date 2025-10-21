import { connectToDatabase } from '../../src/db/connect.js';

export const handler = async (event) => {
  // We only want to handle POST requests to this endpoint
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  try {
    // Parse the incoming student data from the request body
    const newStudent = JSON.parse(event.body);

    // Connect to our database
    const db = await connectToDatabase();

    // Get the 'students' collection
    const studentsCollection = db.collection('students');

    // Insert the new student document
    const result = await studentsCollection.insertOne(newStudent);

    // Return a 201 Created response with the inserted document's ID
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Student added successfully!',
        insertedId: result.insertedId,
      }),
    };
  } catch (error) {
    console.error('Error adding student:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to add student.' }),
    };
  }
};