import Papa from 'papaparse';

export interface CSVData {
  headers: string[];
  rows: string[][];
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

// Load CSV data from a URL
export const loadCSVData = async (url: string): Promise<CSVData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: false,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }
        
        const data = results.data as string[][];
        if (data.length === 0) {
          reject(new Error('No data found in CSV'));
          return;
        }
        
        const headers = data[0].map(h => h.trim());
        const rows = data.slice(1)
          .filter(row => row.some(cell => cell && cell.trim() !== ''))
          .map(row => {
            // Ensure each row has the same number of columns as headers
            const normalizedRow = [...row];
            while (normalizedRow.length < headers.length) {
              normalizedRow.push('');
            }
            return normalizedRow.slice(0, headers.length).map(cell => cell ? cell.trim() : '');
          });
        
        resolve({ headers, rows });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// Simple SQL-like query processor for CSV data (frontend fallback)
export const executeCSVQuery = (query: string, data: CSVData): QueryResult => {
  const startTime = Date.now();
  
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim();
  
  if (normalizedQuery.includes('select')) {
    let filteredRows = data.rows;
    let selectedColumns = data.headers;
    let columnIndices = data.headers.map((_, i) => i);
    
    // Handle SELECT columns
    const selectMatch = normalizedQuery.match(/select\s+(.*?)\s+from/i);
    if (selectMatch && selectMatch[1].trim() !== '*') {
      const columns = selectMatch[1].split(',').map(c => c.trim());
      columnIndices = columns.map(col => {
        const index = data.headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
        return index >= 0 ? index : 0;
      });
      selectedColumns = columnIndices.map(i => data.headers[i]);
    }
    
    // Handle WHERE clause
    const whereMatch = normalizedQuery.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      filteredRows = data.rows.filter(row => {
        // Simple WHERE processing - supports basic conditions
        if (whereClause.includes('=')) {
          const [column, value] = whereClause.split('=').map(s => s.trim());
          const columnIndex = data.headers.findIndex(h => h.toLowerCase() === column.toLowerCase());
          if (columnIndex >= 0) {
            const cleanValue = value.replace(/['"]/g, '').toLowerCase();
            const cellValue = (row[columnIndex] || '').toLowerCase();
            return cellValue.includes(cleanValue);
          }
        } else if (whereClause.includes('like')) {
          const likeMatch = whereClause.match(/(\w+)\s+like\s+['"](.+)['"]/i);
          if (likeMatch) {
            const [, column, pattern] = likeMatch;
            const columnIndex = data.headers.findIndex(h => h.toLowerCase() === column.toLowerCase());
            if (columnIndex >= 0) {
              const searchPattern = pattern.replace(/%/g, '').toLowerCase();
              const cellValue = (row[columnIndex] || '').toLowerCase();
              return cellValue.includes(searchPattern);
            }
          }
        }
        return true;
      });
    }
    
    // Handle ORDER BY clause (basic implementation)
    const orderMatch = normalizedQuery.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
    if (orderMatch) {
      const [, column, direction] = orderMatch;
      const columnIndex = data.headers.findIndex(h => h.toLowerCase() === column.toLowerCase());
      if (columnIndex >= 0) {
        filteredRows.sort((a, b) => {
          const aVal = a[columnIndex] || '';
          const bVal = b[columnIndex] || '';
          
          // Try to parse as numbers
          const aNum = parseFloat(aVal);
          const bNum = parseFloat(bVal);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return direction?.toLowerCase() === 'desc' ? bNum - aNum : aNum - bNum;
          } else {
            const result = aVal.localeCompare(bVal);
            return direction?.toLowerCase() === 'desc' ? -result : result;
          }
        });
      }
    }
    
    // Handle LIMIT clause
    const limitMatch = normalizedQuery.match(/limit\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      filteredRows = filteredRows.slice(0, limit);
    }
    
    // Select only requested columns
    const resultRows = filteredRows.map(row => 
      columnIndices.map(i => row[i] || '')
    );
    
    const executionTime = Date.now() - startTime;
    
    return {
      columns: selectedColumns,
      rows: resultRows,
      rowCount: resultRows.length,
      executionTime
    };
  }
  
  // Default response for unsupported queries
  return {
    columns: ['message'],
    rows: [['Query type not supported. Please use SELECT statements.']],
    rowCount: 1,
    executionTime: Date.now() - startTime
  };
};

// Get CSV schema information
export const getCSVSchema = (data: CSVData): string => {
  return `
CSV Data Schema:
The data is from the Annual Enterprise Survey 2024 Financial Year (Provisional) with the following columns:
${data.headers.map((header, index) => `- ${header}: Column ${index + 1}`).join('\n')}

Available columns: ${data.headers.join(', ')}

Examples:
- "Show all data" → SELECT * FROM survey_data LIMIT 10
- "Find specific industry" → SELECT * FROM survey_data WHERE Industry_name_NZSIOC LIKE '%Agriculture%'
- "Show financial performance" → SELECT * FROM survey_data WHERE Variable_category = 'Financial performance'
`;
};