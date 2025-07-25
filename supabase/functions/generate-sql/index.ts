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
    const { question } = await req.json()
    
    // Get OpenAI API key from Supabase secrets
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const schema = `
CSV Data Schema:
The data is from the Annual Enterprise Survey 2024 Financial Year (Provisional) with the following columns:
- Year: Survey year (2024)
- Industry_aggregation_NZSIOC: Industry aggregation level (e.g., "Level 1")
- Industry_code_NZSIOC: Industry code 
- Industry_name_NZSIOC: Industry name (e.g., "All industries", "Agriculture, forestry and fishing")
- Units: Unit of measurement (e.g., "Dollars (millions)", "Number")
- Variable_code: Variable identifier (e.g., "H01", "H04")
- Variable_name: Variable description (e.g., "Total income", "Sales, government funding, grants and subsidies")
- Variable_category: Category (e.g., "Financial performance", "Employment")
- Value: The actual data value
- Industry_code_ANZSIC06: ANZSIC06 industry classification

Note: This is CSV data, so use simple SELECT statements. The table name should be treated as "survey_data".
Available columns: Year, Industry_aggregation_NZSIOC, Industry_code_NZSIOC, Industry_name_NZSIOC, Units, Variable_code, Variable_name, Variable_category, Value, Industry_code_ANZSIC06

Examples:
- "Show all total income data" → SELECT * FROM survey_data WHERE Variable_name = 'Total income'
- "Find agriculture industry data" → SELECT * FROM survey_data WHERE Industry_name_NZSIOC LIKE '%Agriculture%'
- "Show financial performance variables" → SELECT * FROM survey_data WHERE Variable_category = 'Financial performance'
`;

    const prompt = `
You are an expert SQL generator for CSV data analysis. Given the CSV schema below, convert the English question to a simple SQL SELECT statement.

Schema:
${schema}

Question: ${question}

Generate a SQL query that works with CSV data. Use simple WHERE clauses with = or LIKE operators. Always include LIMIT 100 unless specifically asked for all data.

SQL:
`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo-instruct',
        prompt: prompt,
        temperature: 0,
        max_tokens: 150,
        stop: ['\n\n']
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const sql = data.choices[0].text.trim()

    return new Response(
      JSON.stringify({ sql }),
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