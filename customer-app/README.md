# Redeem Rocket - Customer App

Customer-facing marketplace application for discovering and redeeming deals from local businesses.

## 📁 Project Structure

```
redeem-rocket-customer-app/
├── frontend/                 # React/Vite application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Page components (Home, Explore, Orders, Profile, Login, Signup)
│   │   ├── services/       # API client services
│   │   ├── stores/         # Zustand state management
│   │   ├── types/          # TypeScript type definitions
│   │   ├── styles/         # Global CSS and Tailwind styles
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
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
├── docker-compose.yml      # Local development setup
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── package.json            # Root package.json

```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Django backend running on http://localhost:8000
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/redeem-rocket-customer-app.git
cd redeem-rocket-customer-app

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
VITE_APP_NAME=Redeem Rocket
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
- **authStore**: User authentication state (Zustand)
- **businessStore**: Businesses and deals listing (Zustand)

### Pages
- **Login** - User authentication
- **Signup** - User registration
- **Home** - Landing page with features
- **Explore** - Business directory with filters
- **Orders** - Customer order history
- **Profile** - User profile management

### Components
- **Layout** - Main layout with navigation
- **Navigation** - Header navigation bar
- **Footer** - Footer component

## 🔄 API Endpoints

The app communicates with Django backend at `/api/v1/`:

```
# Authentication
POST   /auth/register/
POST   /auth/login/
POST   /auth/logout/
GET    /auth/me/
PUT    /auth/update-profile/

# Businesses
GET    /businesses/
GET    /businesses/{id}/
GET    /businesses/?city=...&category=...

# Orders
GET    /orders/
POST   /orders/
GET    /orders/{id}/
PATCH  /orders/{id}/

# Deals
GET    /deals/
GET    /deals/{id}/

# Payments
POST   /payments/
GET    /payments/{id}/
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
docker build -t redeem-rocket-customer-app .
```

### Run
```bash
docker run -p 3000:80 redeem-rocket-customer-app
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
- [Business App](https://github.com/YOUR_USERNAME/redeem-rocket-business-app)
- [Admin App](https://github.com/YOUR_USERNAME/redeem-rocket-admin-app)

## 📝 Development Workflow

1. Create feature branch: `git checkout -b feature/description`
2. Make changes and test locally
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feature/description`
5. Create Pull Request to `develop`
6. After review and merge, auto-deploys to dev environment

## 🐛 Troubleshooting

### API Connection Issues
- Check if Django backend is running on http://localhost:8000
- Verify VITE_API_URL in .env.local
- Check CORS settings in Django backend

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Vite cache: `rm -rf dist/ .vite`

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti :5173 | xargs kill -9
```

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)

## 📄 License

MIT

## 👥 Support

For issues and questions, please create an issue on GitHub.
