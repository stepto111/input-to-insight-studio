import { useState } from 'react';
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
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

interface DatabaseConfig {
  host: string;
  database: string;
  username: string;
  password: string;
  port: string;
}

const SQLQueryGenerator = () => {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState('');
  const [showDBConfig, setShowDBConfig] = useState(false);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    host: '',
    database: '',
    username: '',
    password: '',
    port: '5432'
  });
  const [llmApiKey, setLlmApiKey] = useState('');
  
  const { toast } = useToast();

  // Updated to use Supabase Edge Function
  const generateSQLQuery = async (naturalLanguage: string) => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Call the Supabase Edge Function
      const response = await fetch('/functions/v1/generate-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: naturalLanguage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate SQL query');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setGeneratedSQL(data.sql);
      toast({
        title: "SQL Generated!",
        description: "Your natural language query has been converted to SQL",
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate SQL';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Updated to use Supabase Edge Function
  const executeQuery = async (sqlQuery: string) => {
    setIsExecuting(true);
    setError('');
    
    try {
      // Call the Supabase Edge Function for SQL execution
      const response = await fetch('/functions/v1/execute-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: sqlQuery,
          config: dbConfig
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute SQL query');
      }

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
        description: `Retrieved ${data.rowCount || 0} rows`,
      });
      
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
    "Show all users who registered in the last 30 days",
    "Find the top 10 products by sales revenue this month",
    "Get customers with more than 5 orders",
    "Show average order value by customer location"
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
            Convert natural language queries to SQL and execute them against your database
          </p>
        </div>

        {/* Configuration Section */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuration
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDBConfig(!showDBConfig)}
            >
              {showDBConfig ? 'Hide' : 'Show'} Settings
            </Button>
          </div>

          {showDBConfig && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="llm-api-key">LLM API Key</Label>
                  <Input
                    id="llm-api-key"
                    type="password"
                    placeholder="Enter your LLM API key (OpenAI, Anthropic, etc.)"
                    value={llmApiKey}
                    onChange={(e) => setLlmApiKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-host">Database Host</Label>
                  <Input
                    id="db-host"
                    placeholder="localhost or your DB host"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">Database Name</Label>
                  <Input
                    id="db-name"
                    placeholder="your_database_name"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, database: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-username">Username</Label>
                  <Input
                    id="db-username"
                    placeholder="database_user"
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-password">Password</Label>
                  <Input
                    id="db-password"
                    type="password"
                    placeholder="database_password"
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">Port</Label>
                  <Input
                    id="db-port"
                    placeholder="5432"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig(prev => ({ ...prev, port: e.target.value }))}
                  />
                </div>
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
                placeholder="Describe what data you want in plain English..."
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
                        Execute Query
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