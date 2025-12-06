import React from "react";

// Define the structure of the analysis result
interface AnalysisResult {
  status: "safe" | "caution" | "danger";
  score: number;
  medicines: string[];
  interactions: {
    from: string;
    to: string;
    reasonFromFDA: string;
  }[];
  recommendations: string[];
}

interface ReportTemplateProps {
  result: AnalysisResult;
}

// Inline styles for the PDF report
const styles = {
  body: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: 1.6,
    color: "#333",
    backgroundColor: "#fff",
    padding: "40px",
    fontSize: "14px",
  },
  header: {
    textAlign: "center" as const,
    borderBottom: "2px solid #eee",
    paddingBottom: "20px",
    marginBottom: "30px",
  },
  h1: {
    fontSize: "28px",
    color: "#111",
    margin: 0,
  },
  h2: {
    fontSize: "20px",
    color: "#222",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    marginTop: "30px",
    marginBottom: "20px",
  },
  section: {
    marginBottom: "30px",
  },
  pill: {
    display: "inline-block",
    padding: "5px 12px",
    borderRadius: "15px",
    backgroundColor: "#eee",
    margin: "0 5px 5px 0",
    fontSize: "13px",
  },
  interactionCard: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    backgroundColor: "#f9f9f9",
  },
  recommendationList: {
    paddingLeft: "20px",
  },
  footer: {
    marginTop: "40px",
    textAlign: "center" as const,
    fontSize: "12px",
    color: "#777",
    borderTop: "1px solid #eee",
    paddingTop: "20px",
  },
  statusBox: {
    padding: "15px",
    borderRadius: "8px",
    textAlign: "center" as const,
    fontWeight: "bold" as const,
    fontSize: "18px",
    textTransform: "uppercase" as const,
  },
  statusSafe: { backgroundColor: "#e6fffa", color: "#006d5b" },
  statusCaution: { backgroundColor: "#fffbe6", color: "#8a6d3b" },
  statusDanger: { backgroundColor: "#fff0f0", color: "#a94442" },
};

const getStatusStyle = (status: "safe" | "caution" | "danger") => {
  if (status === "danger") return styles.statusDanger;
  if (status === "caution") return styles.statusCaution;
  return styles.statusSafe;
};

export const ReportTemplate: React.FC<ReportTemplateProps> = ({ result }) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <title>Medicine Interaction Report</title>
    </head>
    <body style={styles.body}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Medicine Interaction Report</h1>
        <p>Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.h2}>Analysis Summary</h2>
        <div style={{ ...styles.statusBox, ...getStatusStyle(result.status) }}>
          {result.status}
        </div>
        <p style={{ textAlign: "center", marginTop: "10px", fontSize: "16px" }}>
          Risk Score: <strong>{result.score} / 100</strong>
        </p>
      </div>

      <div style={styles.section}>
        <h2 style={styles.h2}>Medicines Analyzed</h2>
        <div>
          {result.medicines.map((med) => (
            <span key={med} style={styles.pill}>{med}</span>
          ))}
        </div>
      </div>

      {result.interactions.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.h2}>Potential Interactions</h2>
          {result.interactions.map((interaction, index) => (
            <div key={index} style={styles.interactionCard}>
              <p>
                <strong>Interaction between:</strong> {interaction.from} & {interaction.to}
              </p>
              <p>
                <strong>Details:</strong> {interaction.reasonFromFDA}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.h2}>Recommendations</h2>
        <ul style={styles.recommendationList}>
          {result.recommendations.map((rec, index) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>

      <div style={styles.footer}>
        <p>
          Disclaimer: This report is generated based on publicly available FDA data and is for informational purposes only. It is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before making any decisions about your health or medications.
        </p>
      </div>
    </body>
  </html>
);
