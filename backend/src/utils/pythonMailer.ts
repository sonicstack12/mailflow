import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function runPythonMailer(payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const pyScript = path.resolve(__dirname, "../scripts/mailer.py");
        const process = spawn("python", [pyScript]);
        
        let output = "";
        let errorOutput = "";

        process.stdout.on("data", (data) => {
            output += data.toString();
        });

        process.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        process.on("close", (code) => {
            try {
                const jsonStart = output.indexOf("{");
                if (jsonStart !== -1) {
                    const jsonString = output.slice(jsonStart);
                    const result = JSON.parse(jsonString);
                    resolve(result);
                } else if (code !== 0) {
                    reject(new Error(`Python script failed (${code}): ${errorOutput}`));
                } else {
                    reject(new Error("No valid JSON output from python script."));
                }
            } catch (e: any) {
                reject(new Error(`Failed to parse python output: ${e.message}`));
            }
        });

        process.stdin.write(JSON.stringify(payload));
        process.stdin.end();
    });
}
