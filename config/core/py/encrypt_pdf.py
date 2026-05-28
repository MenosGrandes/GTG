import pikepdf
import sys
import os
import secrets


def strip_tounicode(obj, visited=None):
    """Strip ToUnicode CMaps to prevent glyph-to-Unicode text recovery."""
    if visited is None:
        visited = set()
    obj_id = id(obj)
    if obj_id in visited:
        return
    visited.add(obj_id)
    if hasattr(obj, 'keys'):
        if '/Font' in obj:
            for font_name in list(obj['/Font'].keys()):
                font = obj['/Font'][font_name]
                if '/ToUnicode' in font:
                    del font['/ToUnicode']
        if '/XObject' in obj:
            for xobj_name in list(obj['/XObject'].keys()):
                xobj = obj['/XObject'][xobj_name]
                if '/Resources' in xobj:
                    strip_tounicode(xobj['/Resources'], visited)


def main():
    if len(sys.argv) != 4:
        print(f'Usage: {sys.argv[0]} <input.pdf> <user_password> <output.pdf>')
        sys.exit(1)
    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f'  PDF not found: {input_path} — skipping encryption')
        sys.exit(1)
    password = secrets.token_urlsafe(10)
    print(password)
    pdf = pikepdf.open(input_path)
    for page in pdf.pages:
        if '/Resources' in page:
            strip_tounicode(page['/Resources'])
    pdf.save(str(sys.argv[3]), encryption=pikepdf.Encryption(user=str(sys.argv[2]), owner=password, R=6))


if __name__ == '__main__':
    main()
