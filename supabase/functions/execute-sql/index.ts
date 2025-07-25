import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, config } = await req.json()
    
    // This is a mock implementation for demonstration
    // In a real implementation, you would connect to your actual database
    // using the provided config (PostgreSQL, MySQL, SQLite, etc.)
    
    // Mock data based on the schema
    const mockResults = {
      "SELECT * FROM customers": {
        columns: ["id", "name", "email", "join_date"],
        rows: [
          [1, "John Doe", "john@example.com", "2023-01-15"],
          [2, "Jane Smith", "jane@example.com", "2023-02-20"],
          [3, "Bob Johnson", "bob@example.com", "2023-03-10"]
        ],
        rowCount: 3,
        executionTime: 15
      },
      "SELECT * FROM orders": {
        columns: ["id", "customer_name", "product", "quantity", "order_date", "total_amount"],
        rows: [
          [1, "John Doe", "Laptop", 1, "2023-06-01", 999.99],
          [2, "Jane Smith", "Mouse", 2, "2023-06-02", 29.98],
          [3, "Bob Johnson", "Keyboard", 1, "2023-06-03", 79.99]
        ],
        rowCount: 3,
        executionTime: 12
      }
    }

    // Normalize query for mock lookup
    const normalizedQuery = query.trim().toLowerCase()
    let result

    if (normalizedQuery.includes('select') && normalizedQuery.includes('customers')) {
      result = mockResults["SELECT * FROM customers"]
    } else if (normalizedQuery.includes('select') && normalizedQuery.includes('orders')) {
      result = mockResults["SELECT * FROM orders"]
    } else {
      // Default mock result for any other query
      result = {
        columns: ["message"],
        rows: [["Query executed successfully (mock data)"]],
        rowCount: 1,
        executionTime: 5
      }
    }

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