# Personal Blog — Full Stack

> **Stack**: C# ASP.NET Core 9 Web API + Vue 3 (Composition API + Vite + Pinia)

## 📁 Monorepo Structure

```
personal-blog/
├── backend/Blog.Api/        ← ASP.NET Core 9 REST API
├── frontend/public-site/    ← Vue 3 public blog
├── frontend/admin-panel/    ← Vue 3 admin dashboard
├── docker-compose.yml
└── README.md
```

## 🚀 Quick Start

### 1. Backend (requires SQL Server)

Update connection string in `backend/Blog.Api/appsettings.json` then:

```bash
cd backend/Blog.Api
dotnet run
```

API runs at: **http://localhost:5181**  
Swagger UI: **http://localhost:5181/swagger**  
Default Admin: `admin@blog.com` / `Admin@123`

### 2. Public Site

```bash
cd frontend/public-site
npm install
npm run dev
```

Runs at: **http://localhost:5173**

### 3. Admin Panel

```bash
cd frontend/admin-panel
npm install
npm run dev
```

Runs at: **http://localhost:5174**

## 🏗️ Architecture

```
[Vue Component]
    ↓ user action
[Pinia Store Action]
    ↓ axios call
[Axios Interceptor]  ← adds JWT, handles 401
    ↓ HTTP request
[ASP.NET Controller]
    ↓
[Service]           ← business logic
    ↓
[Repository]        ← database queries (EF Core)
    ↓
[SQL Server DB]
    ↑
[ApiResponse<T>]    ← { success, data, message, errors }
```

## 📡 API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | /api/posts | Public |
| GET | /api/posts/{slug} | Public |
| GET | /api/categories | Public |
| POST | /api/auth/login | Public |
| GET | /api/admin/dashboard | Admin |
| GET/POST/PUT/DELETE | /api/admin/posts | Admin/Editor |
| GET/POST/PUT/DELETE | /api/admin/categories | Admin |
| GET/PATCH/DELETE | /api/admin/comments | Admin |

## 🐳 Docker

```bash
docker-compose up -d
```

## 🔧 Database Migration

```bash
cd backend/Blog.Api
dotnet ef migrations add InitialCreate
dotnet ef database update
```
