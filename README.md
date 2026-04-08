# 🚀 Redeem Rocket - Complete Monorepo

A complete marketplace platform connecting customers with local businesses offering deals and discounts.

## 📁 **Monorepo Structure**

```
redeem-rocket/
├── customer-app/              # 🛍️  Customer marketplace app
│   ├── frontend/             # React/Vite application
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── Dockerfile            # Production container
│   ├── .env.example
│   ├── README.md
│   └── .github/workflows/
│
├── business-app/              # 💼 Business owner management
│   ├── frontend/             # React/Vite application
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── README.md
│   └── .github/workflows/
│
├── admin-app/                 # 👮 Admin management portal
│   ├── frontend/             # React/Vite application
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── Dockerfile
│   ├── .env.example
│   ├── README.md
│   └── .github/workflows/
│
├── backend/                   # 🔧 Django REST API
│   ├── config/               # Django settings & WSGI
│   ├── apps/                 # Django applications
│   │   ├── auth/            # Authentication
│   │   ├── businesses/      # Business management
│   │   ├── orders/          # Order tracking
│   │   ├── users/           # User profiles
│   │   ├── documents/       # Document management
│   │   ├── payments/        # Payment processing
│   │   └── leads/           # Lead management
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── README.md
│   └── .github/workflows/
│
├── database/                  # 🗄️  Database schema & migrations
│   └── (PostgreSQL migrations included in backend)
│
├── .github/                   # Monorepo-level workflows (optional)
│   └── workflows/
│
├── .gitignore
├── README.md                  # This file
└── docker-compose.yml         # Monorepo docker setup (optional)
```

---

## 🎯 **What Each Vertical Does**

### **customer-app** - Customer Marketplace
**Purpose**: Browse and discover deals from local businesses

**Pages**:
- 🏠 **Home** - Landing page with features
- 🔍 **Explore** - Search and filter businesses
- 📦 **Orders** - Order history and tracking
- 👤 **Profile** - User profile management
- 🔐 **Login/Signup** - Authentication

**Tech Stack**:
- React 18.3 + TypeScript
- Vite (development server)
- Zustand (state management)
- Tailwind CSS
- Axios (API client)

**Run Locally**:
```bash
cd customer-app/frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

### **business-app** - Business Owner Portal
**Purpose**: Manage orders, documents, and business profile

**Pages**:
- 📊 **Dashboard** - Business overview & statistics
- 📋 **Orders** - Order management interface
- 📄 **Documents** - Upload and verify documents
- 👨‍💼 **Profile** - Business profile editor
- 🔐 **Login/Signup** - Authentication

**Tech Stack**: Same as customer-app

**Run Locally**:
```bash
cd business-app/frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

### **admin-app** - Admin Management Panel
**Purpose**: System administration and monitoring

**Pages**:
- 📊 **Dashboard** - System statistics and KPIs
- 👥 **Users** - User management
- 🏢 **Businesses** - Business verification workflow
- 📦 **Orders** - Order monitoring
- 📈 **Reports** - Analytics and revenue reports
- 🔐 **Login** - Admin authentication

**Tech Stack**: Same as other frontend apps

**Run Locally**:
```bash
cd admin-app/frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

### **backend** - Django REST API Server
**Purpose**: API endpoints, database operations, authentication

**API Structure**:
```
/api/v1/
├── auth/
│   ├── register/
│   ├── login/
│   ├── token/refresh/
│   ├── logout/
│   ├── me/
│   └── update-profile/
├── businesses/
│   ├── (CRUD operations)
│   ├── documents/
│   ├── photos/
│   └── team/
├── orders/
│   └── (CRUD operations)
├── payments/
│   └── (CRUD operations)
├── admin/
│   ├── users/
│   ├── businesses/
│   ├── orders/
│   ├── stats/
│   └── reports/
└── [more endpoints...]
```

**Tech Stack**:
- Python 3.11+
- Django 4.2
- Django REST Framework (DRF)
- PostgreSQL
- JWT Authentication (djangorestframework-simplejwt)
- Gunicorn (production server)
- Docker

**Database Models**:
- User (extended)
- Business
- BusinessDocument
- BusinessPhoto
- BusinessTeamMember
- Order
- Payment
- UserProfile
- Lead

**Run Locally**:
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver

# API available at http://localhost:8000
# Admin available at http://localhost:8000/admin
```

**Using Docker**:
```bash
cd backend
docker-compose up -d
# API available at http://localhost:8000
# PostgreSQL on localhost:5432
# Redis on localhost:6379
```

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or use Docker)
- Docker & Docker Compose (optional)

### Development Setup

**Start Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Start Customer App** (in new terminal):
```bash
cd customer-app/frontend
npm install
npm run dev
```

**Start Business App** (in new terminal):
```bash
cd business-app/frontend
npm install
npm run dev
```

**Start Admin App** (in new terminal):
```bash
cd admin-app/frontend
npm install
npm run dev
```

