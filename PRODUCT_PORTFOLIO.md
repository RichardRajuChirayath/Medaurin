# MEDAURIN
**The Global Medicine Safety Platform with Local Intelligence**

## Product Identity
**One-Liner:** A universally applicable clinical safety engine that bridges the gap between global medical standards (FDA/RxNorm) and local market realities (e.g., Indian Brand Names).

## The "Global + Local" Architecture
Most safety checkers are either **too generic** (US-only data) or **too local** (unverified scraped data). MEDAURIN is the hybrid solution:
1.  **Global Foundation:** Built on the **US National Library of Medicine (NIH)** and **FDA** databases. This makes the core logic transferable to **any country** using standard RxNorm concepts.
2.  **Local Resolution Layer:** A specialized module that maps regional trade names (like "Dolo-650" in India) to their global generic equivalents ("Acetaminophen"), enabling world-class safety checks for local products.

---

## 🔐 Secure Magic Link Login
Designed for privacy and security:
*   **Passwordless Email Login:** Users receive a secure, one-time click link.
*   **Eliminates Password Risks:** Protects against password reuse and phishing.
*   **Ideal for Desktop:** Seamlessly manage heavy expense exports.

## 🛡️ Enterprise-Grade Security
*   **AES-256 Encryption:** All sensitive internal data (like IMAP credentials for expense tracking) is encrypted at rest using bank-grade AES-256-CBC.
*   **Active Session Management:**
    *   **Revocable Sessions:** Database-backed sessions allow users to remotely log out suspicious devices.
    *   **Device Fingerprinting:** Tracks IP, User-Agent, and Device Type for every login to detect anomalies.
*   **Privacy by Design:**
    *   **Client-Side AI:** OCR recognition happens in the browser or via transient streams. No personal image data is permanently stored for training.

---

## ⚙️ The Comprehensive Processing Pipeline
**A Deterministic "Zero-Trust" Workflow**

### Step 1: Omni-Channel Input
*   **Visual:** Camera scan or Image Upload (Prescriptions/Bills).
*   **Manual:** Text search with auto-complete.

### Step 2: Intelligent Extraction & Normalization
*   **OCR Engine (Tesseract):** Extracts raw text from images.
*   **Noise Filtering:** Removes non-medical text (prices, addresses) using regex patterns.
*   **Dual-Layer Resolution:**
    *   *Layer A (Global):* Direct match against RxNorm (e.g., "Ibuprofen").
    *   *Layer B (Local):* Fuzzy match against Indian Brand Database (e.g., "Combiflam").

### Step 3: Deterministic Validation
*   **The Guardrail:** If a medicine cannot be definitively resolved to a Clinical Concept ID (RxCUI), it is flagged as **"Unknown/Unverified"**. We **never** guess.

### Step 4: Multi-Dimensional Analysis
*   **Clinical Safety:** Checks **NIH Interaction API** for Drug-Drug conflicts (Severity: High/Mod/Low).
*   **Regulatory Check:** Verifies against **CDSCO Ban List** (India) and **FDA Recalls** (Global).
*   **Financial Check:** Compares price against **NPPA** caps (India) to detect overpricing.

### Step 5: Actionable Intelligence Output
*   **Visual Cards:** "Safe", "Monitor", or "Danger" status with color-coded alerts.
*   **Contextual Chatbot:** AI assistant ready to explain *why* a combination is dangerous.

---

## 💰 Integrated Health Finance (Expense Tracker)
*   **OCR Receipt Scanning:** Digitizes paper bills instantly.
*   **IMAP Email Sync:** Securely fetches digital invoices from Gmail/Outlook.
*   **Budgeting:** Monthly limits with push notification alerts (FCM).
*   **Pharmacy & Doctor Finder:** Uses **OpenStreetMap (OSM)** to locate verified pharmacies, clinics, and hospitals.

## Current Status
**Functional MVP:** Live, Scalable, and Compliant.
**Readiness:** Global Core ready for deployment; Local Layer currently tuned for India.

## Founder
**Richard Raju**
Founder & Product Engineer
