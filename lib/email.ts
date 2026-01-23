/**
 * Email Utility for Medaurin
 * Sends emails using Brevo API
 */

interface EmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: EmailOptions): Promise<boolean> {
    try {
        // Check if Brevo API key is configured
        if (!process.env.BREVO_API_KEY) {
            console.warn('[Email] BREVO_API_KEY not configured. Email not sent.');
            return false;
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": process.env.BREVO_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sender: {
                    email: process.env.EMAIL_FROM || "noreply@medaurin.com",
                    name: "Medaurin",
                },
                to: [{ email: to }],
                subject,
                htmlContent,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Email] Brevo API error:', errorText);
            return false;
        }

        console.log(`[Email] Successfully sent to ${to}`);
        return true;
    } catch (error) {
        console.error('[Email] Error sending email:', error);
        return false;
    }
}

/**
 * Send caregiver invitation email to patient
 */
export async function sendCaregiverInvitationEmail(
    patientEmail: string,
    caregiverName: string,
    appUrl: string
): Promise<boolean> {
    const subject = `${caregiverName} wants to be your caregiver on Medaurin`;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .icon { font-size: 48px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">🏥</div>
                    <h1 style="margin: 0;">Caregiver Request</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    
                    <p><strong>${caregiverName}</strong> has sent you a caregiver request on <strong>Medaurin</strong>.</p>
                    
                    <p>By accepting this request, <strong>${caregiverName}</strong> will be able to:</p>
                    <ul>
                        <li>📊 View your medication schedule</li>
                        <li>🔔 Receive alerts about missed doses</li>
                        <li>💊 Monitor your medication adherence</li>
                        <li>🛡️ Help ensure your medication safety</li>
                    </ul>
                    
                    <p><strong>To accept or reject this request:</strong></p>
                    <ol>
                        <li>Log in to your Medaurin account</li>
                        <li>Go to your Profile or Dashboard</li>
                        <li>Review the pending caregiver request</li>
                        <li>Accept or reject the request</li>
                    </ol>
                    
                    <div style="text-align: center;">
                        <a href="${appUrl}/login" class="button">Log In to Medaurin</a>
                    </div>
                    
                    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
                        <strong>Don't have an account?</strong><br>
                        You can create one using this email address to view and respond to the request.
                    </p>
                    
                    <p style="color: #666; font-size: 14px;">
                        If you did not expect this request, you can safely ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Medaurin - Medicine Safety & Expense Tracker</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail({
        to: patientEmail,
        subject,
        htmlContent,
    });
}
