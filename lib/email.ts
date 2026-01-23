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
        <div style="font-family: 'Outfit', 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc; color: #0f172a;">
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="${appUrl}/logo.png" alt="Medaurin Logo" style="width: 80px; height: 80px; margin-bottom: 12px;" />
                <div style="font-size: 32px; font-weight: 900; color: #7c3aed; letter-spacing: -1px; margin-bottom: 8px;">
                    Medaurin
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; tracking: 2px;">
                    Guardian Support System
                </div>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 24px; text-align: center;">
                    Caregiver Request
                </h1>
                
                <p style="font-size: 16px; line-height: 24px; color: #475569; margin-bottom: 24px;">
                    Hello, <br /><br />
                    <strong>${caregiverName}</strong> has sent you a secure caregiver request on <strong>Medaurin</strong>.
                </p>

                <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
                    <p style="font-size: 14px; font-weight: 800; color: #475569; text-transform: uppercase; margin-top: 0; margin-bottom: 12px;">Permissions Included:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 15px; line-height: 22px;">
                        <li>View your medication schedule</li>
                        <li>Receive alerts for missed doses</li>
                        <li>Monitor health safety profiles</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="${appUrl}/login" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 18px 48px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 18px; box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);">
                        Review Request
                    </a>
                </div>

                <p style="font-size: 14px; color: #94a3b8; font-weight: 500; text-align: center; margin-bottom: 0;">
                    Don't have an account? You can create one during login using this email.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; font-weight: 500;">
                &copy; ${new Date().getFullYear()} Medaurin. Protecting lives with intelligence.
                <br />
                If you did not expect this request, you can safely ignore this email.
            </div>
        </div>
    `;

    return sendEmail({
        to: patientEmail,
        subject,
        htmlContent,
    });
}
