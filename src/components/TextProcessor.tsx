import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, RotateCcw, Type, Hash, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcessingResult {
  type: string;
  value: string | number;
  icon: React.ReactNode;
}

const TextProcessor = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const { toast } = useToast();

  const processText = (text: string) => {
    if (!text.trim()) {
      setResults([]);
      return;
    }

    const newResults: ProcessingResult[] = [
      {
        type: 'Character Count',
        value: text.length,
        icon: <Hash className="w-4 h-4" />
      },
      {
        type: 'Word Count',
        value: text.trim().split(/\s+/).filter(word => word.length > 0).length,
        icon: <Type className="w-4 h-4" />
      },
      {
        type: 'Uppercase',
        value: text.toUpperCase(),
        icon: <Type className="w-4 h-4" />
      },
      {
        type: 'Lowercase',
        value: text.toLowerCase(),
        icon: <Type className="w-4 h-4" />
      },
      {
        type: 'Title Case',
        value: text.replace(/\w\S*/g, (txt) => 
          txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        ),
        icon: <Type className="w-4 h-4" />
      },
      {
        type: 'Reversed',
        value: text.split('').reverse().join(''),
        icon: <RotateCcw className="w-4 h-4" />
      },
      {
        type: 'Line Count',
        value: text.split('\n').length,
        icon: <Hash className="w-4 h-4" />
      },
      {
        type: 'Reading Time',
        value: `${Math.ceil(text.trim().split(/\s+/).length / 200)} min`,
        icon: <Clock className="w-4 h-4" />
      }
    ];

    setResults(newResults);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const clearAll = () => {
    setInput('');
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Text Processor
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform and analyze your text with multiple operations. Enter any text and see instant results.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Input</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAll}
                  className="hover:bg-secondary"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
              <Textarea
                placeholder="Enter your text here..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  processText(e.target.value);
                }}
                className="min-h-[300px] resize-none bg-muted border-border focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {input.length} characters
                </Badge>
                <Badge variant="secondary">
                  {input.trim().split(/\s+/).filter(word => word.length > 0).length} words
                </Badge>
              </div>
            </div>
          </Card>

          {/* Output Section */}
          <Card className="p-6 bg-card border-border">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Output</h2>
              
              {results.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <div className="text-center space-y-2">
                    <Type className="w-12 h-12 mx-auto opacity-50" />
                    <p>Enter text to see transformations</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {result.icon}
                        <span className="font-medium text-sm">{result.type}</span>
                      </div>
                      
                      {typeof result.value === 'string' && result.value.length > 50 ? (
                        <div className="relative">
                          <Textarea
                            value={result.value}
                            readOnly
                            className="min-h-[100px] bg-muted border-border resize-none"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-secondary"
                            onClick={() => copyToClipboard(result.value.toString())}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-muted rounded-md p-3">
                          <span className="font-mono text-sm break-all">
                            {result.value}
                          </span>
                          {typeof result.value === 'string' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 flex-shrink-0 hover:bg-secondary"
                              onClick={() => copyToClipboard(result.value.toString())}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TextProcessor;