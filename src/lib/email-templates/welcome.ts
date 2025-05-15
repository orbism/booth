/**
 * Generate welcome email HTML for new users
 */
export function generateWelcomeEmail({
  name,
  loginUrl,
  dashboardUrl,
  trialEndDate,
}: {
  name: string;
  loginUrl: string;
  dashboardUrl: string;
  trialEndDate: Date;
}) {
  // Format trial end date
  const trialEndFormatted = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(trialEndDate);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to BoothBuddy!</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #3B82F6;
          padding: 20px;
          text-align: center;
          color: white;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #ffffff;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background-color: #3B82F6;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #6b7280;
        }
        .feature-list {
          margin: 20px 0;
        }
        .feature-list li {
          margin-bottom: 10px;
        }
        .trial-notice {
          background-color: #fef3c7;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          border-left: 4px solid #f59e0b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BoothBuddy!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name},</h2>
          
          <p>Thank you for signing up for BoothBuddy! We're excited to have you on board and can't wait to help you create amazing photo booth experiences.</p>
          
          <p>Your account is now set up and ready to go. You're currently on a <strong>Free Trial</strong> which ends on <strong>${trialEndFormatted}</strong>.</p>
          
          <div class="trial-notice">
            <p><strong>Free Trial Details:</strong></p>
            <ul>
              <li>5 media items (photos/videos)</li>
              <li>5 emails</li>
              <li>10-second maximum video duration</li>
              <li>1-day trial period</li>
            </ul>
          </div>
          
          <p>Here's what you can do now:</p>
          
          <div class="feature-list">
            <ol>
              <li><strong>Log in to your account</strong> and set up your booth experience</li>
              <li><strong>Create your first event</strong> and customize its look and feel</li>
              <li><strong>Set up your custom URL</strong> to make it easy for guests to access your booth</li>
              <li><strong>Explore subscription options</strong> to unlock more features when you're ready</li>
            </ol>
          </div>
          
          <p>To get started, click the button below to log in to your account:</p>
          
          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Log In to Your Account</a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team by replying to this email.</p>
          
          <p>Best regards,<br>The BoothBuddy Team</p>
        </div>
        
        <div class="footer">
          <p>This email was sent to you because you signed up for BoothBuddy. If you did not create this account, please <a href="${loginUrl}">contact us</a>.</p>
          <p>© ${new Date().getFullYear()} BoothBuddy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 