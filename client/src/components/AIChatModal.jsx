import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader, Bot, User, Sparkles, MapPin, Calendar, Wand2 } from 'lucide-react';
import { aiAPI } from '../api';
import toast from 'react-hot-toast';
import Button from './Button';
import { scaleIn } from '../utils/animations';

export default function AIChatModal({ isOpen, onClose, tripContext = null, onGenerateItinerary }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Add welcome message if no messages
      if (messages.length === 0) {
        const welcomeMessage = tripContext
          ? `Hi! I'm Nostia AI, your travel planning assistant. I see you're planning a trip${tripContext.destination ? ` to **${tripContext.destination}**` : ''}! How can I help you today?\n\nI can help with:\n- Creating detailed itineraries\n- Activity recommendations\n- Budget tips\n- Packing suggestions`
          : `Hi! I'm Nostia AI, your travel planning assistant. How can I help you plan your next adventure?\n\nI can help with:\n- Destination recommendations\n- Creating detailed itineraries\n- Budget planning\n- Packing suggestions`;

        setMessages([{ role: 'assistant', content: welcomeMessage }]);
      }
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const context = tripContext ? {
        tripTitle: tripContext.title,
        destination: tripContext.destination,
        startDate: tripContext.startDate,
        endDate: tripContext.endDate,
        participants: tripContext.participants?.length,
      } : {};

      const response = await aiAPI.chat(userMessage, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (err) {
      toast.error('Failed to get AI response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I couldn't process that request. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = async (action) => {
    if (isLoading) return;

    let message = '';
    switch (action) {
      case 'itinerary':
        if (tripContext?.destination) {
          message = `Create a detailed day-by-day itinerary for my trip to ${tripContext.destination}`;
        } else {
          message = 'Help me create a travel itinerary';
        }
        break;
      case 'activities':
        if (tripContext?.destination) {
          message = `What are the best activities and things to do in ${tripContext.destination}?`;
        } else {
          message = 'Recommend some fun travel activities';
        }
        break;
      case 'budget':
        if (tripContext?.destination) {
          message = `What's a reasonable budget for a trip to ${tripContext.destination}?`;
        } else {
          message = 'Give me budget tips for traveling';
        }
        break;
      case 'packing':
        if (tripContext?.destination) {
          message = `What should I pack for my trip to ${tripContext.destination}?`;
        } else {
          message = 'Help me create a packing list';
        }
        break;
      default:
        return;
    }

    setInputValue(message);
    // Auto-send after a brief delay
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
      setInputValue('');
      handleQuickMessage(message);
    }, 100);
  };

  const handleQuickMessage = async (message) => {
    setIsLoading(true);
    try {
      const context = tripContext ? {
        tripTitle: tripContext.title,
        destination: tripContext.destination,
        startDate: tripContext.startDate,
        endDate: tripContext.endDate,
        participants: tripContext.participants?.length,
      } : {};

      const response = await aiAPI.chat(message, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response.message }]);
    } catch (err) {
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateItinerary = async () => {
    if (!tripContext || !onGenerateItinerary) return;

    setIsLoading(true);
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Generate a full itinerary for my trip to ${tripContext.destination}`
    }]);

    try {
      const response = await aiAPI.generate('itinerary', {
        destination: tripContext.destination,
        startDate: tripContext.startDate,
        endDate: tripContext.endDate,
        participants: tripContext.participants?.length,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.generatedText
      }]);

      // Optionally pass the generated itinerary back
      if (onGenerateItinerary) {
        onGenerateItinerary(response.generatedText);
      }
    } catch (err) {
      toast.error('Failed to generate itinerary');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I couldn't generate the itinerary. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Headers
        if (line.startsWith('# ')) {
          return <h3 key={i} className="text-lg font-bold mt-2 mb-1">{line.slice(2)}</h3>;
        }
        // List items
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: line.slice(2) }} />;
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          return <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: line.replace(/^\d+\.\s/, '') }} />;
        }
        // Empty lines
        if (!line.trim()) {
          return <br key={i} />;
        }
        // Regular text
        return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />;
      });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          exit="exit"
          className="bg-gray-900 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl border border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Nostia AI</h2>
                <p className="text-xs text-gray-400">Your travel planning assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Trip Context Banner */}
          {tripContext && (
            <div className="px-4 py-2 bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-gray-700">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-purple-300">
                  <MapPin size={14} />
                  <span>{tripContext.destination || 'No destination'}</span>
                </div>
                {tripContext.startDate && (
                  <div className="flex items-center gap-1 text-blue-300">
                    <Calendar size={14} />
                    <span>{tripContext.startDate} - {tripContext.endDate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-4 py-3 border-b border-gray-800 flex gap-2 flex-wrap">
            <button
              onClick={() => handleQuickAction('itinerary')}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-300 rounded-full text-xs hover:bg-purple-600/30 disabled:opacity-50"
            >
              <Wand2 size={12} />
              Create Itinerary
            </button>
            <button
              onClick={() => handleQuickAction('activities')}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-300 rounded-full text-xs hover:bg-blue-600/30 disabled:opacity-50"
            >
              <Sparkles size={12} />
              Activities
            </button>
            <button
              onClick={() => handleQuickAction('budget')}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 text-green-300 rounded-full text-xs hover:bg-green-600/30 disabled:opacity-50"
            >
              Budget Tips
            </button>
            <button
              onClick={() => handleQuickAction('packing')}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-600/20 text-orange-300 rounded-full text-xs hover:bg-orange-600/30 disabled:opacity-50"
            >
              Packing List
            </button>
            {tripContext && onGenerateItinerary && (
              <button
                onClick={handleGenerateItinerary}
                disabled={isLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs hover:opacity-90 disabled:opacity-50 ml-auto"
              >
                <Wand2 size={12} />
                Generate Full Itinerary
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-purple-500 to-blue-500'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <div className="text-sm leading-relaxed">
                    {formatMessage(msg.content)}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader className="animate-spin" size={16} />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your trip..."
                className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-purple-500 focus:outline-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="px-4"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
