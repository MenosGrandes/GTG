import pikepdf
import sys
import secrets

password_length = 10
password = secrets.token_urlsafe(password_length)
print(password)
pdf = pikepdf.open(sys.argv[1])
pdf.save(str(sys.argv[3]),encryption=pikepdf.Encryption(user = str(sys.argv[2]), owner = password, R=6))
