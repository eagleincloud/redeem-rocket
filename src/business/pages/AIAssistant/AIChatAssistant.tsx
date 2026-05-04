import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Sparkles, MessageCircle, TrendingUp, Zap } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestion?: ChatSuggestion;
}

interface ChatSuggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  icon: string;
}

// Mock messages
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    type: 'assistant',
    content: "Hi! I'm your Redeem Rocket AI Assistant. I can help you with lead management, email campaigns, automation, and more. What would you like help with today?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'user',
    content: 'My lead conversion rate has dropped. What should I do?',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'assistant',
    content: 'I analyzed your data and found a few opportunities:\n\n1. **Follow-up timing**: Most opened emails are in the first 2 hours. Consider scheduling follow-ups closer to that window.\n\n2. **Email templates**: Your welcome email has a 32% open rate, but follow-ups are only 18%. Try using similar design patterns.\n\n3. **Lead quality**: 40% of new leads this month are from less-qualified sources. Consider adjusting your lead source strategy.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    suggestion: {
      id: 's1',
      title: 'Create Follow-up Automation',
      description: 'Set up an automatic follow-up email 2 hours after initial contact for better engagement',
      action: 'create_automation',
      actionLabel: 'Create Rule',
      icon: '🤖',
    },
  },
];

const QUICK_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'q1',
    title: 'Improve Email Open Rates',
    description: 'Get tips on subject lines and send times',
    action: 'suggest_email_improvement',
    actionLabel: 'Get Tips',
    icon: '📧',
  },
  {
    id: 'q2',
    title: 'Optimize Lead Pipeline',
    description: 'Analyze your pipeline and identify bottlenecks',
    action: 'analyze_pipeline',
    actionLabel: 'Analyze',
    icon: '📊',
  },
  {
    id: 'q3',
    title: 'Create Automation Rules',
    description: 'Get suggestions for automation to save time',
    action: 'suggest_automation',
    actionLabel: 'Suggest Rules',
    icon: '⚡',
  },
  {
    id: 'q4',
    title: 'Segment Your Audience',
    description: 'Learn how to better target your campaigns',
    action: 'suggest_segmentation',
    actionLabel: 'Learn More',
    icon: '👥',
  },
];

export const AIChatAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Based on your query about "${inputValue}", here are my insights:\n\nYour recent data shows positive trends in lead engagement. Consider implementing automated follow-up sequences to maximize conversion potential.`,
        timestamp: new Date().toISOString(),
        suggestion: {
          id: `s${Date.now()}`,
          title: 'Create Lead Follow-up Sequence',
          description: 'Automatically follow up with engaged leads within 24 hours',
          action: 'create_campaign',
          actionLabel: 'Create Now',
          icon: '📧',
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickSuggestion = (suggestion: ChatSuggestion) => {
    setInputValue(suggestion.title);
  };

  const handleSuggestionAction = (actionType: string) => {
    switch (actionType) {
      case 'create_automation':
        navigate('/app/automation/rules/new');
        break;
      case 'create_campaign':
        navigate('/app/campaigns/new');
        break;
      case 'analyze_pipeline':
        navigate('/app/leads');
        break;
      default:
        console.log('Action:', actionType);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
              <p className="text-sm text-muted-foreground mt-1">Get intelligent insights and suggestions for your business</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 px-6 py-8 max-w-7xl mx-auto w-full overflow-hidden">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex-1 flex flex-col justify-center items-center text-center gap-8">
            <div>
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="m-0 text-xl font-bold text-foreground">
                Welcome to AI Assistant
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask me anything about your business, leads, campaigns, or automation
              </p>
            </div>

            {/* Quick Suggestions Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="p-4 rounded-lg bg-secondary border border-border text-left hover:bg-secondary hover:border-primary transition-colors"
                >
                  <div className="text-2xl mb-2">
                    {suggestion.icon}
                  </div>
                  <p className="m-0 text-sm font-semibold text-foreground">
                    {suggestion.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {suggestion.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Chat interface
          <>
            {/* Messages */}
            <Card className="flex-1 overflow-hidden">
              <CardContent className="flex flex-col gap-3 overflow-y-auto h-full p-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {/* Message */}
                    <div className={`flex gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'assistant' && (
                        <div className="flex justify-center items-start w-8 h-8 rounded-full bg-purple-500/10 mt-1 flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                      )}

                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-secondary border border-border'
                        }`}
                      >
                        <p className="m-0 text-sm text-foreground whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      {message.type === 'user' && (
                        <div className="flex justify-center items-start w-8 h-8 rounded-full bg-blue-500/10 mt-1 flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                    </div>

                    {/* Suggestion Card */}
                    {message.suggestion && (
                      <div className="mt-2 ml-10">
                        <Card>
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <p className="m-0 text-sm font-semibold text-foreground">
                                {message.suggestion.title}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {message.suggestion.description}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleSuggestionAction(message.suggestion?.action || '')
                              }
                              className="flex-shrink-0"
                            >
                              {message.suggestion.actionLabel}
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 items-start">
                    <div className="flex justify-center items-start w-8 h-8 rounded-full bg-purple-500/10 mt-1">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-secondary border border-border">
                      <p className="m-0 text-sm text-muted-foreground">
                        Thinking...
                      </p>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>
            </Card>

            {/* Input */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        handleSendMessage();
                      }
                    }}
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AIChatAssistant;
