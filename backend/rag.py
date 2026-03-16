import chromadb
import json
import os
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
chroma_client = chromadb.PersistentClient(path="./chromadb_data")

def create_namespaces():
    with open("syllabus.json", "r") as f:
        syllabus = json.load(f)
    namespaces_created = []
    for subject in syllabus["subjects"]:
        for chapter in subject["chapters"]:
            for subchapter in chapter["subchapters"]:
                namespace = subchapter["namespace"]
                try:
                    chroma_client.create_collection(name=namespace)
                    namespaces_created.append(namespace)
                    print(f"Created: {namespace}")
                except:
                    print(f"Exists: {namespace}")
    return namespaces_created

def seed_concept(namespace, concept, explanation, source, page, chapter, paragraph=""):
    collection = chroma_client.get_collection(name=namespace)
    try:
        collection.add(
            documents=[explanation],
            metadatas=[{
                "concept": concept,
                "source": source,
                "page": str(page),
                "chapter": chapter,
                "paragraph": paragraph,
                "display": f"{source} - Chapter {chapter} - Page {page}"
            }],
            ids=[f"{namespace}_{concept.replace(' ', '_')}"]
        )
        print(f"Seeded: {concept} — Page {page}")
    except Exception as e:
        print(f"Already exists: {concept}")

def search_namespace(namespace, question, n_results=3):
    try:
        collection = chroma_client.get_collection(name=namespace)
        results = collection.query(query_texts=[question], n_results=n_results)
        return results
    except:
        return None

if __name__ == "__main__":
    print("Creating namespaces...")
    namespaces = create_namespaces()
    print(f"Done. {len(namespaces)} namespaces.")

    seed_concept(
        namespace="ca_f_acc_ch1_s2",
        concept="Going Concern",
        explanation="Going Concern assumes the enterprise will continue in operation for the foreseeable future. Assets are valued at cost price not liquidation value. Management must assess ability to continue as going concern.",
        source="ICAI Study Material",
        page=12,
        chapter="1",
        paragraph="3.1"
    )

    seed_concept(
        namespace="ca_f_acc_ch1_s2",
        concept="Accrual Concept",
        explanation="Revenue is recognised when earned and expenses when incurred — not when cash is received or paid. Financial statements reflect true position regardless of cash movements.",
        source="ICAI Study Material",
        page=15,
        chapter="1",
        paragraph="3.3"
    )

    seed_concept(
        namespace="ca_f_acc_ch1_s2",
        concept="Consistency Concept",
        explanation="Accounting policies once adopted must be applied consistently from one period to another. Change is permissible only if required by statute or for better presentation. Any change must be disclosed with its financial effect.",
        source="ICAI Study Material",
        page=18,
        chapter="1",
        paragraph="3.4"
    )

    seed_concept(
        namespace="ca_f_acc_ch2_s1",
        concept="Depreciation",
        explanation="Depreciation is systematic allocation of asset cost over useful life as per AS 10. Begins from date asset is available for use. SLM and WDV are the two main methods. Mandatory — cannot be skipped even for new assets.",
        source="ICAI Study Material — AS 10",
        page=45,
        chapter="2",
        paragraph="5.1"
    )

    seed_concept(
        namespace="ca_f_law_ch1_s1",
        concept="Offer",
        explanation="An offer is a proposal under Section 2(a) — willingness to do or abstain from doing anything to obtain assent of another. Counter offer kills the original offer immediately. Offer must be communicated to be valid.",
        source="Indian Contract Act 1872",
        page=8,
        chapter="1",
        paragraph="Section 2(a)"
    )

    seed_concept(
        namespace="ca_f_law_ch1_s2",
        concept="Minors Contract",
        explanation="Contract with minor is absolutely void under Section 11 — not merely voidable. Minor is person below 18 years. Void from beginning — ab initio. No court can enforce it. Minor can be beneficiary but never promisor.",
        source="Indian Contract Act 1872",
        page=45,
        chapter="1",
        paragraph="Section 11"
    )

    seed_concept(
        namespace="ca_f_law_ch1_s2",
        concept="Free Consent",
        explanation="Consent is free when not caused by coercion, undue influence, fraud, misrepresentation or mistake under Section 14. If any factor present — contract voidable at option of affected party.",
        source="Indian Contract Act 1872",
        page=52,
        chapter="1",
        paragraph="Section 14"
    )

    print("Seeding complete.")