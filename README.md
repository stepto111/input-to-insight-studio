# Natural Language to SQL - CSV Edition

## Project Overview

This application converts natural language queries into SQL statements and executes them against CSV data instead of a traditional database. It's specifically designed to work with the Annual Enterprise Survey 2024 Financial Year (Provisional) data.

## Key Features

- **Natural Language Processing**: Convert plain English questions into SQL queries
- **CSV Data Processing**: Query CSV files directly without needing a database
- **Dual Processing Modes**: 
  - Server-side processing using Supabase Edge Functions
  - Client-side fallback using local CSV parsing
- **Interactive Results**: View query results in a formatted table
- **Example Queries**: Pre-built examples for common data exploration tasks

## Data Source

The application uses data from the **Annual Enterprise Survey 2024 Financial Year (Provisional)** with the following columns:

- `Year`: Survey year (2024)
- `Industry_aggregation_NZSIOC`: Industry aggregation level
- `Industry_code_NZSIOC`: Industry code 
- `Industry_name_NZSIOC`: Industry name
- `Units`: Unit of measurement
- `Variable_code`: Variable identifier
- `Variable_name`: Variable description
- `Variable_category`: Category (Financial performance, Employment, etc.)
- `Value`: The actual data value
- `Industry_code_ANZSIC06`: ANZSIC06 industry classification

## How to Use

1. **Enter a Natural Language Query**: Describe what data you want in plain English
   - Example: "Show all total income data for different industries"
   - Example: "Find financial performance data for agriculture industry"

2. **Generate SQL**: Click "Generate SQL Query" to convert your question to SQL

3. **Execute Query**: Click "Execute Query on CSV Data" to run the SQL against the CSV data

4. **View Results**: Results are displayed in a formatted table with execution statistics

## Example Queries

- "Show all total income data for different industries"
- "Find financial performance data for agriculture industry" 
- "Show the top 10 industries by total income"
- "Get all employment-related variables"
- "Show data for Level 1 industry aggregation only"
- "Find all variables measured in dollars (millions)"

## Technical Implementation

### Frontend (React + TypeScript)
- Built with Vite, React, and shadcn-ui components
- Uses PapaParse library for CSV parsing
- Tailwind CSS for styling

### Backend (Supabase Edge Functions)
- `generate-sql`: Converts natural language to SQL using OpenAI API
- `execute-sql`: Executes SQL queries against CSV data

### Fallback Processing
- If server functions are unavailable, the app falls back to client-side processing
- Rule-based SQL generation for common query patterns
- Local CSV parsing and querying

## Setup Instructions

### Prerequisites
- Node.js & npm installed
- OpenAI API key (for AI-powered SQL generation)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration

1. **CSV Data**: The CSV file should be placed in the `public/` directory as `data.csv`
2. **OpenAI API Key**: Set the `OPENAI_API_KEY` environment variable in your Supabase project
3. **Local Processing**: Check "Use local CSV processing" to bypass server functions

## File Structure

```
src/
├── components/
│   ├── SQLQueryGenerator.tsx    # Main application component
│   └── ui/                      # shadcn-ui components
├── lib/
│   ├── csvUtils.ts             # CSV parsing and querying utilities
│   └── utils.ts                # General utilities
├── pages/                      # Page components
└── hooks/                      # Custom React hooks

supabase/functions/
├── generate-sql/               # SQL generation edge function
└── execute-sql/                # SQL execution edge function

public/
└── data.csv                    # CSV data file
```

## Technologies Used

- **Frontend**: Vite, React, TypeScript, shadcn-ui, Tailwind CSS
- **CSV Processing**: PapaParse
- **Backend**: Supabase Edge Functions (Deno)
- **AI Integration**: OpenAI API for natural language processing

## Deployment

The application can be deployed using:
- **Lovable**: Direct deployment from the Lovable platform
- **Vercel/Netlify**: Standard React application deployment
- **Supabase**: For edge functions and hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with sample queries
5. Submit a pull request

## License

This project is built with Lovable and follows standard open source practices.

---

## Original Lovable Project Info

**URL**: https://lovable.dev/projects/5928366b-fa60-46e6-ab0b-4ca0e9f77227

This project was originally created with Lovable and has been modified to work with CSV data instead of traditional databases.
