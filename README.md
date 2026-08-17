# MarketPulse

MarketPulse is a real-time Indian equity market analytics platform featuring live screening, dynamic columns, institutional-grade data visualization, and an intuitive dashboard. It provides powerful real-time market data directly in your browser.

---

## Features

- **Live Dashboard**: Real-time market data visualization and monitoring.
- **Stock Detail Pages**: In-depth analytics, timeline history, and real-time quotes for individual stocks.
- **Advanced Scanner**: Filter and scan stocks dynamically based on various customizable criteria.
- **Historical Data Analysis**: View, filter, and export historical stock performance data.
- **Dynamic Columns**: Customize your data tables with draggable, sortable, and resizable columns using `@dnd-kit` and `@tanstack/react-table`.
- **Live WebSocket Streaming**: Seamless real-time updates for market data and stock prices.
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for a sleek, responsive, and animated user interface.

---

## Screenshots

![Dashboard Placeholder](assets/dashboard.png)
![Watchlist Placeholder](assets/watchlist.png)
![Filter Placeholder](assets/filter.png)

---

## Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Libraries**: [React 19](https://react.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Client State), [TanStack React Query](https://tanstack.com/query/latest) (Server State)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Data Tables**: [TanStack React Table](https://tanstack.com/table/latest) & [TanStack Virtual](https://tanstack.com/virtual/latest)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

### Utilities & Build Tools
- **Language**: TypeScript
- **Linter**: ESLint (Next.js config)
- **Package Manager**: npm

---

## Folder Structure

```text
frontend/
├── .next/              # Next.js build output
├── app/                # Next.js 13+ App Router (pages & layouts)
│   ├── coming-soon/
│   ├── dashboard/
│   ├── history/
│   ├── scanner/
│   ├── settings/
│   └── stock/          # Dynamic route [symbol]
├── components/         # Reusable React components
│   ├── common/
│   ├── dashboard/
│   └── layout/
├── constants/          # Application constants (e.g., API endpoints)
├── hooks/              # Custom React hooks (useLiveData, useWebSocket)
├── public/             # Static assets (favicon, images, etc.)
├── services/           # API interaction and data fetching functions
├── stores/             # Zustand global state stores (market, theme, websocket)
├── types/              # TypeScript type definitions
└── utils/              # Helper and utility functions
```

---

## Installation

### 1. Clone repository
```bash
git clone https://github.com/your-username/MarketPulse.git
cd MarketPulse/frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the `.env.example` file to `.env.local` and configure it:
```bash
cp .env.example .env.local
```

### 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### 5. Production build
```bash
npm run build
```

### 6. Start production
```bash
npm run start
```

---

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | The base URL for the backend API. Exposed to the client. Defaults to `/api/v1` in dev to use rewrites. |
| `NEXT_PUBLIC_WS_URL` | The WebSocket URL for live data streaming. Exposed to the client. Defaults to `wss://localhost:8000/api/v1/ws`. |
| `BACKEND_URL` | Used by the Next.js API proxy (`next.config.ts`) to route `/api/*` calls. Avoids CORS issues. Defaults to `http://127.0.0.1:8000`. |

---

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Compiles the application for production using Next.js Turbopack.
- `npm run start`: Starts a Node.js server using the production build output.
- `npm run lint`: Runs ESLint to check for code quality and formatting issues.

---

## Deployment

### Vercel (Recommended)
This project is configured for seamless deployment on Vercel:
1. Push your code to GitHub/GitLab.
2. Import the project into Vercel.
3. Configure the **Environment Variables** in the Vercel dashboard (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `BACKEND_URL`).
4. Click **Deploy**. Vercel will automatically use Next.js settings and the provided `vercel.json`.

### Local / Self-Hosted
You can deploy using standard Node.js environments:
```bash
npm run build
npm run start
```
Make sure your environment variables are configured.

---

## Architecture

- **Pages (`app/`)**: Define routes using the App Router layout. Handles Server Components and layout composition.
- **Components (`components/`)**: Modular, reusable UI building blocks separated by domain (common, dashboard, layout).
- **API Services (`services/`)**: Centralized `fetch` calls utilizing React Query for automatic caching, deduping, and re-fetching.
- **Hooks (`hooks/`)**: Encapsulate complex React logic like `useWebSocket.ts` and `useLiveData.ts` for clean component code.
- **State (`stores/`)**: Zustand stores are used for lightweight, fast global state (such as UI themes and WebSocket connection status).
- **Utilities (`utils/`)**: Pure functions for data formatting, calculation, and manipulation.

---

## Performance Optimizations

- **Server Components (RSC)**: Leveraging the Next.js App Router to reduce client-side JavaScript bundles.
- **Caching & Deduping**: `@tanstack/react-query` automatically caches API responses and eliminates redundant network requests.
- **Virtualization**: `@tanstack/react-virtual` is used for rendering large data tables (like the scanner) efficiently without degrading DOM performance.
- **Dynamic Routing**: SSR & Static content optimized per route via Next.js.
- **WebSocket Throttling**: Live data streaming minimizes HTTP polling overhead.

---

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Author

- **MarketPulse Team** - [Your GitHub Profile](https://github.com/your-username)

---

## Future Improvements

- Add end-to-end (E2E) testing with Cypress or Playwright.
- Integrate comprehensive unit testing using Vitest and React Testing Library.
- Implement server-side rendering for complex scanner queries to boost initial load SEO.
- Add advanced PWA capabilities (Service Workers for offline caching).
- Improve mobile-responsive design on complex data tables.
