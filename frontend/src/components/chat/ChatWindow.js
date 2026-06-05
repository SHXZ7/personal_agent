"use client";

import { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import InputBar from "./InputBar";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ triggerQuery, clearTriggerQuery }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "System initialized. Factual grounding parameters loaded. I am Mohammed Shaaz's AI Representative, powered by llama-3.3-70b-versatile and a local Qdrant knowledge base. Ask me about Shaaz's repositories, technical skills, or work history.",
      sources: []
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle queries triggered externally (e.g. from clicking a project card)
  useEffect(() => {
    if (triggerQuery && !isLoading) {
      const executeTriggeredQuery = async () => {
        const queryText = triggerQuery;
        
        // Construct history before appending the new user message
        const currentHistory = messages.map(msg => ({
          role: msg.role,
          text: msg.text
        }));

        setMessages((prev) => [...prev, { role: "user", text: queryText }]);
        setIsLoading(true);
        clearTriggerQuery();

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(`${apiUrl}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: queryText,
              history: currentHistory
            }),
          });

          if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
          }

          const data = await response.json();
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: data.answer,
              sources: data.sources || []
            },
          ]);
        } catch (error) {
          console.error("Error executing triggered chat:", error);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: "System Error: Unable to establish connection to the backend agent service. Please verify that the FastAPI server is running on port 8000.",
              sources: ["system_check"]
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      };

      executeTriggeredQuery();
    }
  }, [triggerQuery, isLoading, messages, clearTriggerQuery]);

  const handleSubmit = async () => {
    const userMessage = input.trim();
    if (!userMessage) return;

    // Construct history before updating messages state
    const currentHistory = messages.map(msg => ({
      role: msg.role,
      text: msg.text
    }));

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: currentHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources || []
        },
      ]);
    } catch (error) {
      console.error("Error fetching chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "System Error: Unable to establish connection to the backend agent service. Please verify that the FastAPI server is running on port 8000.",
          sources: ["system_check"]
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-0 bg-[#080810]/50 border border-white/5 rounded-sm overflow-hidden flex-1 backdrop-blur-sm">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <InputBar
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
