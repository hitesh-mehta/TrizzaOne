
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
}

interface BototatoProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Botato: React.FC<BototatoProps> = ({ isOpen, onToggle }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: t('chatbot.welcome'),
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatBotResponse = (response: string, data?: any) => {
    // Check if response contains structured data
    if (data && Array.isArray(data)) {
      let formattedContent = response;
      
      // Add a summary of the data
      formattedContent += `\n\n📊 **Data Summary:**\n`;
      formattedContent += `• Found ${data.length} records\n`;
      
      if (data.length > 0) {
        const sampleRecord = data[0];
        const keys = Object.keys(sampleRecord);
        formattedContent += `• Fields: ${keys.join(', ')}\n`;
        
        // Show top 3 records in a formatted way
        const displayRecords = data.slice(0, 3);
        formattedContent += `\n📋 **Sample Records:**\n`;
        
        displayRecords.forEach((record, index) => {
          formattedContent += `\n**Record ${index + 1}:**\n`;
          Object.entries(record).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              formattedContent += `• ${key}: ${value}\n`;
            }
          });
        });
        
        if (data.length > 3) {
          formattedContent += `\n... and ${data.length - 3} more records.`;
        }
      }
      
      return formattedContent;
    }
    
    return response;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if user is asking for modifications
      const modificationKeywords = ['update', 'create', 'delete', 'modify', 'insert', 'remove', 'add', 'change', 'alter', 'drop'];
      const isModificationRequest = modificationKeywords.some(keyword => 
        currentQuery.toLowerCase().includes(keyword)
      );

      if (isModificationRequest) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: t('chatbot.noModificationWarning'),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        return;
      }

      console.log('Sending query to Botato:', currentQuery);

      // Call the edge function using Supabase client
      const { data, error } = await supabase.functions.invoke('botato-query', {
        body: {
          query: currentQuery,
        },
      });

      console.log('Botato response:', data, error);

      if (error) {
        throw new Error(error.message || 'Failed to get response from Botato');
      }

      // Format the response for better presentation
      const formattedContent = formatBotResponse(data?.response || t('chatbot.error'), data?.data);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: formattedContent,
        timestamp: new Date(),
        data: data?.data
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: t('chatbot.error'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: t('chatbot.error'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-mintGreen hover:bg-mintGreen/90 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-2xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="h-5 w-5 text-mintGreen" />
          {t('chatbot.title')}
        </CardTitle>
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4 pt-0 min-h-0">
        <ScrollArea className="flex-1 mb-4 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-mintGreen text-white'
                      : 'bg-muted text-foreground border'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'bot' && <Bot className="h-4 w-4 mt-0.5 text-mintGreen flex-shrink-0" />}
                    {message.type === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      {message.type === 'bot' && (
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="h-6 px-2 text-xs"
                          >
                            {copiedMessageId === message.id ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground max-w-[85%] rounded-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-mintGreen" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-mintGreen rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-mintGreen rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-mintGreen rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2 flex-shrink-0">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatbot.placeholder')}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Botato;
