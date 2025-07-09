// Import the Vercel Postgres client and SendGrid
const { sql } = require('@vercel/postgres');
const sgMail = require('@sendgrid/mail');

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, date, time, message } = req.body;

    // Validate required fields
    if (!name || !email || !date || !time) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    // Insert booking into database
    await sql`
      INSERT INTO bookings (name, email, date, time, message)
      VALUES (${name}, ${email}, ${date}, ${time}, ${message || ''})
    `;

    // Set up SendGrid
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('SendGrid API key not found, skipping email notifications');
      return res.status(200).json({ 
        success: true, 
        emailSent: false,
        message: 'Booking saved but email notifications were not sent due to missing API key'
      });
    }

    sgMail.setApiKey(apiKey);

    // Get admin and from email addresses from environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = process.env.FROM_EMAIL;

    if (!adminEmail || !fromEmail) {
      console.warn('Email addresses not configured, skipping email notifications');
      return res.status(200).json({
        success: true,
        emailSent: false,
        message: 'Booking saved but email notifications were not sent due to missing email configuration'
      });
    }

    // Format date and time for readability
    const bookingDate = new Date(date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create email to admin
    const adminMsg = {
      to: adminEmail,
      from: fromEmail,
      subject: `New Tuition Consultation Booking: ${name}`,
      html: `
        <h2>New Booking Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Message:</strong> ${message || 'No message provided'}</p>
      `
    };

    // Create confirmation email to user
    const userMsg = {
      to: email,
      from: fromEmail,
      subject: 'Your Tuition Consultation Booking Confirmation',
      html: `
        <h2>Booking Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Thank you for booking a tuition consultation with us. We have received your request for:</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p>We will review your booking and contact you shortly to confirm the appointment.</p>
        <p>If you have any questions, please reply to this email or call us.</p>
        <p>Best regards,<br>Expert Tuition Services</p>
      `
    };

    try {
      // Send both emails
      await sgMail.send([adminMsg, userMsg]);
      return res.status(200).json({ success: true, emailSent: true });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Still return success since the booking was saved
      return res.status(200).json({
        success: true,
        emailSent: false,
        message: 'Booking saved but there was an error sending email notifications'
      });
    }
  } catch (error) {
    console.error('Error processing booking:', error);
    return res.status(500).json({ error: 'Failed to process booking' });
  }
}
