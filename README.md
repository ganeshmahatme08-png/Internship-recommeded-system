# Interner 🚀

Interner is a modern web application designed to help users discover internships based on their skills and preferences. It features a responsive UI, skill-based matching algorithms, and a seamless user authentication flow integrated with SQLite database.

## Tech Stack

*   **Frontend**: Vanilla HTML, CSS, JavaScript
*   **Backend**: Python (Flask)
*   **Database**: SQLite (Flask-SQLAlchemy)
*   **Authentication**: Custom session-based login built with Flask and SQLAlchemy.

## Features

*   **Skill-Based Search**: Enter your skills to automatically find matching internship opportunities.
*   **Dataset-Driven Listings**: Search 750 internship listings by required skills, category, location, stipend, and duration.
*   **User Authentication**: Secure Sign Up and Sign In flow that saves credentials directly to SQLite database.
*   **Profile Management**: Update your name, email, and skills. Your changes are reflected instantly and saved to the database.
*   **Responsive Design**: Built with raw CSS to ensure a beautiful and dynamic UI across all devices.

## Getting Started

### Prerequisites

*   **Python 3.x**: Required to run the backend server and HTTP frontend server.

### Installation

1. **Clone the repository** (or navigate to your workspace directory).
2. **Install Backend Dependencies**:
   Open a terminal in the root directory and install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
   Or manually:
   ```bash
   pip install flask flask-sqlalchemy flask-cors
   ```

### Running the Application

You will need to run two servers locally: one for the backend API and one for the frontend client.

1. **Start the Backend Server (Flask)**:
   In your terminal, run the following command to start the API:
   ```bash
   python server.py
   ```
   *The backend will run on `http://localhost:5000`.*

2. **Start the Frontend Server**:
   Open a **new** terminal window in the project root and start a simple HTTP server:
   ```bash
   python -m http.server 8000
   ```
   *The frontend will run on `http://localhost:8000`.*

3. **View the Application**: 
   Open your browser and navigate to `http://localhost:8000`. You can now sign up, log in, and explore internships!

The internship listings are loaded from `data/internship_recommendation_dataset_750.csv` through the Flask `GET /internships` endpoint. Keep the Flask server running while searching.

## Folder Structure

```
d:/interner/
├── index.html       # Main application HTML file
├── style.css        # Application styles and responsive design
├── script.js        # Frontend logic and API integration
├── server.py        # Python Flask backend server
├── .env             # Environment variables (MongoDB connection string)
└── ...              # Other HTML feature pages
```
