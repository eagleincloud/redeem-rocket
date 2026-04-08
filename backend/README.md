# Redeem Rocket Backend API

A Django REST Framework backend for the Redeem Rocket marketplace platform with PostgreSQL database.

## Features

- **User Management**: User registration, authentication with JWT, profile management
- **Business Management**: Business profiles, document uploads, photo gallery, team management
- **Orders & Payments**: Order tracking, payment processing
- **Leads Tracking**: Lead management and follow-up
- **Document Management**: Document upload and verification
- **CORS Support**: Cross-origin requests for frontend apps

## Tech Stack

- **Framework**: Django 4.2 + Django REST Framework 3.14
- **Database**: PostgreSQL 15
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Task Queue**: Celery (optional)
- **Caching**: Redis
- **Server**: Gunicorn
- **Containerization**: Docker & Docker Compose

## Local Development Setup

### Prerequisites

- Docker and Docker Compose installed
- Git

### 1. Clone the repository

```bash
git clone https://github.com/eagleincloud/redeem-rocket-backend.git
cd redeem-rocket-backend
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your configuration (default values work for local development).

### 3. Start services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- Django API server (http://localhost:8000)
- PostgreSQL database
- Redis cache
- Celery worker (optional)

### 4. Create superuser

```bash
docker-compose exec web python manage.py createsuperuser
```

### 5. Access the application

- **API**: http://localhost:8000/api/v1/
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/schema/ (if installed)

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register/        - Register new user
POST   /api/v1/auth/login/           - Login and get tokens
POST   /api/v1/auth/token/           - Get access token
POST   /api/v1/auth/token/refresh/   - Refresh access token
GET    /api/v1/auth/me/              - Get current user
PUT    /api/v1/auth/update-profile/  - Update profile
POST   /api/v1/auth/change-password/ - Change password
POST   /api/v1/auth/logout/          - Logout
```

### Businesses

```
GET    /api/v1/businesses/                    - List all businesses
POST   /api/v1/businesses/                    - Create business
GET    /api/v1/businesses/{id}/               - Get business details
PUT    /api/v1/businesses/{id}/               - Update business
DELETE /api/v1/businesses/{id}/               - Delete business

GET    /api/v1/businesses/{id}/documents/     - List documents
POST   /api/v1/businesses/{id}/documents/     - Upload document
DELETE /api/v1/businesses/{id}/documents/{doc_id}/ - Delete document

GET    /api/v1/businesses/{id}/photos/        - List photos
POST   /api/v1/businesses/{id}/photos/        - Upload photo

GET    /api/v1/businesses/{id}/team/          - List team members
POST   /api/v1/businesses/{id}/team/          - Add team member
```

### Orders

```
GET    /api/v1/orders/               - List orders
POST   /api/v1/orders/               - Create order
GET    /api/v1/orders/{id}/          - Get order details
PUT    /api/v1/orders/{id}/          - Update order
```

### Payments

```
POST   /api/v1/payments/submit/      - Submit payment
GET    /api/v1/payments/{id}/        - Get payment details
```

### Leads

```
GET    /api/v1/leads/                - List leads
POST   /api/v1/leads/                - Create lead
GET    /api/v1/leads/{id}/           - Get lead details
```

## Development Commands

### Run migrations

```bash
docker-compose exec web python manage.py migrate
```

### Create migrations for changes

```bash
docker-compose exec web python manage.py makemigrations
```

### Run tests

```bash
docker-compose exec web pytest -v
```

### Run linting

```bash
docker-compose exec web flake8 .
docker-compose exec web black .
```

### Collect static files

```bash
docker-compose exec web python manage.py collectstatic --noinput
```

### Database shell

```bash
docker-compose exec db psql -U postgres -d redeem_rocket
```

## Deployment to Railway

### 1. Create Railway account

Visit https://railway.app and sign up

### 2. Connect GitHub repository

- Link your GitHub repository
- Railway will automatically detect Django

### 3. Set environment variables

In Railway dashboard, set:

```
DEBUG=False
SECRET_KEY=your-secure-secret-key
DB_ENGINE=django.db.backends.postgresql
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_HOST=your_railway_postgres_host
DB_PORT=5432
CORS_ALLOWED_ORIGINS=https://customer.yourdomain.com,https://business.yourdomain.com
```

### 4. Deploy

Railway will automatically deploy on git push to main branch.

## CI/CD Pipeline

GitHub Actions workflows are configured:

- **dev-deploy.yml**: Runs on develop branch
  - Linting and format checks
  - Database migrations
  - Tests
  - Deploy to dev environment

- **prod-deploy.yml**: Runs on main branch (requires approval)
  - All dev checks
  - Deploy to production
  - Run migrations on production

## Folder Structure

```
redeem-rocket-backend/
├── config/                 # Project settings and routing
│   ├── settings.py         # Django settings
│   ├── urls.py             # URL routing
│   └── wsgi.py             # WSGI entry point
├── apps/
│   ├── auth/               # User authentication
│   ├── businesses/         # Business management
│   ├── users/              # User profiles
│   ├── orders/             # Orders
│   ├── leads/              # Leads tracking
│   ├── payments/           # Payments
│   └── documents/          # Documents
├── requirements.txt        # Python dependencies
├── manage.py               # Django management
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Local development setup
└── .env.example            # Environment template
```

## Frontend Integration

Frontend apps should call this API at:

**Development**: `http://localhost:8000/api/v1/`
**Production**: `https://api.yourdomain.com/api/v1/`

### CORS Headers

Requests from frontend must include:
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

## Security Notes

- Change `SECRET_KEY` in production
- Set `DEBUG=False` in production
- Use strong database passwords
- Enable HTTPS in production
- Regularly update dependencies
- Keep sensitive data in `.env` file

## Troubleshooting

### Database connection issues

```bash
docker-compose down
docker-compose up -d
docker-compose exec web python manage.py migrate
```

### Port already in use

Change port in docker-compose.yml:

```yaml
ports:
  - "8001:8000"  # Change 8000 to another port
```

### Redis connection errors

```bash
docker-compose restart redis
```

## Support

For issues and questions, please create an issue in the repository.

## License

MIT License
