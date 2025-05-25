
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  query?: string;
  data?: any[];
}

const Botato: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chatbot.welcome'),
      isBot: true,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/functions/v1/query-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      const result = await response.json();

      if (response.ok) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: result.message || 'Query executed successfully',
          isBot: true,
          timestamp: new Date(),
          query: result.query,
          data: result.data,
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(result.error || 'Failed to process query');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error.message === "I can only fetch data. For modifications, please update the database manually." 
          ? t('chatbot.noModification') 
          : t('chatbot.error'),
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatData = (data: any[]) => {
    if (!data || data.length === 0) return 'No results found.';
    
    if (data.length === 1 && data[0].message) {
      return data[0].message;
    }

    // Create a simple table format
    const headers = Object.keys(data[0]);
    let table = headers.join(' | ') + '\n';
    table += headers.map(() => '---').join(' | ') + '\n';
    
    data.slice(0, 10).forEach(row => { // Limit to 10 rows for display
      table += headers.map(header => row[header] || '').join(' | ') + '\n';
    });

    if (data.length > 10) {
      table += `\n... and ${data.length - 10} more rows`;
    }

    return table;
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-96 shadow-lg z-50 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Bot className="h-5 w-5 text-mintGreen" />
          <span>{t('chatbot.title')}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isBot
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-mintGreen text-white'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.isBot ? (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      
                      {message.query && (
                        <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                          <strong>Query:</strong> {message.query}
                        </div>
                      )}
                      
                      {message.data && message.data.length > 0 && (
                        <div className="mt-2 p-2 bg-black/10 rounded text-xs">
                          <strong>Results:</strong>
                          <pre className="mt-1 whitespace-pre-wrap font-mono">
                            {formatData(message.data)}
                          </pre>
                        </div>
                      )}
                      
                      <span className="text-xs opacity-70 block mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm">{t('chatbot.thinking')}</span>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-100"></div>
                      <div className="w-1 h-1 bg-current rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chatbot.placeholder')}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Botato;
