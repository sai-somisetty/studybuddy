from fastapi import FastAPI
from supabase import create_client
from anthropic import Anthropic
from dotenv import load_dotenv
from quiz import generate_mcq, evaluate_answer
import chromadb
import os

load_dotenv()

app = FastAPI()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chromadb_data")

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
def ask_question(question: str, namespace: str = "ca_f_acc_ch1_s2", student_name: str = "Student"):
    rag_context = ""
    source_display = ""
    verified = False

    try:
        collection = chroma_client.get_collection(name=namespace)
        results = collection.query(query_texts=[question], n_results=2)
        if results and results["documents"][0]:
            rag_context = results["documents"][0][0]
            metadata = results["metadatas"][0][0]
            source = metadata.get("source", "ICAI Study Material")
            chapter = metadata.get("chapter", "")
            page = metadata.get("page", "")
            paragraph = metadata.get("paragraph", "")
            source_display = source
            if chapter:
                source_display += f" — Chapter {chapter}"
            if page:
                source_display += f", Page {page}"
            if paragraph:
                source_display += f", Para {paragraph}"
            verified = True
    except Exception as e:
        print(f"RAG error: {e}")

    if rag_context:
        prompt = f"""You are Study Buddy — AI companion for CA/CMA students.
Use this official content to answer:
{rag_context}
Answer in maximum 3 sentences. Be direct. No preamble.
Student: {student_name}
Question: {question}"""
    else:
        prompt = f"""You are Study Buddy — AI companion for CA/CMA students.
Answer using official ICAI material only. Maximum 3 sentences. Be direct.
Student: {student_name}
Question: {question}"""

    response = claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )

    answer = response.content[0].text

    return {
        "question": question,
        "answer": answer,
        "verified_from_textbook": verified,
        "source": source_display if verified else "AI generated — verify with textbook",
        "badge": "Verified from ICAI textbook" if verified else "AI generated",
        "student": student_name
    }

@app.get("/quiz/generate")
def get_quiz(namespace: str = "ca_f_acc_ch1_s2", concept: str = "Going Concern", n_questions: int = 5):
    quiz = generate_mcq(namespace=namespace, concept=concept, n_questions=n_questions)
    if quiz:
        return quiz
    return {"error": "Could not generate quiz. Try again."}

@app.post("/quiz/answer")
def check_answer(question: str, student_answer: str, correct_answer: str, explanation: str):
    result = evaluate_answer(question, student_answer, correct_answer, explanation)
    return result