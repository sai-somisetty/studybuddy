# test_seed.py
# Test seeding with a single concept manually
# Run before the full PDF seeder to verify everything works

import chromadb
import os
from dotenv import load_dotenv

load_dotenv()

chroma = chromadb.PersistentClient(path="./chromadb_data")

# Test namespace
namespace = "cma_f_law_ch1_s1"

# Create or get collection
try:
    col = chroma.get_collection(name=namespace)
    print(f"✅ Collection exists: {namespace}")
except Exception:
    col = chroma.create_collection(name=namespace)
    print(f"✅ Collection created: {namespace}")

# Seed one test concept
col.upsert(
    documents=[
        "A contract is an agreement enforceable by law. Section 2(h) of the Indian Contract Act 1872 defines a contract as an agreement enforceable by law."
    ],
    metadatas=[{
        "course":     "cma",
        "level":      "foundation",
        "subject":    "law",
        "chapter":    "1",
        "page":       "8",
        "source":     "ICMAI Study Material Paper 1",
        "chunk_type": "official_definition",
        "concept":    "Contract",
        "importance": "tier1",
    }],
    ids=["cma_f_law_ch1_s1_Contract_official_definition"]
)

print("✅ Test concept seeded: Contract")

# Verify search works
results = col.query(query_texts=["what is a contract"], n_results=1)
print(f"✅ Search test passed: {results['documents'][0][0][:80]}...")
print("\n🎉 ChromaDB is ready for CMA seeding!")