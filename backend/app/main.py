from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth_routes, safety_routes, route_routes, chat_routes, emergency_routes, community_routes
from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SafePath API", version="1.0.0", description="AI-Assisted Travel Safety Companion")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(safety_routes.router)
app.include_router(route_routes.router)
app.include_router(chat_routes.router)
app.include_router(emergency_routes.router)
app.include_router(community_routes.router)


@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "SafePath API"}
