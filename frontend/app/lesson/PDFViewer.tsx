"use client";
import { Document, Page as PdfPage } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_URL = "https://rwuntjxogfrqxaphjolj.supabase.co/storage/v1/object/public/textbooks/Paper1_20-06-2024_R_CMA_F.pdf";

interface Props {
  pageNumber: number;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  bookPage: number;
  totalPages: number;
}

export default function PDFViewer({
  pageNumber, onPrev, onNext,
  canGoPrev, canGoNext, bookPage, totalPages
}: Props) {
  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#FAFAF8" }}>
      <Document
        file={PDF_URL}
        loading={
          <div style={{
            display: "flex", justifyContent: "center",
            padding: 40, color: "#0A2E28", fontSize: 13
          }}>
            Loading textbook...
          </div>
        }
        error={
          <div style={{
            padding: 24, textAlign: "center", color: "#E67E22"
          }}>
            Could not load PDF. Check connection.
          </div>
        }
      >
        <PdfPage
          pageNumber={pageNumber}
          width={Math.min(
            typeof window !== "undefined"
              ? window.innerWidth - 8 : 400,
            472
          )}
          renderTextLayer={true}
          renderAnnotationLayer={false}
        />
      </Document>

      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", padding: "12px 16px", gap: 10
      }}>
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: !canGoPrev ? "#E5E0D8" : "#0A2E28",
            color: "#fff", border: "none",
            cursor: !canGoPrev ? "default" : "pointer",
            fontSize: 13, fontWeight: 600
          }}>
          ← Prev
        </button>
        <span style={{ fontSize: 11, color: "#A89880", whiteSpace: "nowrap" }}>
          Page {bookPage} · {totalPages} pages
        </span>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: !canGoNext ? "#E5E0D8" : "#0A2E28",
            color: "#fff", border: "none",
            cursor: !canGoNext ? "default" : "pointer",
            fontSize: 13, fontWeight: 600
          }}>
          Next →
        </button>
      </div>
    </div>
  );
}
