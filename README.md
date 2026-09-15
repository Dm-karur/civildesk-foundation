# CivilDesk Foundation ERP

CivilDesk Foundation is an ERP and management application for civil construction and project operations, featuring labor management, BOQ, subcontracts, materials, attendance, and wages.

## Project Structure

```text
CivilDesk Foundation/
├── backend/            # CodeIgniter 4 (PHP) REST API backend
│   ├── app/            # Application controllers, models, filters, entities
│   ├── public/         # Web server document root (index.php)
│   ├── db/             # Database schemas & SQL migrations
│   └── composer.json   # PHP backend dependencies
├── frontend/           # React + Vite frontend application
│   ├── src/            # Components, pages, hooks, state
│   ├── public/         # Static assets and web manifests
│   └── package.json    # Frontend npm dependencies
└── README.md
```

## Getting Started

### Backend Setup (CodeIgniter 4)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install PHP dependencies via Composer:
   ```bash
   composer install
   ```
3. Copy environment file and configure database:
   ```bash
   cp env.example .env
   ```
4. Start the development server:
   ```bash
   php spark serve
   ```

### Frontend Setup (React + Vite)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` if needed and update API endpoints.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Production Build

To build the frontend for production:
```bash
cd frontend
npm run build
```
The output will be placed in `frontend/dist`.
