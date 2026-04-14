# Intelligent Verification Platform

A hybrid web application designed for a "Self-Service Verification Ecosystem," utilizing AI (OCR) to automate local certificate applications.

---

## 🛠️ Setup Instructions

Follow these steps to get the project running on your computer:

1. **Install Prerequisites**
   Ensure you have [Node.js](https://nodejs.org/) installed (LTS version recommended).

2. **Install Dependencies**
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   - Rename `.env.example` to `.env.local`.
   - Add your Firebase project credentials to the file (optional for initial local run).

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **View the Application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database/Auth:** [Firebase](https://firebase.google.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Logic:** AI Service Layer for OCR & Verification (Refer to `tools/Purpose.md`)
