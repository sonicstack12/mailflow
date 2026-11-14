import { runPythonMailer } from './src/utils/pythonMailer.js'; 
runPythonMailer({ action: 'test', smtp_host: 'mail.bytex.global', smtp_port: 465, user: 'samarth.z@bytex.global', password: 'badpassword' }).then(console.log).catch(console.error);
