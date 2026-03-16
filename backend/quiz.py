import chromadb
import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chromadb_data")

def generate_mcq(namespace, concept, n_questions=5):
    try:
        collection = chroma_client.get_collection(name=namespace)
        results = collection.query(
            query_texts=[concept],
            n_results=1
        )
        if not results or not results["documents"][0]:
            return None
        
        content = results["documents"][0][0]
        metadata = results["metadatas"][0][0]
        source = metadata.get("source", "ICAI Study Material")
        page = metadata.get("page", "")
        chapter = metadata.get("chapter", "")

        prompt = f"""You are a CA Foundation exam expert.

Generate {n_questions} MCQ questions based on this official content:
{content}

Source: {source}, Chapter {chapter}, Page {page}

Rules:
- Each question must test understanding not memorisation
- 4 options each — only one correct
- Include one examiner trap option per question
- Difficulty: CA Foundation exam level
- Base questions ONLY on the provided content

Respond in JSON only — no preamble:
{{
  "concept": "{concept}",
  "source": "{source}",
  "chapter": "{chapter}",
  "page": "{page}",
  "questions": [
    {{
      "question": "question text",
      "options": {{
        "A": "option A",
        "B": "option B", 
        "C": "option C",
        "D": "option D"
      }},
      "correct": "A",
      "explanation": "why this is correct — cite content",
      "trap": "which option is the examiner trap and why"
    }}
  ]
}}"""

        response = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        raw = response.content[0].text
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```json")[-1].split("```")[0]
        
        quiz_data = json.loads(raw)
        return quiz_data

    except Exception as e:
        print(f"Error generating quiz: {e}")
        return None

def evaluate_answer(question, student_answer, correct_answer, explanation):
    is_correct = student_answer.upper() == correct_answer.upper()
    return {
        "correct": is_correct,
        "student_answer": student_answer,
        "correct_answer": correct_answer,
        "explanation": explanation,
        "feedback": "Correct! Well done." if is_correct else f"Incorrect. The correct answer is {correct_answer}. {explanation}"
    }

if __name__ == "__main__":
    print("Generating quiz for Going Concern...")
    quiz = generate_mcq(
        namespace="ca_f_acc_ch1_s2",
        concept="Going Concern",
        n_questions=3
    )
    if quiz:
        print(json.dumps(quiz, indent=2))
    else:
        print("Quiz generation failed.")