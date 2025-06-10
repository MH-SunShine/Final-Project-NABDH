Nabdh – AI-Powered Healthcare Platform

Nabdh is an AI-driven web platform that connects patients, doctors, and laboratories to streamline medical analysis, automate appointment bookings, and generate intelligent health recommendations using association rule mining and language models.

🚀 Key Features

1 AI interpretation of medical reports using Apriori algorithm

2 LLM-generated explanations & follow-up suggestions with medical recommendations for patients

3 Automated appointment scheduling

4 Role-based dashboards for patients, doctors, and admins

5 Secure login with JWT authentication

6 RESTful API built with Flask backend

7 PostgreSQL relational database
          
Note: The app was deployed on Vercel but is currently running locally only.


📦 Tech Stack

Frontend	 -->   HTML, Bootstrap, JS
Backend	   -->   Python, Flask
Database	 -->   PostgreSQL
AI Module	 -->   Apriori Algorithm + LLM (meta-llama/llama-3.3-8b-instruct:free)
Auth	     -->   JWT (JSON Web Tokens)
Hosting	   -->   Vercel (inactive)


⚙️ Getting Started

1 Clone the project:
git clone https://github.com/MH-SunShine/Final-Project-NABDH.git
cd Final-Project-NABDH

2 Install backend dependencies:
pip install -r requirements.txt

3 Run the Flask backend:
python run.py


(Frontend runs via static HTML files in the templates directory)


🔐 Authentication

JWT-based login system

Three user roles: Patient, Doctor, Laboratory

Protected routes using Flask decorators


🧠 AI Module

Nabdh includes a powerful AI engine that:

Uses the Apriori algorithm to extract medical association rules from reports

Passes filtered rules to the LLM in order to:

- Explain abnormal results

- Predict possible conditions

- Suggest follow-up tests and medical advice


🧪 Testing

- No formal unit testing framework used. The system was tested manually using:
- Postman for API endpoints
- Frontend integration in browser


⚠️ Note

The backend is still under active development. Several endpoints and features are being modified and improved for performance, security, and functionality. Final integration is in progress.


👨‍💻 Authors

Marwa Hammamouche – Backend Developer, AI Module

Douaa Bennaceur – Frontend Developer, thesis documentation

Asma Abboura – Supervisor
