// Import the Vercel Postgres client
const { sql } = require('@vercel/postgres');

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, id, category, name, description } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing required action field' });
    }

    switch (action) {
      case 'add':
        // Validate fields
        if (!category || !name || !description) {
          return res.status(400).json({ error: 'Missing required fields for adding a subject' });
        }

        // Insert new subject
        await sql`
          INSERT INTO subjects (category, name, description)
          VALUES (${category}, ${name}, ${description})
        `;
        break;

      case 'edit':
        // Validate fields
        if (!id || !category || !name || !description) {
          return res.status(400).json({ error: 'Missing required fields for editing a subject' });
        }

        // Update existing subject
        await sql`
          UPDATE subjects 
          SET category = ${category}, name = ${name}, description = ${description}
          WHERE id = ${id}
        `;
        break;

      case 'delete':
        // Validate fields
        if (!id) {
          return res.status(400).json({ error: 'Missing required ID field for deleting a subject' });
        }

        // Delete subject
        await sql`
          DELETE FROM subjects
          WHERE id = ${id}
        `;
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing subject operation:', error);
    return res.status(500).json({ error: 'Failed to process subject operation' });
  }
}
