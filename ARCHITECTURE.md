# Mission Control - Architecture Documentation

**Project:** Mission Control (Ayda's Dashboard)
**Version:** 0.1.0
**Last Updated:** 2026-02-09
**CTO:** Ayda (acting)

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 16.1.6 (App Router)
- **React:** 19.2.3
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Fonts:** Inter (sans), JetBrains Mono (mono)

### State Management
- **Pattern:** Client-side state via React hooks
- **Real-time:** WebSocket connection to OpenClaw Gateway

### Dependencies
```json
{
  "socket.io-client": "^4.8.3",  // WebSocket
  "lucide-react": "^0.563.0",    // Icons
  "date-fns": "^4.1.0",          // Date utils
  "clsx": "^2.1.1",              // Classnames
  "tailwind-merge": "^3.4.0"     // Tailwind utils
}
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home (monitoring)
│   ├── layout.tsx         # Root layout
│   ├── database/          # Database viewer
│   ├── antigravity/       # Account management
│   ├── settings/          # Settings pages
│   └── api/               # API routes
│       ├── database/      # DB operations
│       ├── chat/          # Chat history
│       ├── terminal/      # Terminal execute
│       ├── system/        # System stats
│       └── antigravity/   # Account APIs
├── components/            # React components
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── monitoring-panel.tsx
│   ├── command-palette.tsx
│   └── sentient-core.tsx
└── lib/                   # Utilities
    ├── gateway.ts         # WebSocket client
    └── gateway-config.ts  # Config
```

---

## 🎨 Styling Standards

### Design System
- **Theme:** Dark mode only (`className="dark"`)
- **Background:** `#0a0a0a`
- **Text:** White
- **Selection:** Blue-500/30

### Tailwind Patterns
```tsx
// Component example
className="bg-[#0a0a0a] text-white antialiased"

// Utility function
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Typography
- **Sans:** Inter (Google Fonts)
- **Mono:** JetBrains Mono (code/logs)

---

## 🔄 State Management

### WebSocket Connection
```typescript
// lib/gateway.ts
connectToGateway(
  onLog: (entry: LogEntry) => void,
  onStatus: (status: string) => void
)

// LogEntry type
type LogEntry = {
  ts: string;
  type: 'CALL' | 'THINKING' | 'OK' | 'ERROR';
  msg: string;
  detail?: string;
};
```

### Status Values
- `AUTHENTICATING...`
- `ONLINE`
- `AUTH FAILED`
- `ERROR`
- `DISCONNECTED`

---

## 🌐 API Patterns

### Route Handlers
All API routes follow Next.js App Router pattern:

```typescript
// app/api/*/route.ts
export async function GET(request: Request) {
  // Implementation
}

export async function POST(request: Request) {
  // Implementation
}
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/database/list` | GET | List databases |
| `/api/database/content` | GET | Get DB content |
| `/api/database/save` | POST | Save DB changes |
| `/api/chat/history` | GET | Chat history |
| `/api/terminal/execute` | POST | Execute command |
| `/api/system/stats` | GET | System metrics |
| `/api/system/usage` | GET | Usage data |
| `/api/system/model` | GET | Model info |
| `/api/antigravity/accounts` | GET/POST | Manage accounts |
| `/api/env` | GET/POST | Environment vars |
| `/api/settings` | GET/POST | App settings |

---

## 🏛️ Design Patterns

### Component Structure
```tsx
"use client";  // All components are client-side

export function ComponentName() {
  // Hooks
  // State
  // Effects
  // Handlers
  // Render
}
```

### Gateway Protocol
1. **Connect:** WebSocket to `GATEWAY_CONFIG.url`
2. **Challenge:** Receive `connect.challenge` event
3. **Authenticate:** Send token in `connect` request
4. **Subscribe:** `logs.tail` for real-time updates
5. **Listen:** Handle `agent` events for activity

---

## 🛠️ Development Standards

### File Naming
- **Components:** `kebab-case.tsx` (e.g., `command-palette.tsx`)
- **API Routes:** `route.ts` (Next.js convention)
- **Utilities:** `camelCase.ts` (e.g., `gateway.ts`)

### TypeScript
- **Strict mode:** Enabled (`"strict": true`)
- **Paths:** `@/components/*`, `@/lib/*`
- **Types:** Define in same file or adjacent `.d.ts`

### Styling
- Use Tailwind utility classes
- Use `cn()` for conditional classes
- Dark mode only (no light mode support)
- Custom colors via `bg-[#hex]` syntax

### State
- Local state with `useState`
- Effects with `useEffect`
- No global state library (yet)

---

## 🚀 Future Development

### Adding New Pages
1. Create `src/app/page-name/page.tsx`
2. Add navigation in `sidebar.tsx`
3. Use consistent layout pattern

### Adding New API Endpoints
1. Create `src/app/api/endpoint-name/route.ts`
2. Export `GET` and/or `POST` functions
3. Handle errors with proper HTTP codes

### Adding New Components
1. Create in `src/components/component-name.tsx`
2. Use `"use client"` directive
3. Export as named export
4. Style with Tailwind + `cn()`

### WebSocket Events
1. Add handler in `gateway.ts` `onmessage`
2. Define type for new event
3. Call appropriate callback

---

## ⚠️ Known Limitations

- No database (uses Notion API + files)
- No authentication (relies on gateway token)
- No tests (yet)
- No CI/CD (manual deployment)

---

## 📚 References

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **OpenClaw Gateway Protocol:** See gateway.ts comments

---

_Documentation created by Ayda (acting CTO)_
_This document should be updated when architecture changes_
