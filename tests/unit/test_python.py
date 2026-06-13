import subprocess
import sys
import tempfile
import os
from pathlib import Path

import pikepdf
from PIL import Image

SCRIPTS_DIR = Path(__file__).resolve().parents[2] / "config" / "core" / "py"
GENERATE_SCRIPT = SCRIPTS_DIR / "generate_fn_images.py"
ENCRYPT_SCRIPT = SCRIPTS_DIR / "encrypt_pdf.py"


def make_mapping_file(tmp_path, count=3):
    lines = []
    for i in range(count):
        name = f"fn_{i:08x}"
        lines.append(
            rf"\newcommand{{\func{name}}}{{\raisebox{{-0.2ex}}{{\includegraphics[height=1.1em]{{build/fn_images/{name}.png}}}}}}"
        )
    mapping_file = tmp_path / "mapping.tex"
    mapping_file.write_text("\n".join(lines))
    return mapping_file


def test_generate_images_creates_pngs():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        mapping_file = make_mapping_file(tmp_path, 3)
        output_dir = tmp_path / "images"

        result = subprocess.run(
            [sys.executable, str(GENERATE_SCRIPT), str(mapping_file), str(output_dir)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        pngs = list(output_dir.glob("*.png"))
        assert len(pngs) == 3


def test_generate_images_valid_dimensions():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        mapping_file = make_mapping_file(tmp_path, 3)
        output_dir = tmp_path / "images"

        subprocess.run(
            [sys.executable, str(GENERATE_SCRIPT), str(mapping_file), str(output_dir)],
            capture_output=True, text=True,
        )
        for png in output_dir.glob("*.png"):
            img = Image.open(png)
            w, h = img.size
            assert w > 50
            assert h > 10


def test_generate_images_missing_file_exits_gracefully():
    result = subprocess.run(
        [sys.executable, str(GENERATE_SCRIPT), "/nonexistent/mapping.tex", "/tmp/out"],
        capture_output=True, text=True,
    )
    assert result.returncode == 0


def test_encrypt_pdf_applies_encryption():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        input_pdf = tmp_path / "input.pdf"
        output_pdf = tmp_path / "output.pdf"

        pdf = pikepdf.Pdf.new()
        pdf.add_blank_page(page_size=(612, 792))
        pdf.save(str(input_pdf))

        result = subprocess.run(
            [sys.executable, str(ENCRYPT_SCRIPT), str(input_pdf), "userpass", str(output_pdf)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert output_pdf.exists()

        try:
            pikepdf.open(str(output_pdf))
            assert False, "PDF should require a password"
        except pikepdf.PasswordError:
            pass


def test_encrypt_pdf_strips_tounicode():
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        input_pdf = tmp_path / "input.pdf"
        output_pdf = tmp_path / "output.pdf"

        pdf = pikepdf.Pdf.new()
        page = pikepdf.Page(pdf.add_blank_page(page_size=(612, 792)))
        resources = pikepdf.Dictionary()
        font = pikepdf.Dictionary({"/Type": pikepdf.Name("/Font"), "/Subtype": pikepdf.Name("/Type1")})
        font["/ToUnicode"] = pdf.make_stream(b"fake cmap data")
        fonts = pikepdf.Dictionary({"/F1": pdf.make_indirect(font)})
        resources["/Font"] = fonts
        page.obj["/Resources"] = resources
        pdf.save(str(input_pdf))

        result = subprocess.run(
            [sys.executable, str(ENCRYPT_SCRIPT), str(input_pdf), "userpass", str(output_pdf)],
            capture_output=True, text=True,
        )
        assert result.returncode == 0

        owner_password = result.stdout.strip().split(': ', 1)[-1]
        encrypted = pikepdf.open(str(output_pdf), password=owner_password)
        for page in encrypted.pages:
            if "/Resources" in page and "/Font" in page["/Resources"]:
                for font_name in page["/Resources"]["/Font"].keys():
                    font_obj = page["/Resources"]["/Font"][font_name]
                    assert "/ToUnicode" not in font_obj


def test_encrypt_pdf_missing_input_exits_gracefully():
    with tempfile.TemporaryDirectory() as tmp:
        result = subprocess.run(
            [sys.executable, str(ENCRYPT_SCRIPT), "/nonexistent/input.pdf", "pass", f"{tmp}/out.pdf"],
            capture_output=True, text=True,
        )
        assert result.returncode == 1
