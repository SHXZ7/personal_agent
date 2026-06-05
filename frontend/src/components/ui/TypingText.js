"use client";

import { useState, useEffect } from "react";

export default function TypingText({ text, speed = 80, delay = 0, className = "" }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let index = 0;
    let timer;

    const startTyping = () => {
      timer = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        if (index >= text.length) {
          clearInterval(timer);
          setIsDone(true);
        }
      }, speed);
    };

    const delayTimeout = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(delayTimeout);
      clearInterval(timer);
    };
  }, [text, speed, delay]);

  return (
    <span className={`${className}`}>
      {displayedText}
      <span className={`inline-block font-sans ${isDone ? "animate-pulse" : ""} text-indigo-500 ml-0.5`}>
        |
      </span>
    </span>
  );
}
