// Import the Vercel Postgres client
const { sql } = require('@vercel/postgres');

// API endpoint to fetch all sections and subjects data
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch sections data
    const sectionsResult = await sql`SELECT * FROM sections ORDER BY section, field`;
    
    // Fetch subjects data
    const subjectsResult = await sql`SELECT * FROM subjects ORDER BY category, name`;

    // Return combined data
    return res.status(200).json({
      sections: sectionsResult.rows,
      subjects: subjectsResult.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Failed to fetch data from database' });
  }
}
