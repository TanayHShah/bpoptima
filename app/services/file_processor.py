from PyPDF2 import PdfReader
from docx import Document
import tempfile


def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""

    for page in reader.pages:
        text += page.extract_text() or ""

    return text


def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])


def count_lines(text: str) -> int:
    return len([line for line in text.splitlines() if line.strip()])