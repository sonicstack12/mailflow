import * as XLSX from 'xlsx';

export interface RecipientData {
  email: string;
  [key: string]: string | number | boolean | null;
}

export interface ExcelParseResult {
  success: boolean;
  data: RecipientData[];
  columns: string[];
  error?: string;
}

/**
 * Parses an Excel file and extracts recipient data
 * Requires an 'email' column in the spreadsheet
 */
export const parseExcelFile = (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ success: false, data: [], columns: [], error: 'Failed to read file' });
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        
        if (!sheetName) {
          resolve({ success: false, data: [], columns: [], error: 'No sheets found in the file' });
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (jsonData.length === 0) {
          resolve({ success: false, data: [], columns: [], error: 'No data found in the spreadsheet' });
          return;
        }

        // Get column headers (normalize to lowercase for matching)
        const rawColumns = Object.keys(jsonData[0]);
        const columns = rawColumns.map(col => col.trim());

        // Check for email column (case insensitive)
        const emailColumnIndex = columns.findIndex(
          col => col.toLowerCase() === 'email'
        );

        if (emailColumnIndex === -1) {
          resolve({
            success: false,
            data: [],
            columns,
            error: 'Email column is required. Please add an "email" column to your spreadsheet.',
          });
          return;
        }

        // Parse recipients
        const recipients: RecipientData[] = jsonData
          .map((row) => {
            const recipient: RecipientData = { email: '' };
            
            rawColumns.forEach((col, index) => {
              const normalizedCol = columns[index];
              const value = row[col];
              
              if (normalizedCol.toLowerCase() === 'email') {
                recipient.email = String(value || '').trim();
              } else {
                recipient[normalizedCol] = value as string | number | boolean | null;
              }
            });

            return recipient;
          })
          .filter((r) => r.email && isValidEmail(r.email));

        if (recipients.length === 0) {
          resolve({
            success: false,
            data: [],
            columns,
            error: 'No valid email addresses found in the spreadsheet.',
          });
          return;
        }

        resolve({
          success: true,
          data: recipients,
          columns: columns,
        });
      } catch (error) {
        console.error('Excel parsing error:', error);
        resolve({
          success: false,
          data: [],
          columns: [],
          error: 'Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        columns: [],
        error: 'Failed to read the file.',
      });
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Validates an email address format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Checks if template variables match Excel columns
 */
export const checkVariableSync = (
  templateVariables: string[],
  excelColumns: string[]
): { synced: boolean; missing: string[]; extra: string[] } => {
  const normalizedColumns = excelColumns.map(c => c.toLowerCase());
  const normalizedVars = templateVariables.map(v => v.toLowerCase());

  const missing = templateVariables.filter(
    v => !normalizedColumns.includes(v.toLowerCase())
  );
  
  const extra = excelColumns.filter(
    c => !normalizedVars.includes(c.toLowerCase())
  );

  return {
    synced: missing.length === 0,
    missing,
    extra,
  };
};
