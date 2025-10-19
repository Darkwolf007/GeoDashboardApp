# Geodashboard

A React + FastAPI geospatial dashboard for interactive housing and amenities analysis.

## Features
- Interactive map with selectable areas (Google Maps)
- Dynamic amenities sidebar (drag-and-drop)
- Housing type dropdown
- Price forecast chart (historical + next 5 years, PKL model)
- Dark/light mode toggle
- FastAPI backend with ML model (model.pkl)

## Prerequisites
- Node.js (v16+ recommended)
- Python 3.8+

## Setup Instructions

### 1. Clone the repository
```
git clone https://github.com/Darkwolf007/geodashboard.git
cd geodashboard_app
```

### 2. Install frontend dependencies
```
cd geodashboard
npm install
```

### 3. Install backend dependencies
```
cd ../backend
pip install fastapi uvicorn joblib numpy
```

### 4. Place your model
- Put your `model.pkl` file in the `backend` folder.

### 5. Run the backend
```
cd backend
uvicorn main:app --reload --port 8000
```
- The backend will be available at http://localhost:8000

### 6. Run the frontend
```
cd ../geodashboard
npm start
```
- The frontend will be available at http://localhost:3000

## Usage
- Select an area on the map.
- Choose a housing type from the dropdown.
- Drag amenities from the sidebar onto the map.
- View the price forecast chart (historical + predicted).
- Use the reset button to clear selections.
- Toggle dark/light mode with the sun/moon button.

## Troubleshooting
- If you see CORS errors, make sure the backend is running and accessible.
- If you see missing icons, check your internet connection (icons are loaded from icons8).
- For git errors, ensure your remote repository exists and you are on the correct branch.

## License
MIT
