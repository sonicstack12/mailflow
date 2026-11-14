import sys
import smtplib
from email.message import EmailMessage

def send_test():
    host = "mail.bytex.global"
    port = 465
    user = "samarth.z@bytex.global"
    password = "Samarth@123" 

    msg = EmailMessage()
    msg['Subject'] = 'Test from Modern API'
    msg['From'] = f"Test User <{user}>"
    msg['To'] = "samarthzamre262@gmail.com"
    msg.set_content("This is a plaintext fallback.")
    msg.add_alternative("<html><body><p>This is a <b>HTML</b> version with modern API 🚀</p></body></html>", subtype='html')

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
