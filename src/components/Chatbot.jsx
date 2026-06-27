import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Mic, Lock } from 'lucide-react';
import { db } from '../lib/supabase';
import { sendMessageToGemini } from '../lib/gemini';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I am your ASC Manager AI Assistant. I can help with questions about surgery schedules, CPT codes, patient management, OR block schedules, and more. How can I assist you today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  
  // Database context state
  const [surgeons, setSurgeons] = useState([]);
  const [patients, setPatients] = useState([]);
  const [cptCodes, setCptCodes] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [orBlockSchedule, setOrBlockSchedule] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [data, surgs, pats, cpts, surgies, orBlocks] = await Promise.all([
            db.getSettings(),
            db.getSurgeons().catch(() => []),
            db.getPatients().catch(() => []),
            db.getCPTCodes().catch(() => []),
            db.getSurgeries().catch(() => []),
            db.getORBlockSchedule().catch(() => [])
          ]);
          
          const localAllowedEmail = localStorage.getItem('ai_allowed_email') || '';
          setSettings({ ...data, ai_allowed_email: data?.ai_allowed_email || localAllowedEmail });
          
          setSurgeons(surgs);
          setPatients(pats);
          setCptCodes(cpts);
          setSurgeries(surgies);
          setOrBlockSchedule(orBlocks);
        } catch (err) {
          console.error('Failed to load data for Chatbot:', err);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    // Check if API key is configured
    if (!settings || !settings.gemini_api_key) {
      setTimeout(() => {
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: 'Error: Gemini API Key is not configured. Please add it in the Settings page under AI Configuration.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      // Call Gemini API using the service from the old project
      // Filter out the initial welcome message (id: 1) because Gemini API requires the first message in history to be from 'user'
      const history = messages
        .filter(m => m.id !== 1 && (m.type === 'user' || m.type === 'bot'))
        .map(m => ({ role: m.type === 'bot' ? 'model' : 'user', text: m.text }));

      const prepareContextData = () => {
        const contextParts = [];
        contextParts.push(`Current System Date: ${new Date().toISOString().split('T')[0]}`);
        
        if (surgeons.length > 0) {
            contextParts.push(`Available Surgeons (Total: ${surgeons.length}):\n${surgeons.map(s => `- ${s.name} (${s.specialty})`).join('\n')}`);
        }
        
        if (patients.length > 0) {
            contextParts.push(`Patient Directory (Total: ${patients.length}):\n${patients.map(p => `- [ID: ${p.id}] ***REDACTED_NAME*** (DOB: ***REDACTED***, MRN: ***REDACTED***)`).join('\n')}`);
        }
        
        if (orBlockSchedule.length > 0) {
            contextParts.push(`OR Block Schedule (Total: ${orBlockSchedule.length}):\n${orBlockSchedule.map(block => `- ${block.room_name} (${block.day_of_week}): ${block.provider_name} [${block.start_time}-${block.end_time}]`).join('\n')}`);
        }
        
        if (cptCodes.length > 0) {
            contextParts.push(`CPT Codes Database (Total: ${cptCodes.length}, Sample of 50):\n${cptCodes.slice(0, 50).map(c => `- ${c.code}: ${c.description} (Avg Cost: $${c.cost})`).join('\n')}`);
        }
        
        if (surgeries.length > 0) {
            contextParts.push(`Surgeries (Total: ${surgeries.length}):\n${surgeries.map(s => `- Date: ${s.date}, Surgeon: ${s.doctor_name || s.surgeons?.name || 'Unknown'}, Status: ${s.status}`).join('\n')}`);
        }
        
        return contextParts.join('\n\n');
      };

      const contextData = prepareContextData();
      const botReply = await sendMessageToGemini(userMessage.text, history, contextData);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Gemini API Error:', err);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Sorry, I encountered an error communicating with the AI service. Details: ${err.message}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div style={{ background: '#10b981', width: '8px', height: '8px', borderRadius: '50%' }}></div>
              <h3 className="chatbot-title">ASC Assistant</h3>
              <div className="chatbot-badge">
                <Lock size={12} />
                <span>PHI PROTECTED</span>
              </div>
            </div>
            <button className="chatbot-close-btn" onClick={toggleChat} aria-label="Close Chat">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.type}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                <span className="chat-time">{msg.time}</span>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="typing-indicator" style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                  <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form className="chatbot-input-area" onSubmit={handleSend}>
            <div className="chatbot-input-wrapper">
              <Mic size={18} className="chatbot-mic-icon" />
              <input
                type="text"
                className="chatbot-input"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              className="chatbot-send-btn" 
              disabled={!input.trim() || isLoading}
              aria-label="Send Message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          className="chatbot-toggle-btn" 
          onClick={toggleChat}
          aria-label="Open AI Assistant"
        >
          <Sparkles size={24} />
        </button>
      )}
      
      {/* Inline style for the typing indicator animation since it's small */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
