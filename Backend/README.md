# Lead Management CRM MVP Backend

A production-quality backend for a Lead Management CRM MVP built with FastAPI and MongoDB Atlas.

## 🧱 Tech Stack
* Python 3.11+
* FastAPI
* MongoDB (Motor async driver)
* Pydantic v2
* Uvicorn

## 📦 Architecture
The project follows a Clean Architecture pattern, with clear separation of concerns:
* **API (`app/api/`)**: Route definitions and request/response validation.
* **Services (`app/services/`)**: Business logic and orchestrating calls to repositories.
* **Repositories (`app/repositories/`)**: Database interaction using MongoDB.
* **Models (`app/models/`)**: Pydantic models mapping to database documents.
* **Schemas (`app/schemas/`)**: Pydantic models for API payloads.

## ⚙️ Setup and Installation

1. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and update the `MONGO_URI` to your MongoDB Atlas connection string.
   ```bash
   cp .env.example .env
   ```

## 🚀 Running the App

Run the FastAPI application with auto-reload for local development:
```bash
uvicorn app.main:app --reload
```
Access the API documentation at: `http://localhost:8000/docs`

## 🌱 Seeding Database
To create some sample users and leads in your database:
```bash
python scripts/seed.py
```

## 🧪 Testing
Run tests using pytest:
```bash
pytest tests/
```
