import Papa from 'papaparse';

interface ParseResult {
  data: Record<string, string | number | Date>[];
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

export const parseCSV = (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    // Match full ISO 8601: YYYY-MM-DD, YYYY-MM-DDTHH:MM, YYYY-MM-DDTHH:MM:SS, YYYY-MM-DDTHH:MM:SSZ, etc.
    const datePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$|^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;


    Papa.parse(file, {
      header: true,
      dynamicTyping: false, // Keep as false to manually parse
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data.map(row => {
          const newRow: Record<string, string | number | Date> = {}; // Allow Date objects
          Object.entries(row as Record<string, any>).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') {
              newRow[key] = ''; // Handle null/undefined/empty as empty string
            } else if (typeof value === 'string' && datePattern.test(value.trim())) {
              const date = new Date(value.trim());
              if (!isNaN(date.getTime())) {
                newRow[key] = date; // Store as Date object
              } else {
                newRow[key] = value; // Fallback to string if not a valid date
              }
            } else if (typeof value === 'string' && !isNaN(parseFloat(value)) && isFinite(parseFloat(value))) {
              newRow[key] = parseFloat(value); // Convert numeric strings to numbers
            }
            else {
              newRow[key] = String(value); // Default to string
            }
          });
          return newRow;
        });

        resolve({
          data,
          errors: results.errors,
          meta: results.meta
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const generateCSV = (data: Record<string, any>[]): string => {
  return Papa.unparse(data);
};

export const downloadCSV = (data: Record<string, any>[], filename: string) => {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};