import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CSV parsing utility
function parseCSV(csvText: string): { headers: string[], rows: string[][] } {
  const lines = csvText.split('\n')
  if (lines.length === 0) return { headers: [], rows: [] }
  
  // Parse header line
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const rows: string[][] = []
  let i = 1
  
  while (i < lines.length) {
    if (lines[i].trim() === '') {
      i++
      continue
    }
    
    const { row, nextIndex } = parseCSVRow(lines, i)
    if (row.length > 0) {
      // Ensure row has same number of columns as headers
      while (row.length < headers.length) {
        row.push('')
      }
      rows.push(row.slice(0, headers.length))
    }
    i = nextIndex
  }
  
  return { headers, rows }
}

// Parse a single CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// Parse a CSV row that might span multiple lines
function parseCSVRow(lines: string[], startIndex: number): { row: string[], nextIndex: number } {
  let currentLine = lines[startIndex]
  let lineIndex = startIndex
  
  // Count quotes to determine if row is complete
  let quoteCount = 0
  for (const char of currentLine) {
    if (char === '"') quoteCount++
  }
  
  // If odd number of quotes, row continues on next line
  while (quoteCount % 2 !== 0 && lineIndex + 1 < lines.length) {
    lineIndex++
    currentLine += '\n' + lines[lineIndex]
    for (const char of lines[lineIndex]) {
      if (char === '"') quoteCount++
    }
  }
  
  return {
    row: parseCSVLine(currentLine),
    nextIndex: lineIndex + 1
  }
}

// Simple SQL-like query processor for CSV data
function executeCSVQuery(query: string, data: { headers: string[], rows: string[][] }) {
  const startTime = Date.now()
  
  // Normalize query
  const normalizedQuery = query.toLowerCase().trim()
  
  if (normalizedQuery.includes('select')) {
    let filteredRows = data.rows
    let selectedColumns = data.headers
    let columnIndices = data.headers.map((_, i) => i)
    
    // Handle SELECT columns
    const selectMatch = normalizedQuery.match(/select\s+(.*?)\s+from/i)
    if (selectMatch && selectMatch[1].trim() !== '*') {
      const columns = selectMatch[1].split(',').map(c => c.trim())
      columnIndices = columns.map(col => {
        const index = data.headers.findIndex(h => h.toLowerCase() === col.toLowerCase())
        return index >= 0 ? index : 0
      })
      selectedColumns = columnIndices.map(i => data.headers[i])
    }
    
    // Handle WHERE clause
    const whereMatch = normalizedQuery.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i)
    if (whereMatch) {
      const whereClause = whereMatch[1]
      filteredRows = data.rows.filter(row => {
        // Simple WHERE processing - supports basic conditions
        if (whereClause.includes('=')) {
          const [column, value] = whereClause.split('=').map(s => s.trim())
          const columnIndex = data.headers.findIndex(h => h.toLowerCase() === column.toLowerCase())
          if (columnIndex >= 0) {
            const cleanValue = value.replace(/['"]/g, '')
            return row[columnIndex]?.toLowerCase().includes(cleanValue.toLowerCase())
          }
        }
        return true
      })
    }
    
    // Handle LIMIT clause
    const limitMatch = normalizedQuery.match(/limit\s+(\d+)/i)
    if (limitMatch) {
      const limit = parseInt(limitMatch[1])
      filteredRows = filteredRows.slice(0, limit)
    }
    
    // Select only requested columns
    const resultRows = filteredRows.map(row => 
      columnIndices.map(i => row[i] || '')
    )
    
    const executionTime = Date.now() - startTime
    
    return {
      columns: selectedColumns,
      rows: resultRows,
      rowCount: resultRows.length,
      executionTime
    }
  }
  
  // Default response for unsupported queries
  return {
    columns: ['message'],
    rows: [['Query type not supported. Please use SELECT statements.']],
    rowCount: 1,
    executionTime: Date.now() - startTime
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    
    // Read CSV file from the same directory
    const csvPath = './sample_data.csv'
    let csvText: string
    
    try {
      csvText = await Deno.readTextFile(csvPath)
    } catch (error) {
      // Fallback to full data if sample not available
      try {
        csvText = await Deno.readTextFile('./annual-enterprise-survey-2024-financial-year-provisional.csv')
      } catch (fallbackError) {
        throw new Error(`Could not read CSV file: ${fallbackError.message}`)
      }
    }
    
    // Parse CSV data
    const csvData = parseCSV(csvText)
    
    // Execute query on CSV data
    const result = executeCSVQuery(query, csvData)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})