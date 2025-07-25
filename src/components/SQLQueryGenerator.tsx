import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  Bot, 
  Play, 
  Copy, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadCSVData, executeCSVQuery, CSVData } from '@/lib/csvUtils';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

const SQLQueryGenerator = () => {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');
  const [showAPIConfig, setShowAPIConfig] = useState(false);
  const [llmApiKey, setLlmApiKey] = useState('');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isLoadingCSV, setIsLoadingCSV] = useState(false);
  const [useLocalCSV, setUseLocalCSV] = useState(false);
  
  const { toast } = useToast();

  // Load CSV data on component mount
  useEffect(() => {
    loadCSVDataFromFile();
  }, []);

  const loadCSVDataFromFile = async () => {
    setIsLoadingCSV(true);
    try {
      // Use sample data for better performance
      const data = await loadCSVData('/sample_data.csv');
      setCsvData(data);
      toast({
        title: "CSV Data Loaded!",
        description: `Loaded ${data.rows.length} rows with ${data.headers.length} columns (sample data)`,
      });
    } catch (err) {
      console.error('Failed to load CSV data:', err);
      toast({
        title: "CSV Load Failed",
        description: "Could not load CSV data. Using server-side processing.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCSV(false);
    }
  };

  // Generate SQL using simple rules or AI
  const generateSQLQuery = async (naturalLanguage: string) => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Try to use Supabase Edge Function first
      const response = await fetch('/functions/v1/generate-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: naturalLanguage
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setGeneratedSQL(data.sql);
        toast({
          title: "SQL Generated!",
          description: "Your natural language query has been converted to SQL",
        });
        return;
      }
      
      // Fallback to simple rule-based generation
      const simpleSQL = generateSimpleSQL(naturalLanguage);
      setGeneratedSQL(simpleSQL);
      toast({
        title: "SQL Generated (Local)!",
        description: "Generated SQL using local processing",
      });
      
    } catch (err) {
      // Try simple rule-based generation as fallback
      try {
        const simpleSQL = generateSimpleSQL(naturalLanguage);
        setGeneratedSQL(simpleSQL);
        toast({
          title: "SQL Generated (Fallback)!",
          description: "Generated SQL using rule-based approach",
        });
      } catch (fallbackErr) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate SQL';
        setError(errorMessage);
        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Simple rule-based SQL generation
  const generateSimpleSQL = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Basic patterns
    if (lowerQuery.includes('all') && lowerQuery.includes('data')) {
      return 'SELECT * FROM survey_data LIMIT 100';
    }
    
    if (lowerQuery.includes('total income')) {
      return "SELECT * FROM survey_data WHERE Variable_name = 'Total income' LIMIT 50";
    }
    
    if (lowerQuery.includes('agriculture') || lowerQuery.includes('farming')) {
      return "SELECT * FROM survey_data WHERE Industry_name_NZSIOC LIKE '%Agriculture%' LIMIT 50";
    }
    
    if (lowerQuery.includes('financial performance')) {
      return "SELECT * FROM survey_data WHERE Variable_category = 'Financial performance' LIMIT 50";
    }
    
    if (lowerQuery.includes('employment')) {
      return "SELECT * FROM survey_data WHERE Variable_category = 'Employment' LIMIT 50";
    }
    
    if (lowerQuery.includes('industry') && lowerQuery.includes('top')) {
      return "SELECT Industry_name_NZSIOC, Value FROM survey_data WHERE Variable_name = 'Total income' ORDER BY CAST(Value AS DECIMAL) DESC LIMIT 10";
    }
    
    // Default query
    return 'SELECT * FROM survey_data LIMIT 20';
  };

  // Execute query using server or local CSV
  const executeQuery = async (sqlQuery: string) => {
    setIsExecuting(true);
    setError('');
    
    try {
      // Try server-side execution first
      if (!useLocalCSV) {
        const response = await fetch('/functions/v1/execute-sql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: sqlQuery
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          setQueryResult({
            columns: data.columns || [],
            rows: data.rows || [],
            rowCount: data.rowCount || 0,
            executionTime: data.executionTime || 0
          });

          toast({
            title: "Query Executed!",
            description: `Retrieved ${data.rowCount || 0} rows from server`,
          });
          return;
        }
      }
      
      // Fallback to local CSV processing
      if (csvData) {
        const result = executeCSVQuery(sqlQuery, csvData);
        setQueryResult(result);
        toast({
          title: "Query Executed (Local)!",
          description: `Retrieved ${result.rowCount} rows from local CSV`,
        });
      } else {
        throw new Error('No CSV data available for local processing');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute query';
      setError(errorMessage);
      toast({
        title: "Execution Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "SQL query copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const handleExampleQuery = (example: string) => {
    setNaturalLanguageQuery(example);
  };

  const exampleQueries = [
    "Show all total income data for different industries",
    "Find financial performance data for agriculture industry",
    "Show the top 10 industries by total income",
    "Get all employment-related variables",
    "Show data for Level 1 industry aggregation only",
    "Find all variables measured in dollars (millions)"
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Natural Language to SQL
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Convert natural language queries to SQL and execute them against CSV data from the Annual Enterprise Survey 2024
          </p>
        </div>

        {/* Data Source Info */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Data Source</h2>
            </div>
            <div className="flex items-center gap-2">
              {csvData && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {csvData.rows.length} rows loaded
                </Badge>
              )}
              {isLoadingCSV && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading CSV...
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Dataset:</strong> Annual Enterprise Survey 2024 Financial Year (Provisional)</p>
            <p><strong>Available Columns:</strong> Year, Industry_aggregation_NZSIOC, Industry_code_NZSIOC, Industry_name_NZSIOC, Units, Variable_code, Variable_name, Variable_category, Value, Industry_code_ANZSIC06</p>
            <p><strong>Data Types:</strong> Financial performance, Employment, and other enterprise metrics</p>
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useLocalCSV}
                onChange={(e) => setUseLocalCSV(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Use local CSV processing</span>
            </label>
          </div>
          
          {showAPIConfig && (
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="llm-api-key">LLM API Key (Optional - for custom configurations)</Label>
                <Input
                  id="llm-api-key"
                  type="password"
                  placeholder="Enter your LLM API key (OpenAI, Anthropic, etc.)"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Query Input Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Bot className="w-6 h-6" />
                Natural Language Query
              </h2>
              
              <Textarea
                placeholder="Describe what data you want from the enterprise survey in plain English..."
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                className="min-h-[150px] resize-none bg-muted border-border focus:ring-primary"
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Example Queries:</Label>
                <div className="flex flex-wrap gap-2">
                  {exampleQueries.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleExampleQuery(example)}
                      className="text-xs"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => generateSQLQuery(naturalLanguageQuery)}
                disabled={!naturalLanguageQuery.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating SQL...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    Generate SQL Query
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated SQL Section */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  Generated SQL
                </h2>
                {generatedSQL && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedSQL)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>

              {generatedSQL ? (
                <div className="space-y-4">
                  <Textarea
                    value={generatedSQL}
                    onChange={(e) => setGeneratedSQL(e.target.value)}
                    className="min-h-[150px] font-mono text-sm bg-muted border-border"
                  />
                  
                  <Button
                    onClick={() => executeQuery(generatedSQL)}
                    disabled={!generatedSQL.trim() || isExecuting}
                    className="w-full"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing Query...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Execute Query on CSV Data
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Database className="w-12 h-12 mx-auto opacity-50" />
                    <p>Enter a natural language query to generate SQL</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-destructive/10 border-destructive/20">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </Card>
        )}

        {/* Query Results */}
        {queryResult && (
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  Query Results
                </h2>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {queryResult.rowCount} rows
                  </Badge>
                  <Badge variant="secondary">
                    {queryResult.executionTime}ms
                  </Badge>
                </div>
              </div>

              {queryResult.rows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        {queryResult.columns.map((column, index) => (
                          <th
                            key={index}
                            className="border border-border px-4 py-2 text-left font-medium"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-muted/50">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border border-border px-4 py-2 font-mono text-sm"
                            >
                              {cell === null ? (
                                <span className="text-muted-foreground italic">NULL</span>
                              ) : (
                                String(cell)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No results returned</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SQLQueryGenerator;