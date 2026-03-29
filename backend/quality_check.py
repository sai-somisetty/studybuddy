import fitz
import json
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

PDF_OFFSET = 8
sb = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY'))
doc = fitz.open('Paper1_20-06-2024_R_CMA_F.pdf')

r = sb.table('lesson_content')\
    .select('pdf_page, book_page, mama_lines')\
    .eq('chapter', '1')\
    .not_.is_('mama_lines', 'null')\
    .order('pdf_page')\
    .execute()

print('Page | PDF chars | Vision chars | Ratio | Status')
print('-' * 55)

for row in r.data:
    pdf_page = row['pdf_page']
    lines = row['mama_lines']
    if isinstance(lines, str):
        lines = json.loads(lines)

    vision_text = ' '.join([
        p.get('text', '') for p in lines if p.get('text')
    ])
    
    pdf_idx = pdf_page - 1
    if 0 <= pdf_idx < len(doc):
        pdf_text = doc[pdf_idx].get_text()
    else:
        pdf_text = ''

    fitz_lines = [
        l.strip() for l in pdf_text.split('\n')
        if l.strip()
        and 'Institute of Cost' not in l
        and 'Fundamentals of Business' not in l
        and len(l.strip()) > 5
    ]
    clean_pdf = ' '.join(fitz_lines)

    pdf_chars = len(clean_pdf)
    vis_chars = len(vision_text)
    ratio = vis_chars / pdf_chars if pdf_chars > 0 else 0
    
    if ratio >= 0.8:
        status = 'OK'
    elif ratio >= 0.5:
        status = 'WARN'
    else:
        status = 'FAIL'
    
    print(f'{pdf_page:>4} | {pdf_chars:>9} | {vis_chars:>12} | {ratio:>5.2f} | {status}')

doc.close()
