# Gharpay CRM Frontend

This is a modern, production-quality frontend for the Gharpay Lead Management CRM MVP.

## Features

- **Dashboard**: Overview of lead pipeline, statistics, and upcoming visits.
- **Kanban Board**: Drag-and-drop interface to manage leads across different statuses (New, Contacted, Visit Scheduled, Closed).
- **Lead Capture**: Quick and easy form to add new leads with essential details.
- **Lead Details & Management**: Update statuses, assign owners, schedule visits, and maintain notes on individual leads.
- **Optimistic UI Updates**: Powered by TanStack Query for a snappy experience.

## Tech Stack

- **Next.js 15 (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **TanStack React Query** (API State Management)
- **Axios** (API Client)
- **@dnd-kit** (Drag and Drop)
- **Lucide React** (Icons)

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher recommended)
- The FastAPI Backend should be running. (By default, it is expected at `http://localhost:8000/api/v1`)

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment

The app will default to `http://localhost:8000/api/v1`. If your backend is running elsewhere, create a `.env.local` file in the root of the frontend project:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
\`\`\`

### 3. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Navigate to [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## API Integration

The frontend uses Axios to communicate with the backend. Ensure your backend has properly configured CORS to accept requests from `http://localhost:3000`.

API Endpoints mapped:
- \`GET /leads\`
- \`GET /leads/grouped\`
- \`POST /leads\`
- \`PATCH /leads/{id}/status\`
- \`PATCH /leads/{id}/assign\`
- \`PATCH /leads/{id}/schedule\`
- \`PATCH /leads/{id}/notes\`
- \`DELETE /leads/{id}\`
- \`GET /users\`
- \`GET /dashboard\`
