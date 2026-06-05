"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./ui/Button";

export default function VoiceAgent() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [statusMsg, setStatusMsg] = useState("Tap the bubble to start conversation");
  const [errorMsg, setErrorMsg] = useState("");

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const isConversationActiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const isCancelingRef = useRef(false);
  const isThinkingRef = useRef(isThinking);
  const historyRef = useRef(history);

  // Keep refs in sync to avoid stale closures in browser event loops
  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    isMountedRef.current = true;

    // Initialize SpeechSynthesis reference
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize SpeechRecognition
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg("");
        setStatusMsg("Conversation active. Speak now...");
        
        // Enforce immediate barge-in interruption if AI is speaking
        if (synthRef.current && synthRef.current.speaking) {
          isCancelingRef.current = true;
          synthRef.current.cancel();
          setIsSpeaking(false);
          setTimeout(() => {
            isCancelingRef.current = false;
          }, 50);
        }
      };

      rec.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript.trim()) {
          setTranscript(finalTranscript);
          // Pause listening temporarily to prevent AI from hearing its own speaking
          try {
            rec.stop();
          } catch (e) {
            console.error("Error pausing recognition:", e);
          }
          submitVoiceQuery(finalTranscript);
        }
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === "aborted") {
          // Aborted is normal when we call rec.stop() to speak, so we ignore
          return;
        }
        
        let message = `Microphone input error: ${event.error}`;
        if (event.error === "not-allowed") {
          message = "Microphone permission denied.";
        } else if (event.error === "network") {
          message = "Speech recognition network error. Please check your internet connection.";
        } else if (event.error === "service-not-allowed") {
          message = "Speech recognition service is not allowed by the browser.";
        } else if (event.error === "no-speech") {
          message = "No speech detected. Please speak clearly.";
        }
        
        setErrorMsg(message);
        
        // Disable auto-restart loop for critical or permission errors
        if (["network", "not-allowed", "service-not-allowed", "audio-capture"].includes(event.error)) {
          isConversationActiveRef.current = false;
          setIsListening(false);
          setIsThinking(false);
          setStatusMsg("Conversation stopped due to a critical error.");
        }
      };

      rec.onend = () => {
        setIsListening(false);
        // If the conversation is still active and we are NOT speaking, restart listening
        if (isConversationActiveRef.current && !synthRef.current?.speaking && !isThinkingRef.current) {
          try {
            rec.start();
          } catch (e) {
            // Already listening or starting
          }
        }
      };

      recognitionRef.current = rec;
    } else {
      setErrorMsg("Web Speech API (Speech Recognition) is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
    }

    // Cleanup active speaking on unmount
    return () => {
      isMountedRef.current = false;
      isConversationActiveRef.current = false;
      if (synthRef.current) {
        isCancelingRef.current = true;
        synthRef.current.cancel();
      }
    };
  }, []);

  const submitVoiceQuery = async (queryText) => {
    setStatusMsg("Formulating answer...");
    setIsThinking(true);
    
    // Copy the current history to send as payload
    const currentHistory = historyRef.current.map(msg => ({
      role: msg.role,
      text: msg.text
    }));

    // Optimistically add the new user query to the local history list
    setHistory(prev => [...prev, { role: "user", text: queryText }]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: queryText,
          history: currentHistory,
          voice: true // Request concise voice-grounded RAG formatting
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      setIsThinking(false);
      setResponse(data.answer);
      
      // Append assistant response to local history list
      setHistory(prev => [...prev, { role: "assistant", text: data.answer }]);
      
      setStatusMsg("Speaking response...");
      speakText(data.answer);
    } catch (error) {
      console.error("Error fetching voice response:", error);
      setIsThinking(false);
      setErrorMsg("Could not connect to FastAPI server.");
      setStatusMsg("Failed to get reply.");
      // Resume listening if query failed
      resumeListeningIfActive();
    }
  };

  const speakText = (text) => {
    if (!synthRef.current) return;

    // Enforce immediate cancellation of any active speech
    isCancelingRef.current = true;
    synthRef.current.cancel();
    setTimeout(() => {
      isCancelingRef.current = false;
    }, 50);

    // Remove markdown links or citations before speaking
    const cleanText = text.replace(/\[.*?\]/g, "").replace(/\*+/g, "").trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatusMsg("Response complete. Listening...");
      resumeListeningIfActive();
    };

    utterance.onerror = (e) => {
      // Ignore cancellation/interruption errors, errors without codes, or if component is unmounted
      if (!isMountedRef.current || isCancelingRef.current || e.error === "interrupted" || e.error === "canceled" || !e.error) {
        setIsSpeaking(false);
        return;
      }
      console.error("Speech Synthesis Error:", e);
      setIsSpeaking(false);
      resumeListeningIfActive();
    };

    synthRef.current.speak(utterance);
  };

  const resumeListeningIfActive = () => {
    if (isConversationActiveRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already listening or starting
      }
    }
  };

  const handleStartListening = () => {
    if (!recognitionRef.current) return;
    
    isConversationActiveRef.current = true;
    
    // Stop any active speaking immediately (interruption/barge-in)
    if (synthRef.current) {
      isCancelingRef.current = true;
      synthRef.current.cancel();
      setIsSpeaking(false);
      setTimeout(() => {
        isCancelingRef.current = false;
      }, 50);
    }

    setTranscript("");
    setResponse("");
    setHistory([]); // Reset history on start of a new voice conversation session
    setIsThinking(false);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already running
    }
  };

  const handleStop = () => {
    isConversationActiveRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
    }
    
    if (synthRef.current) {
      isCancelingRef.current = true;
      synthRef.current.cancel();
      setIsSpeaking(false);
      setTimeout(() => {
        isCancelingRef.current = false;
      }, 50);
    }
    
    setIsListening(false);
    setIsThinking(false);
    setStatusMsg("Tap the bubble to start conversation");
  };

  const isActive = isListening || isSpeaking || isThinking;

  return (
    <div className="w-full max-w-md mx-auto bg-[#0f0f1a]/80 border border-white/5 p-8 rounded-sm shadow-2xl relative select-none flex flex-col items-center justify-center min-h-[360px]">
      
      {/* Dynamic Status Title */}
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-8">
        {isListening ? "Listening" : isSpeaking ? "Speaking" : isThinking ? "Thinking" : "Voice Assistant"}
      </h3>

      {/* Main GPT-Style Circular Bubble */}
      <div className="relative w-48 h-48 flex items-center justify-center mb-8">
        
        {/* Concentric rings for active speech/listening ripples */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-voice-ring" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/5 border border-emerald-500/10 animate-voice-ring [animation-delay:0.8s]" />
          </>
        )}
        {isSpeaking && (
          <>
            <div className="absolute inset-0 rounded-full bg-indigo-500/10 border border-indigo-500/20 animate-voice-ring" />
            <div className="absolute inset-0 rounded-full bg-indigo-500/5 border border-indigo-500/10 animate-voice-ring [animation-delay:0.8s]" />
          </>
        )}
        
        {/* Interactive Bubble */}
        <button
          type="button"
          onClick={isActive ? handleStop : handleStartListening}
          className={`relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 border focus:outline-none cursor-pointer ${
            isListening
              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)] animate-voice-pulse"
              : isSpeaking
              ? "bg-indigo-950/20 border-indigo-500/40 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-voice-pulse"
              : isThinking
              ? "bg-[#0f0f1a] border-indigo-500/30 text-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.1)]"
              : "bg-[#080810] border-white/5 text-zinc-500 hover:border-white/15 hover:text-zinc-300 hover:scale-[1.02]"
          }`}
        >
          {isThinking ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-[9px] font-mono tracking-widest text-indigo-400/60 uppercase">Thinking</span>
            </div>
          ) : isListening ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-emerald-400 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
              <span className="text-[9px] font-mono tracking-widest text-emerald-400/80 uppercase">Tap to Stop</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-end gap-1 h-6">
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ height: '70%', animationDuration: '0.8s' }} />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce" style={{ height: '100%', animationDuration: '0.8s' }} />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ height: '85%', animationDuration: '0.8s' }} />
                <span className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.4s]" style={{ height: '40%', animationDuration: '0.8s' }} />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-indigo-400/80 uppercase">Speaking</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-zinc-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
              <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Tap to Speak</span>
            </div>
          )}
        </button>
      </div>

      {/* Real-Time Dialogue Line Subtitle */}
      <div className="w-full text-center font-mono text-[11px] text-zinc-400 min-h-[48px] max-w-sm leading-relaxed px-4 transition-all duration-300">
        {isListening && (
          <p className="text-zinc-300">
            <span className="text-zinc-600 font-bold">You: </span>
            {transcript || "Listening..."}
          </p>
        )}
        {isSpeaking && (
          <p className="text-indigo-300">
            <span className="text-zinc-600 font-bold">AI: </span>
            {response}
          </p>
        )}
        {isThinking && (
          <p className="text-indigo-400/70 animate-pulse">
            Representative is thinking...
          </p>
        )}
        {!isListening && !isSpeaking && !isThinking && (
          <p className="text-zinc-500 italic">
            {errorMsg ? errorMsg : statusMsg}
          </p>
        )}
      </div>

      {/* Small End Session Button */}
      {isActive && (
        <button
          type="button"
          onClick={handleStop}
          className="mt-6 border border-white/5 hover:border-white/10 bg-[#16162a]/50 hover:bg-[#16162a] text-zinc-500 hover:text-white font-mono text-[10px] uppercase px-4 py-2 rounded-sm transition-all tracking-wider cursor-pointer"
        >
          End Session
        </button>
      )}

    </div>
  );
}
