"""Generate AI_RELEVANCY_IMPROVEMENT_GUIDE.pdf from the markdown source."""

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parent.parent.parent
MD_PATH = ROOT / "AI_RELEVANCY_IMPROVEMENT_GUIDE.md"
PDF_PATH = ROOT / "AI_RELEVANCY_IMPROVEMENT_GUIDE.pdf"


class GuidePDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 8)
            self.set_text_color(100, 100, 100)
            self.cell(0, 8, "AI Relevancy & Duplicate Detection - Improvement Guide", align="C")
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def sanitize(text: str) -> str:
    replacements = {
        "\u2014": "-",
        "\u2013": "-",
        "\u2192": "->",
        "\u2265": ">=",
        "\u2264": "<=",
        "\u201c": '"',
        "\u201d": '"',
        "\u2018": "'",
        "\u2019": "'",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text.encode("latin-1", errors="replace").decode("latin-1")


def write_line(pdf: GuidePDF, line: str) -> None:
    stripped = sanitize(line.rstrip())
    if not stripped:
        pdf.ln(3)
        return

    if stripped == "---":
        pdf.ln(2)
        return

    if stripped.startswith("# "):
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(20, 20, 80)
        pdf.multi_cell(0, 8, stripped[2:].strip())
        pdf.set_text_color(0, 0, 0)
        pdf.ln(2)
        return

    if stripped.startswith("## "):
        pdf.ln(3)
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(40, 40, 120)
        pdf.multi_cell(0, 7, stripped[3:].strip())
        pdf.set_text_color(0, 0, 0)
        pdf.ln(1)
        return

    if stripped.startswith("### "):
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 11)
        pdf.multi_cell(0, 6, stripped[4:].strip())
        pdf.ln(1)
        return

    if stripped.startswith("|") and "---" not in stripped:
        pdf.set_font("Courier", "", 8)
        pdf.multi_cell(0, 4, stripped.replace("|", "  ").strip())
        return

    if stripped.startswith("- ") or stripped.startswith("* "):
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 5, "  - " + stripped[2:].strip())
        return

    if stripped.startswith("```"):
        return

    pdf.set_font("Helvetica", "", 10)
    text = stripped.replace("**", "").replace("`", "")
    pdf.multi_cell(0, 5, text)


def main() -> None:
    if not MD_PATH.exists():
        raise FileNotFoundError(f"Missing source: {MD_PATH}")

    pdf = GuidePDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    for line in MD_PATH.read_text(encoding="utf-8").splitlines():
        write_line(pdf, line)

    pdf.output(str(PDF_PATH))
    print(f"Created: {PDF_PATH}")


if __name__ == "__main__":
    main()
