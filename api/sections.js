// Import the Vercel Postgres client
const { sql } = require('@vercel/postgres');

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { section, field, content, checkPassword, password } = req.body;

    // For password verification
    if (checkPassword) {
      // Verify against environment variable
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword || password !== adminPassword) {
        return res.status(401).json({ success: false });
      }
      
      return res.status(200).json({ success: true });
    }

    // For content updates
    if (!section || !field || content === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the section/field combination exists
    const existingEntry = await sql`
      SELECT * FROM sections 
      WHERE section = ${section} AND field = ${field}
    `;

    if (existingEntry.rowCount > 0) {
      // Update existing entry
      await sql`
        UPDATE sections 
        SET content = ${content} 
        WHERE section = ${section} AND field = ${field}
      `;
    } else {
      // Insert new entry
      await sql`
        INSERT INTO sections (section, field, content)
        VALUES (${section}, ${field}, ${content})
      `;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating section:', error);
    return res.status(500).json({ error: 'Failed to update section' });
  }
}
