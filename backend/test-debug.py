import sys
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from email.mime.multipart import MIMEMultipart
from email.utils import make_msgid, formatdate

def send_test():
    host = "mail.bytex.global"
    port = 465
    user = "samarth.z@bytex.global"
    password = "Samarth@123" # The user explicitly provided this in a previous message

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Test User <{user}>"
    msg["To"] = f"samarthzamre262@gmail.com"
    msg["Subject"] = Header("Manual SMTP Debug Test", "utf-8")
    msg["Message-ID"] = make_msgid()
    msg["Date"] = formatdate(localtime=True)
    msg.attach(MIMEText("This is a debug test", "html", "utf-8"))

    print("Connecting...")
    server = smtplib.SMTP_SSL(host, port, timeout=30)
    server.set_debuglevel(1)
    
    print("Logging in...")
    try:
        server.login(user, password)
    except Exception as e:
        print("Login failed:", e)
        return

    print("Sending mail...")
    try:
        result = server.sendmail(user, ["samarthzamre262@gmail.com"], msg.as_string())
        print("Sendmail result:", result)
    except Exception as e:
        print("Send failed:", e)
    
    print("Quitting...")
    server.quit()

send_test()
