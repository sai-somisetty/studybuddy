from fastapi import FastAPI
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

@app.get("/")
def read_root():
    return {"message": "Study Buddy is alive"}

@app.get("/test-db")
def test_db():
    return {"database": "Supabase connected", "status": "ready"}

@app.post("/student/register")
def register_student(name: str, stream: str, exam_date: str, city: str):
    result = supabase.table("students").insert({
        "name": name,
        "stream": stream,
        "exam_date": exam_date,
        "city": city
    }).execute()
    return {"message": f"Welcome {name}!", "student": result.data}

@app.get("/ask")
def ask_question(question: str, student_name: str = "Student"):
    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"""You are Study Buddy — an AI study companion for Indian CA and CMA students.

Answer this question using ONLY official ICAI or ICMAI study material.
Always end with: Source — [Chapter name], Page [X]
Maximum 3 sentences. Be direct. No preamble.

Student name: {student_name}
Question: {question}"""
        }]
    )
    
    answer = response.content[0].text
    
    return {
        "question": question,
        "answer": answer,
        "student": student_name
    }