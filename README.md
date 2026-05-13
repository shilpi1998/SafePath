# SafePath - AI-Assisted Travel Safety Companion

SafePath is a real-time safety companion for navigating Delhi NCR. It combines live crime data, community crowd-sourced alerts, AI-powered route planning, and instant SOS to keep users safe.

## Features

- **Real-time Crime Heatmap** — 500+ data points covering Delhi NCR with live crime news overlay
- **Safe Route Planner** — AI-optimized routes using Google Directions API with safety scoring
- **Community Support** — Real-time WebSocket alerts to nearby helpers within 5km when SOS is triggered
- **Emergency SOS** — One-tap alert sends SMS + Email to contacts and notifies community helpers
- **Anonymous Incident Reporting** — Report crimes without needing an account
- **AI Safety Assistant** — Chat with AI about safety concerns, get real-time advice
- **Google Places Autocomplete** — Search locations by name instead of coordinates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, SQLite, WebSocket |
| Web | Next.js, TypeScript, Tailwind CSS, Google Maps API |
| Mobile | React Native, Expo, Google Maps |
| AI | Anthropic Claude API |
| Notifications | Twilio SMS, Gmail SMTP |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google Maps API key (with Places, Directions, Maps JavaScript APIs enabled)

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env` with your keys:

```env
DATABASE_URL=sqlite:///./safepath.db
JWT_SECRET=your-secret-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-key
ANTHROPIC_API_KEY=your-anthropic-key        # Optional: for AI chat
TWILIO_ACCOUNT_SID=your-twilio-sid          # Optional: for SMS alerts
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
SMTP_EMAIL=your-email@gmail.com             # Optional: for email alerts
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

Run the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

---

### 2. Web App Setup

```bash
cd web

# Install dependencies
npm install

# Create .env.local
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
echo 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key' >> .env.local

# Run development server
npm run dev
```

The web app will be available at `http://localhost:3000`.

**Required Google APIs** (enable in Google Cloud Console):
- Maps JavaScript API
- Places API
- Directions API

---

### 3. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

**Running on device:**
- **iOS Simulator**: Press `i` in the Expo terminal
- **Android Emulator**: Press `a` in the Expo terminal
- **Physical Device**: Install "Expo Go" app, scan the QR code shown in terminal

**Configure API URL** (for physical device):
Edit `src/lib/api.ts` and change `API_BASE` to your computer's local IP:
```ts
const API_BASE = "http://192.168.x.x:8000"; // your local IP
```

Find your IP with: `ipconfig getifaddr en0` (Mac) or `hostname -I` (Linux)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/safety/incidents` | Get nearby incidents |
| POST | `/api/safety/incidents` | Report incident (authenticated) |
| POST | `/api/safety/incidents/anonymous` | Report anonymously |
| GET | `/api/safety/heatmap` | Get heatmap data + live crime |
| GET | `/api/safety/safe-zones` | Nearby safe zones |
| GET | `/api/safety/danger-zones` | Nearby danger zones |
| POST | `/api/routes/plan` | Plan safe route |
| POST | `/api/chat/message` | AI chat |
| POST | `/api/emergency/sos` | Trigger SOS alerts |
| GET | `/api/emergency/contacts` | List emergency contacts |
| POST | `/api/emergency/contacts` | Add emergency contact |
| POST | `/api/community/toggle-support` | Enable/disable community helper |
| POST | `/api/community/update-location` | Update helper location |
| POST | `/api/community/sos` | Alert nearby community helpers |
| WS | `/api/community/ws/{user_id}` | Real-time SOS notifications |

---

## Project Structure

```
SafePath/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── auth.py              # JWT authentication
│   │   ├── ws_manager.py        # WebSocket connection manager
│   │   ├── heatmap_data.py      # 500+ Delhi NCR crime data points
│   │   ├── crime_fetcher.py     # Live crime news from Google News RSS
│   │   ├── notifications.py     # Twilio SMS + Email alerts
│   │   └── routes/
│   │       ├── auth_routes.py
│   │       ├── safety_routes.py
│   │       ├── route_routes.py
│   │       ├── chat_routes.py
│   │       ├── emergency_routes.py
│   │       └── community_routes.py
│   └── requirements.txt
├── web/
│   └── src/
│       ├── app/page.tsx          # Main page with all panels
│       ├── components/
│       │   ├── MapView.tsx       # Google Maps with heatmap & directions
│       │   ├── RoutePlanner.tsx  # Safe route with Places Autocomplete
│       │   ├── CommunitySupport.tsx  # Community helper toggle & alerts
│       │   ├── IncidentReporter.tsx  # Report with anonymous option
│       │   ├── EmergencyContacts.tsx
│       │   ├── SOSButton.tsx
│       │   └── ChatPanel.tsx
│       └── lib/
│           ├── api.ts            # Axios API client
│           └── types.ts          # TypeScript interfaces
├── mobile/
│   ├── App.tsx                   # Tab navigation (7 screens)
│   └── src/
│       ├── screens/
│       │   ├── MapScreen.tsx     # Live map + SOS button
│       │   ├── RouteScreen.tsx   # Safe route planner
│       │   ├── CommunityScreen.tsx   # Community support
│       │   ├── EmergencyScreen.tsx   # SOS + contacts
│       │   ├── ChatScreen.tsx    # AI assistant
│       │   ├── ReportScreen.tsx  # Incident reporting
│       │   └── ProfileScreen.tsx # Login/register
│       └── lib/api.ts
└── README.md
```

---

## Community Support - How It Works

1. User enables "Community Support" in the app
2. Their location is shared with the SafePath network every 30 seconds
3. When someone triggers SOS, all community helpers within **5km** receive a real-time WebSocket notification
4. Helpers see the victim's name, message, and Google Maps link to navigate to them
5. Helpers can rush to aid or call emergency services on the victim's behalf

---

## License

MIT
