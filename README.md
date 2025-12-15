# IE221 - Full-Stack Web Application

A modern full-stack web application built with Django (Python) backend and React (JavaScript) frontend.�
## 📷 Video demo
https://drive.google.com/file/d/1xQZBQc4DIEMvqeLg_TY4LRkskntK1-PP/view?usp=sharing
## 🏗️ Project Structure

```
IE221/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── users/          # User management
│   │   └── auth/           # Authentication
│   ├── IE221/              # Django project settings
│   ├── static/             # Static files
│   ├── media/              # User uploads
│   ├── requirements.txt    # Python dependencies
│   └── manage.py
├── frontend/               # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── .gitignore             # Git ignore rules
├── README.md              # This file
├── package.json           # Root package.json for scripts
├── docker-compose.yml     # Docker configuration
└── .env.example          # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/duyle1062/IE221.git
cd IE221
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env file with your configuration
```

### 3. Install dependencies and setup

```bash
npm run setup
```

### 4. Start development servers

```bash
# Start both backend and frontend
npm run dev

# OR start individually:
npm run backend    # Django server on http://127.0.0.1:8000
npm run frontend   # React app on http://localhost:3000
```

## 🛠️ Development

### Backend (Django)

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
.\venv\Scripts\Activate.ps1  # Windows

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 📚 API Documentation

### Base URL

- Development: `http://127.0.0.1:8000/api/`

### Available Endpoints

- `GET /api/users/hello/` - Test endpoint
- `POST /api/auth/login/` - User login (coming soon)
- `POST /api/auth/register/` - User registration (coming soon)
- `POST /api/auth/logout/` - User logout (coming soon)

## 🐳 Docker Support

Run the entire application with Docker:

```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Backend tests only
npm run test:backend

# Frontend tests only
npm run test:frontend
```

## 📦 Available Scripts

| Command                  | Description                                 |
| ------------------------ | ------------------------------------------- |
| `npm run dev`            | Start both backend and frontend             |
| `npm run backend`        | Start Django server only                    |
| `npm run frontend`       | Start React app only                        |
| `npm run setup`          | Install all dependencies and run migrations |
| `npm run build`          | Build React app for production              |
| `npm run test`           | Run all tests                               |
| `npm run migrate`        | Run Django migrations                       |
| `npm run makemigrations` | Create Django migrations                    |
| `npm run collectstatic`  | Collect static files                        |

## 🛡️ Environment Variables

Create a `.env` file in the root directory. See `.env.example` for all available options.

Key variables:

- `DEBUG` - Django debug mode
- `SECRET_KEY` - Django secret key
- `DATABASE_URL` - Database connection string
- `CORS_ALLOWED_ORIGINS` - Allowed origins for CORS
- `REACT_APP_API_BASE_URL` - Backend API URL for frontend

## 📁 Key Features

- ✅ Django REST API backend
- ✅ React frontend with modern hooks
- ✅ CORS configured for development
- ✅ Environment-based configuration
- ✅ Docker support
- ✅ Authentication system (in development)
- ✅ User management
- ✅ Static file handling
- ✅ Media file uploads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**duyle1062**

- GitHub: [@duyle1062](https://github.com/duyle1062)
