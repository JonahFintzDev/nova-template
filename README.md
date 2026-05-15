# Nova Template

A base template for building Nova applications (budget tracking, wishlist, etc.).

## Features

- **Authentication**: Login, register, setup, password change
- **User Management**: Admin page for user management
- **Settings**: Theme toggle (light/dark/auto), language (en/de), AI features toggle
- **API Keys**: Generate and manage API keys for external integrations
- **API Documentation**: Built-in Swagger/OpenAPI documentation
- **Base Layout**: Responsive layout with sidebar navigation
- **Internationalization**: English and German translations
- **Theming**: Multiple theme options with auto-detect

## Project Structure

```
app/
├── dashboard/          # Vue 3 frontend
│   ├── src/
│   │   ├── components/layout/  # AppLayout, NavSidebar, NavTopBar, etc.
│   │   ├── views/              # LoginView, SetupView, SettingsView, AdminView, HomeView
│   │   ├── stores/             # Pinia stores (auth, settings)
│   │   ├── classes/            # API client, router
│   │   ├── lib/                # i18n, themes, gsap
│   │   └── @types/             # TypeScript types
│   └── public/               # Static assets
└── api/                 # Fastify backend
    ├── src/
    │   ├── routes/            # API routes (auth, health, admin, keys, settings)
    │   ├── classes/           # Database, auth, config
    │   └── @types/            # API types
    └── prisma/               # Prisma schema and migrations
```

## Getting Started

### Development

1. Clone the repository
2. Install dependencies:

```bash
cd app/dashboard
npm install

cd ../../app/api
npm install
```

3. Set up environment variables:

```bash
cd app/api
cp .env.example .env
# Edit .env with your JWT secret
```

4. Initialize database:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Start development servers:

In one terminal:

```bash
cd app/api
npm run dev
```

In another terminal:

```bash
cd app/dashboard
npm run dev
```

### Production

1. Build the dashboard:

```bash
cd app/dashboard
npm run build
```

2. Start the API server (which serves the dashboard):

```bash
cd app/api
NODE_ENV=production npm start
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/validate` - Validate token
- `PATCH /api/auth/password` - Change password
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update user settings
- `GET /api/admin/users` - List users (admin only)
- `PATCH /api/admin/users/:id` - Update user (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/settings` - Get app settings (admin only)
- `PATCH /api/admin/settings` - Update app settings (admin only)
- `GET /api/keys` - List API keys
- `POST /api/keys` - Create API key
- `DELETE /api/keys/:id` - Delete API key
- `GET /api/docs` - API documentation (Swagger UI)

## Customization

To customize this template for a specific app (e.g., budget tracking, wishlist):

1. Add new models to `app/api/prisma/schema.prisma`
2. Create new API routes in `app/api/src/routes/`
3. Add new views in `app/dashboard/src/views/`
4. Add new components in `app/dashboard/src/components/`
5. Extend the navigation in `AppLayout.vue`
6. Add new translations to `en.ts` and `de.ts`

## License

MIT