### Access Applications
- 🛍️  Customer App: http://localhost:5173
- 💼 Business App: http://localhost:5173
- 👮 Admin App: http://localhost:5173
- 🔧 Backend API: http://localhost:8000
- 📊 Django Admin: http://localhost:8000/admin

---

## 🐳 **Docker Setup**

### Using Docker Compose (All Services)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Services Started
- Django Backend on port 8000
- PostgreSQL on port 5432
- Redis on port 6379
- Customer App on port 3001
- Business App on port 3002
- Admin App on port 3003

---

## 📊 **Technology Stack Summary**

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 18.3 + TypeScript | 3 separate apps |
| **State** | Zustand | Lightweight state management |
| **HTTP** | Axios | API requests with JWT auth |
| **Styling** | Tailwind CSS 4.1 | Utility-first CSS |
| **Components** | Radix UI | Accessible UI primitives |
| **Build** | Vite 6.3 | Fast development & build |
| **Backend** | Django 4.2 + DRF | REST API framework |
| **Database** | PostgreSQL 15 | Relational database |
| **Cache** | Redis 7 | Caching & background jobs |
| **Auth** | JWT (djangorestframework-simplejwt) | Token-based auth |
| **File Upload** | Pillow | Image processing |
| **Server** | Gunicorn | Production WSGI |
| **Static Files** | WhiteNoise | Static file serving |
| **Deployment** | Docker | Containerization |
| **CI/CD** | GitHub Actions | Automated testing & deploy |

---

## 🔄 **API Integration**

Each frontend app communicates with the Django backend via Axios client:

**API Base URL**: `http://localhost:8000/api/v1/`

**Example Request**:
```typescript
// src/services/api.ts
import { apiClient } from '../services/api'

// Login
await apiClient.login(email, password)

// Fetch businesses
await apiClient.getBusinesses({ city: 'Bangalore' })

// Create order
await apiClient.createOrder({ businessId, items })
```

---

## 🧪 **Testing**

### Frontend Tests
```bash
cd customer-app/frontend
npm run test           # Run tests
npm run test:ui       # Test UI
npm run type-check    # TypeScript check
npm run lint          # ESLint check
```

### Backend Tests
```bash
cd backend
python manage.py test                    # Run all tests
python manage.py test apps.auth          # Test specific app
pytest                                   # Using pytest
```

---

## 🌿 **Branch Strategy**

Each vertical (frontend and backend) has 3 branches:

| Branch | Purpose | Auto-Deploy |
|--------|---------|------------|
| `main` | Production (stable) | ✅ With approval |
| `qa` | Testing/Staging | ✅ Auto |
| `develop` | Development | ✅ Auto |

**Workflow**:
```
develop (auto-deploy)
    ↓ (PR)
    qa (auto-deploy)
    ↓ (PR)
    main (approval required, then auto-deploy)
```

---

## 📚 **Documentation**

Detailed documentation for each vertical:
- **customer-app**: `customer-app/README.md`
- **business-app**: `business-app/README.md`
- **admin-app**: `admin-app/README.md`
- **backend**: `backend/README.md` & `backend/IMPLEMENTATION_GUIDE.md`

---

## 🚀 **Deployment**

### Frontend Deployment (Vercel)
```bash
# Automatic deployment via GitHub Actions
# Push to develop → Deploy to dev
# Push to qa → Deploy to staging
# Push to main → Deploy to production (requires approval)
```

### Backend Deployment (Railway/Heroku)
```bash
# Automatic deployment via GitHub Actions
# Same branch strategy as frontend
# Includes database migrations
```

---

## 🤝 **Contributing**

1. Create feature branch: `git checkout -b feature/description`
2. Make changes
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/description`
5. Create Pull Request to `develop`
6. After review → auto-deploys to dev environment

---

## 📝 **Environment Variables**

Create `.env` files in each vertical:

**Frontend** (`.env.local`):
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Redeem Rocket
VITE_ENABLE_ANALYTICS=false
```

**Backend** (`.env`):
```env
DEBUG=True
SECRET_KEY=your-secret-key
DB_ENGINE=django.db.backends.postgresql
DB_NAME=redeem_rocket
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

---

## 🐛 **Troubleshooting**

### Port Already in Use
```bash
# Kill process on port 5173 (frontend)
lsof -ti :5173 | xargs kill -9

# Kill process on port 8000 (backend)
lsof -ti :8000 | xargs kill -9
```

### Dependencies Issues
```bash
# Frontend
cd customer-app/frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Issues
```bash
# Reset database
cd backend
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
```

---

## 📄 **License**

MIT

---

## 👥 **Support**

For issues and questions, please create an issue on GitHub.

---

## 🎉 **Ready to Deploy!**

All verticals are production-ready. Next steps:
1. ✅ Push to GitHub repositories
2. ✅ Configure Railway/Heroku for backend
3. ✅ Configure Vercel for frontend apps
4. ✅ Set up GitHub Actions secrets
5. ✅ Update branch protection rules
6. ✅ Run end-to-end tests
7. ✅ Go live! 🚀
