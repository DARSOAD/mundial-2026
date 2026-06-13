# ⚽ Mundial 2026 Family Predictor - Design Document

## 1. Overview
A low-cost, high-performance web application for family football predictions during the 2026 World Cup. Built to run on AWS with near-zero operating costs using static hosting and serverless components.

## 2. Architecture (The "Static-Dynamic" Model)
*   **Frontend:** Next.js (TypeScript) + Tailwind CSS.
*   **Deployment:** Static export (`output: export`) hosted on **AWS S3** and distributed via **CloudFront**.
*   **Database:** **AWS DynamoDB** (Provisioned mode: 1 RCU / 1 WCU) to stay within the Always Free Tier.
*   **Backend/Automation:** 
    *   **AWS Lambda** triggered by **EventBridge** (Cron) every 5-10 minutes during match windows.
    *   Consults **API-Football** (RapidAPI) for live results.
    *   Updates DynamoDB and regenerates a static `live_scores.json` and `predictions.json` in S3 for fast frontend reads.

## 3. Scoring System
### Match Points (Group & Knockout Phases)
*   **Exact Result:** 3 pts.
*   **Winner/Draw (Wrong Score):** 1 pt.
*   **Regional Bonuses (Exact Result Multipliers):**
    *   **Colombia 🇨🇴 Matches:** 5 pts for exact result.
    *   **South American Teams:** 4 pts for exact result.

### Final Standings Points (Awarded at Tournament End)
*   **Champion (1st):** 9 pts.
*   **Runner-up (2nd):** 6 pts.
*   **3rd Place:** 3 pts.
*   **4th Place:** 3 pts.

## 4. User Experience & Security
*   **Public Access:** Dashboard and Leaderboard are public (Read-only).
*   **Simple Authentication:** Users select their name and enter a **simple password** stored in DynamoDB to edit their predictions. No complex JWT/Auth needed.
*   **Phased Knockouts:** Predictions for the Round of 32, 16, etc., are enabled by the Admin phase-by-phase as teams qualify.
*   **Automatic Lock:** Individual match predictions lock 5 minutes before the actual kickoff time.

## 5. Admin Features (`/admin`)
*   **Data Correction:** Full CRUD access to edit any user's prediction to fix entry errors.
*   **Phase Management:** Buttons to toggle availability of knockout stage forms.
*   **Sync Control:** Manual trigger to refresh scores from the API and rebuild static JSON files.
*   **Missing Data Warnings:** Visual indicators highlighting which users have `null` or missing predictions (Group stage, Finals, or current Knockout phase).

## 6. Implementation Phases
1.  **Phase 1: Database & Migration:** Setup DynamoDB and migrate existing data from `public/predicciones.json`.
2.  **Phase 2: Core Frontend:** Build the Leaderboard, Match views, and Simple Auth.
3.  **Phase 3: Live Sync & Logic:** Implement the Lambda function and the scoring engine.
4.  **Phase 4: Admin Panel & AWS Deployment:** Build the admin interface and setup S3/CloudFront.
