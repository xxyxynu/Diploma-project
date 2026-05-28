<div align="center">
  <h1>🌱 EcoCart</h1>
  <p><b>A Smart Zero-Waste Household Management & Community Sharing Platform</b></p>
  
  [![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
</div>

<br/>

## 📖 Overview

**EcoCart** is a production-grade, full-stack mobile ecosystem developed as a Diploma Project. It aims to tackle the global food waste crisis and mitigate household economic inflation (with a localized focus on Kazakhstan). 

By converging **Generative AI (LLMs)**, **Computer Vision (OCR)**, and **Location-Based Services (LBS)**, EcoCart transforms passive digital inventory tracking into an active, gamified, and privacy-preserving zero-waste lifestyle loop: *Buy ➔ Store ➔ Consume ➔ Share*.

## ✨ Core Features

### 📸 1. Multimodal Intelligent Document Processing (IDP)
* **AI Receipt Scanner:** Ditch manual data entry. Take a photo of a supermarket receipt (e.g., Magnum, Small), and the system uses `OCR.space API` to extract raw Cyrillic/Latin text.
* **LLM Semantic Middleware:** The raw text is passed to `GPT-4o-mini` with strict Prompt Engineering to filter out non-food items (e.g., plastic bags), translate Russian/Kazakh to English, and force a deterministic JSON output for batch database insertion.

### 👨‍🍳 2. Context-Aware AI Chef & Meal Planner
* **Zero-Waste Recipes:** Select expiring ingredients from the fridge, and the AI generates customized, structured recipes.
* **Dietary Enforcement:** The AI strictly respects user profiles (e.g., Halal, Vegan, Nut-Free) to prevent hazardous AI "hallucinations".
* **Auto-Weekly Planner:** Generates a full 21-meal 7-day schedule based on current fridge inventory.

### 🌍 3. Privacy-First Community Share (LBS)
* **UNILO Spatial Cloaking:** Users can share surplus food with neighbors. To protect residential privacy, exact coordinates are mathematically obfuscated. The public feed only displays a 500m "Probability Circle" using MongoDB's `2dsphere` spatial indexing.
* **Zero-Trust State Machine:** Exact addresses are cryptographically locked and only revealed after a formal Request ➔ Approve handshake.
* **Smart Contact:** Deep linking integration automatically opens **2GIS** for navigation and **WhatsApp** with pre-filled greeting messages.

### 📊 4. ESG Impact Dashboard & Gamification
* **Real-time Telemetry:** Every consumed or shared item calculates avoided CO₂ emissions (kg) and financial savings (KZT) based on dynamic food category coefficients.
* **Data Visualization:** Built-in `react-native-chart-kit` renders beautiful Bezier line charts (Points Growth) and progress rings (Zero-Waste Efficiency).

### 🌐 5. Seamless Localization (i18n)
* **Triple Language Support:** Instant, zero-latency switching between English, Russian, and Kazakh utilizing a pure `Zustand` state-driven dictionary pattern.

| Impact Dashboard | Expiration Reminder | Community Share | AI Weekly Planner |
|:---:|:---:|:---:|:---:|
| <img width="200" alt="photo_2026-04-14_10-06-45" src="https://github.com/user-attachments/assets/af39a5ca-a51e-4092-9ee1-508b034b967c" /> | <img width="200" alt="photo_2026-02-15_11-16-39" src="https://github.com/user-attachments/assets/81c45252-50d9-43b9-8863-732bacd05f67" /> | <img width="200" alt="photo_2026-04-14_10-06-46" src="https://github.com/user-attachments/assets/cb6b29b7-3e5c-40ac-a5f2-fb1c9c7d1da8" /> | <img width="200" alt="Снимок экрана 2026-05-28 224020" src="https://github.com/user-attachments/assets/7331c8a7-ea5c-42cb-b26f-1dd49545c6c6" /> |

---

## 🛠️ Technology Stack

**Frontend (Mobile App)**
* React Native & Expo (SDK 54)
* Zustand (Global State & Persistence)
* NativeWind (Tailwind CSS for React Native)
* Expo Camera, Image Picker, Location, Notifications

**Backend (RESTful API)**
* Node.js & Express.js
* MongoDB Atlas & Mongoose ODM (NoSQL & Geospatial Queries)
* JSON Web Tokens (JWT) & bcrypt (Authentication)
* `node-cron` (Automated Expiry Push Notifications)

**Cloud & Third-Party APIs**
* OpenAI API (`gpt-4o-mini`)
* OCR.space API
* Cloudinary (CDN Image Hosting via Base64 upload)

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* Expo CLI (`npm install -g expo-cli`)
* A MongoDB Atlas Cluster
* API Keys for OpenAI, OCR.space, and Cloudinary.

### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/xxyxynu/Diploma-project.git

# Navigate to backend
cd EcoCart/backend

# Install dependencies
npm install

# Configure Environment Variables
# Create a .env file in the backend root directory (See .env.example)

# Start the server
npm start
