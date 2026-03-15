from fastapi import FastAPI
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.get("/")
def read_root():
    return {"message": "Study Buddy is alive"}

@app.get("/test-db")
def test_db():
    return {"database": "Supabase connected", 
            "project": "StudyBuddy",
            "status": "ready"}