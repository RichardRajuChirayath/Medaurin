import { NextRequest, NextResponse } from "next/server";
import playwright from "playwright-core";
import chromium from "@sparticuz/chromium";

// Force Node.js runtime since Playwright doesn't work in Edge runtime
export const runtime = 'nodejs';

// Define the structure of the expected request body
interface AnalysisResult {
  status: "safe" | "caution" | "danger";
  score: number;
  medicines: string[];
  interactions: {
    from: string;
    to: string;
    severity: "high" | "moderate" | "low" | "unknown";
    description: string;
  }[];
  recommendations: string[];
}

// Function to generate HTML from the analysis result
function generateHTML(result: AnalysisResult): string {
  const statusStyles = {
    safe: { backgroundColor: "#e6fffa", color: "#006d5b" },
    caution: { backgroundColor: "#fffbe6", color: "#8a6d3b" },
    danger: { backgroundColor: "#fff0f0", color: "#a94442" },
  };

  const statusStyle = statusStyles[result.status];

  const severityColors = {
    high: "#d32f2f",
    moderate: "#f57c00",
    low: "#1976d2",
    unknown: "#757575"
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Medicine Interaction Report</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #fff;
            padding: 40px;
            font-size: 14px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            font-size: 28px;
            color: #111;
            margin: 0;
          }
          h2 {
            font-size: 20px;
            color: #222;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-top: 30px;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 30px;
          }
          .pill {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 15px;
            background-color: #eee;
            margin: 0 5px 5px 0;
            font-size: 13px;
          }
          .interaction-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
          }
          .severity-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            color: white;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .recommendation-list {
            padding-left: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
          .status-box {
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
            text-transform: uppercase;
            background-color: ${statusStyle.backgroundColor};
            color: ${statusStyle.color};
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Medicine Interaction Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2>Analysis Summary</h2>
          <div class="status-box">${result.status}</div>
          <p style="text-align: center; margin-top: 10px; font-size: 16px;">
            Risk Score: <strong>${result.score} / 100</strong>
          </p>
        </div>

        <div class="section">
          <h2>Medicines Analyzed</h2>
          <div>
            ${result.medicines.map(med => `<span class="pill">${med}</span>`).join('')}
          </div>
        </div>

        ${result.interactions.length > 0 ? `
          <div class="section">
            <h2>Potential Interactions</h2>
            ${result.interactions.map(interaction => `
              <div class="interaction-card">
                <span class="severity-badge" style="background-color: ${severityColors[interaction.severity] || severityColors.unknown}">
                  ${interaction.severity} Risk
                </span>
                <p><strong>Interaction between:</strong> ${interaction.from} & ${interaction.to}</p>
                <p><strong>Details:</strong> ${interaction.description}</p>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section">
          <h2>Recommendations</h2>
          <ul class="recommendation-list">
            ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          <p>
            Disclaimer: This report is generated based on publicly available FDA data and is for informational purposes only. 
            It is not a substitute for professional medical advice. Always consult with a qualified healthcare provider 
            before making any decisions about your health or medications.
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[PDF] Received PDF generation request')
    const body: AnalysisResult = await request.json();
    console.log('[PDF] Request body:', JSON.stringify(body, null, 2))

    // Generate the HTML string
    const html = generateHTML(body);
    console.log('[PDF] HTML generated, length:', html.length)

    // Launch a headless browser instance
    // In development, try to use system Chrome/Edge first
    // In production (Vercel/Lambda), use @sparticuz/chromium
    const isDev = process.env.NODE_ENV === 'development';

    let browserLaunchOptions: any = {
      headless: true,
    };

    if (isDev) {
      // Try to use system Chrome/Edge on Windows for faster startup
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      ];

      // Check if any of these browsers exist
      const fs = await import('fs');
      let foundPath = undefined;
      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          foundPath = path;
          console.log(`Using system browser: ${foundPath}`);
          break;
        }
      }

      if (foundPath) {
        browserLaunchOptions.executablePath = foundPath;
      }
      // If no system browser found, playwright will try to use its own
      browserLaunchOptions.args = [];
    } else {
      // Production: use @sparticuz/chromium
      browserLaunchOptions.args = chromium.args;
      browserLaunchOptions.executablePath = await chromium.executablePath();
    }

    const browser = await playwright.chromium.launch(browserLaunchOptions);
    console.log('[PDF] Browser launched successfully')

    const page = await browser.newPage();
    console.log('[PDF] New page created')

    // Set the HTML content of the page
    await page.setContent(html, { waitUntil: "networkidle" });
    console.log('[PDF] HTML content set')

    // Generate the PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });
    console.log('[PDF] PDF generated, size:', pdf.length, 'bytes')

    await browser.close();
    console.log('[PDF] Browser closed')

    // Convert the Node.js Buffer to a Uint8Array, which is a standard format
    // that NextResponse can handle without type conflicts.
    const uint8Array = new Uint8Array(pdf);

    // Return the PDF as a response
    console.log('[PDF] Sending PDF response')
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="medicine-interaction-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    console.error("Error stack:", errorStack);

    return NextResponse.json(
      {
        error: "Failed to generate PDF report.",
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
