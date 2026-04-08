# 💻 Local Development Guide

Run all applications locally for development.

## 📋 Prerequisites

- **Node.js** 18+ (https://nodejs.org)
- **Python** 3.11+ (https://python.org)
- **PostgreSQL** 15+ (https://postgresql.org)
- **Redis** 7+ (https://redis.io)
- **Git** (https://git-scm.com)

## 🚀 Quick Start (5 minutes with Docker)

If you have Docker installed:

```bash
# Clone repository
git clone https://github.com/eagleincloud/redeem-rocket.git
cd redeem-rocket

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services running on:
- **Backend**: http://localhost:8000
- **Customer App**: http://localhost:5173
- **Business App**: http://localhost:5174
- **Admin App**: http://localhost:5175
- **Database**: localhost:5432 (postgres/postgres)
- **Cache**: localhost:6379

---

## 🔧 Manual Setup (Without Docker)

### Step 1: Set Up Backend (Django)

```bash
# Clone repository
git clone https://github.com/eagleincloud/redeem-rocket.git
cd redeem-rocket/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Create database (make sure PostgreSQL is running)
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser
# Follow prompts to create admin user

# Start development server
python manage.py runserver

# Backend running on http://localhost:8000
```

### Step 2: Set Up Customer App (Terminal 2)

```bash
# From redeem-rocket directory
cd customer-app/frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Update .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local

# Start development server
npm run dev

# App running on http://localhost:5173
```

### Step 3: Set Up Business App (Terminal 3)

```bash
# From redeem-rocket directory
cd business-app/frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local

# Start development server
npm run dev

# App running on http://localhost:5174
```

### Step 4: Set Up Admin App (Terminal 4)

```bash
# From redeem-rocket directory
cd admin-app/frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local
echo "VITE_API_URL=http://localhost:8000" >> .env.local

# Start development server
npm run dev

# App running on http://localhost:5175
```

---

## 📱 Access Applications

Once all services are running:

| Application | URL | Purpose |
|-------------|-----|---------|
| **Customer App** | http://localhost:5173 | Browse deals, make orders |
| **Business App** | http://localhost:5174 | Manage business profile |
| **Admin App** | http://localhost:5175 | System administration |
| **API Docs** | http://localhost:8000/api/ | API endpoints |
| **Admin Panel** | http://localhost:8000/admin | Django admin (superuser) |

---

## 🧪 Common Development Tasks

### Run Tests

**Backend**:
```bash
cd backend
python manage.py test
# or using pytest:
pytest
```

**Frontend**:
```bash
cd customer-app/frontend
npm run test
npm run test:ui  # Interactive UI
```

### Type Checking

**Frontend**:
```bash
cd customer-app/frontend
npm run type-check
```

### Linting

**Frontend**:
```bash
cd customer-app/frontend
npm run lint
```

**Backend**:
```bash
cd backend
flake8 .
black . --check
```

### Database Migrations

**Create migration after model changes**:
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### API Testing

```bash
# Test registration
curl -X POST http://localhost:8000/api/v1/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "password2": "Test@123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  }'

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Django
DEBUG=True
SECRET_KEY=your-secret-key-change-in-production

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=redeem_rocket
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

# Redis
REDIS_URL=redis://localhost:6379/0

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# AWS S3 (optional)
# USE_S3=True
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Redeem Rocket
VITE_ENABLE_ANALYTICS=false
```

---

## 🐛 Troubleshooting

### PostgreSQL Connection Error
```
Error: could not connect to server
```

**Solution**:
```bash
# Make sure PostgreSQL is running
# macOS (Homebrew):
brew services start postgresql

# Linux:
sudo service postgresql start

# Windows:
# Start PostgreSQL service from Services app
```

### Port Already in Use

```bash
# Kill process on port 8000 (backend)
lsof -ti :8000 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti :5173 | xargs kill -9
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
# Frontend:
cd customer-app/frontend
rm -rf node_modules package-lock.json
npm install

# Backend:
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Migration Issues

```bash
# Reset database (WARNING: deletes all data)
cd backend
python manage.py flush
python manage.py migrate

# Create new superuser
python manage.py createsuperuser
```

### API Not Responding

Check if backend is running:
```bash
curl http://localhost:8000/api/v1/
```

If not, restart:
```bash
cd backend
python manage.py runserver
```

---

## 📝 Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes to code

# 3. Test locally (run all commands above)

# 4. Run linting and tests
cd backend && python manage.py test
cd ../customer-app/frontend && npm run test

# 5. Commit changes
git commit -m "feat: description of feature"

# 6. Push to develop
git push origin feature/my-feature

# 7. Create PR on GitHub
# (GitHub will auto-test and deploy to dev)

# 8. After merge to develop:
# Auto-deploys to dev environment ✓

# 9. Create PR: develop → qa
# Auto-deploys to qa ✓

# 10. Create PR: qa → main
# Requires approval, then auto-deploys to production ✓
```

---

## 🔗 Useful Links

- **Django Docs**: https://docs.djangoproject.com
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Tailwind Docs**: https://tailwindcss.com
- **PostgreSQL Docs**: https://postgresql.org/docs

---

## ✅ Verification

After setup, verify everything works:

```bash
# Test API
curl http://localhost:8000/api/v1/

# Test Customer App
open http://localhost:5173

# Test Business App
open http://localhost:5174

# Test Admin App
open http://localhost:5175

# Test Admin Panel
open http://localhost:8000/admin
# Login with superuser credentials
```

---

## 💡 Tips

1. **Keep terminals open**: Keep one terminal for each service
2. **Watch logs**: Helps understand what's happening
3. **Use Django shell**: `python manage.py shell` to test code
4. **Reload dev servers**: Auto-reload works, but sometimes restart helps
5. **Clear cache**: If weird issues, try clearing browser cache

---

**Happy coding! 🚀**
