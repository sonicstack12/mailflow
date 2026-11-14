import sys
import json
import smtplib
import imaplib
import time
from email.message import EmailMessage
import re
import base64

def save_to_sent_folder(msg, imap_host, imap_port, user, password, sent_folder="INBOX.Sent"):
    try:
        imap = imaplib.IMAP4_SSL(imap_host, imap_port, timeout=30)
        imap.login(user, password)
        
        # Try to select the preferred sent folder
        target_folder = sent_folder
        status, _ = imap.select(target_folder)
        
        if status != 'OK':
            status, _ = imap.select('Sent')
            if status == 'OK':
                target_folder = 'Sent'
            else:
                status, _ = imap.select('Sent Items')
                if status == 'OK':
                    target_folder = 'Sent Items'
                else:
                    # Common Gmail/Google Workspace configuration
                    status, _ = imap.select('"[Gmail]/Sent Mail"')
                    if status == 'OK':
                        target_folder = '"[Gmail]/Sent Mail"'
        
        imap.append(
            target_folder,
            "\\Seen",
            imaplib.Time2Internaldate(time.time()),
            msg.as_bytes()
        )
        imap.logout()
        return True
    except Exception as e:
        return False

def get_smtp_server(host, port, user, password):
    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=30)
    else:
        server = smtplib.SMTP(host, port, timeout=30)
        server.starttls()
    server.login(user, password)
    return server

def main():
    try:
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"success": False, "error": "No input provided"}))
            return

        data = json.loads(input_data)
        action = data.get("action")
        
        smtp_host = data.get("smtp_host")
        smtp_port = data.get("smtp_port")
        imap_host = data.get("imap_host", smtp_host)
        imap_port = data.get("imap_port", 993)
        user = data.get("user")
        password = data.get("password")
        from_name = data.get("from_name")
        from_email = data.get("from_email")
        
        if action == "test":
            try:
                server = get_smtp_server(smtp_host, smtp_port, user, password)
                server.quit()
                print(json.dumps({"success": True}))
            except Exception as e:
                print(json.dumps({"success": False, "error": str(e)}))
            return
            
        elif action == "send":
            to_email = data.get("to_email")
            to_name = data.get("to_name", "")
            subject = data.get("subject")
            html_body = data.get("html_body")
            
            msg = EmailMessage()
            msg["From"] = f"{from_name} <{from_email}>"
            msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
            msg["Subject"] = subject
            
            # Create a clean plaintext fallback to avoid being flagged as spam
            plain_text = re.sub(r'<style.*?</style>', '', html_body, flags=re.DOTALL)
            plain_text = re.sub(r'<[^>]+>', ' ', plain_text)
            plain_text = re.sub(r'\s+', ' ', plain_text).strip()
            if not plain_text:
                plain_text = "Please view this email in a HTML compatible client."
                
            msg.set_content(plain_text)
            msg.add_alternative(html_body, subtype='html')
            
            attachments = data.get("attachments", [])
            for att in attachments:
                file_name = att.get("filename")
                file_data_b64 = att.get("data")
                file_type = att.get("content_type", "application/octet-stream")
                
                if file_name and file_data_b64:
                    try:
                        maintype, subtype = file_type.split("/", 1) if "/" in file_type else ("application", "octet-stream")
                        if "," in file_data_b64:
                            file_data_b64 = file_data_b64.split(",", 1)[1]
                        file_bytes = base64.b64decode(file_data_b64)
                        msg.add_attachment(file_bytes, maintype=maintype, subtype=subtype, filename=file_name)
                    except Exception:
                        pass
            
            try:
                server = get_smtp_server(smtp_host, smtp_port, user, password)
                server.send_message(msg, from_addr=from_email, to_addrs=[to_email])
                server.quit()
                
                # Append heavily to IMAP
                save_to_sent_folder(msg, imap_host, imap_port, user, password)
                
                print(json.dumps({"success": True}))
            except Exception as e:
                print(json.dumps({"success": False, "error": str(e)}))
            return
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
