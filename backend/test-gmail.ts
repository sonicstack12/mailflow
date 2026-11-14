import { runPythonMailer } from './src/utils/pythonMailer.js'; 

async function testGmail() {
    const payload = {
        action: 'test',
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        user: 'samarthzamre262@gmail.com', // guess from UI
        password: 'yqujpnlsrnzwkfdq', // from user's message
        from_name: 'sam',
        from_email: 'samarthzamre262@gmail.com'
    };
    try {
        const result = await runPythonMailer(payload);
        console.log("Result:", result);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testGmail();
