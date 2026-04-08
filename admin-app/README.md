# Redeem Rocket - Admin App

Administrative portal for managing users, businesses, orders, and viewing analytics on the Redeem Rocket platform.

## 📁 Project Structure

```
redeem-rocket-admin-app/
├── frontend/                 # React/Vite application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components (Dashboard, Users, Businesses, Orders, Reports, Login)
│   │   ├── services/       # API client services
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript type definitions
│   │   ├── styles/         # Global CSS and Tailwind styles
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── vite.config.ts      # Vite build configuration
│   ├── tsconfig.json       # TypeScript configuration
│   ├── package.json        # Dependencies
│   └── .gitignore
├── docs/                    # Documentation
├── config/                  # Configuration files
│   ├── .env.example        # Environment variables template
│   └── constants.ts        # App constants
├── .github/
│   └── workflows/          # CI/CD pipelines
│       ├── dev-deploy.yml  # Develop branch deployment
│       ├── qa-deploy.yml   # QA branch deployment
│       └── prod-deploy.yml # Production deployment
├── Dockerfile              # Container image for production
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── package.json            # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Django backend running on http://localhost:8000
- Admin account credentials
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/redeem-rocket-admin-app.git
cd redeem-rocket-admin-app

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Build for Production

```bash
npm run build
npm run preview
```

## 📦 Dependencies

### Core
- React 18.3 - UI library
- React Router 7.13 - Client-side routing
- TypeScript 5.4 - Type safety

### State Management
- Zustand 4.5 - Lightweight state management

### UI Components
- Tailwind CSS 4.1 - Utility-first CSS
- Radix UI - Accessible component primitives
- Lucide React - Icon library
- clsx - Conditional classnames

### HTTP Client
- Axios 1.7 - HTTP requests with interceptors

### Utilities
- date-fns 3.6 - Date manipulation

### Build Tools
- Vite 6.3 - Fast build tool
- ESLint 9 - Code linting
- Vitest 2.0 - Unit testing

## 🔐 Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Redeem Rocket Admin
VITE_ENABLE_ANALYTICS=false
```

## 🏗️ Architecture

### API Integration
- API client: `src/services/api.ts`
  - Axios instance with automatic token injection
  - Request/response interceptors
  - Token refresh handling
  - Error handling

### State Management
- **authStore**: Admin authentication state (Zustand)
- **businessStore**: Business data management (Zustand)

### Pages
- **Login** - Admin authentication (requires role verification)
- **Dashboard** - Overview of platform statistics
- **Users** - User management and monitoring
- **Businesses** - Business verification and management
- **Orders** - Order monitoring and management
- **Reports** - Analytics and revenue reports

### Components
- **Layout** - Main layout with navigation
- **Navigation** - Header navigation bar
- **Footer** - Footer component

## 🔄 API Endpoints

The app communicates with Django backend at `/api/v1/admin/`:

```
# Authentication
POST   /auth/login/
POST   /auth/logout/
GET    /auth/me/

# Users
GET    /admin/users/
GET    /admin/users/{id}/
PATCH  /admin/users/{id}/
DELETE /admin/users/{id}/

# Businesses
GET    /admin/businesses/
GET    /admin/businesses/{id}/
PATCH  /admin/businesses/{id}/
POST   /admin/businesses/{id}/approve/
POST   /admin/businesses/{id}/reject/

# Orders
GET    /admin/orders/
GET    /admin/orders/{id}/
PATCH  /admin/orders/{id}/

# Reports
GET    /admin/stats/
GET    /admin/reports/
GET    /admin/analytics/
```

## 🧪 Testing

```bash
npm run test           # Run tests
npm run test:ui       # Run tests with UI
npm run type-check    # TypeScript checking
npm run lint          # ESLint checking
```

## 🐳 Docker

### Build
```bash
docker build -t redeem-rocket-admin-app .
```

### Run
```bash
docker run -p 3000:80 redeem-rocket-admin-app
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### GitHub Actions

Push to branches for automatic deployment:
- `develop` → Dev environment (auto-deploy)
- `qa` → Staging environment (auto-deploy)
- `main` → Production (requires approval)

## 🔗 Related Repositories

- [Backend (Django)](https://github.com/YOUR_USERNAME/redeem-rocket-backend)
- [Customer App](https://github.com/YOUR_USERNAME/redeem-rocket-customer-app)
- [Business App](https://github.com/YOUR_USERNAME/redeem-rocket-business-app)

## 📝 Development Workflow

1. Create feature branch: `git checkout -b feature/description`
2. Make changes and test locally
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/description`
5. Create Pull Request to `develop`
6. After review and merge, auto-deploys to dev environment

## 🔐 Security Notes

- Admin panel requires authentication via login page
- All API requests include JWT authorization header
- Sensitive operations require admin role verification
- Session management via token refresh mechanism
- CORS configured to restrict cross-origin access

## 🐛 Troubleshooting

### API Connection Issues
- Check if Django backend is running on http://localhost:8000
- Verify VITE_API_URL in .env.local
- Check CORS settings in Django backend
- Ensure admin credentials are correct

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Vite cache: `rm -rf dist/ .vite`

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti :5173 | xargs kill -9
```

### Authentication Failures
- Verify admin account has 'admin' role
- Check token expiration (24 hours)
- Clear browser cookies/localStorage and login again

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)

## 📄 License

MIT

## 👥 Support

For issues and questions, please create an issue on GitHub or contact the development team.
