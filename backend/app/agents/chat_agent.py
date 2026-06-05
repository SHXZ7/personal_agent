import os
import json
import datetime
from dotenv import load_dotenv
from groq import Groq
from app.rag import retrieve
from app.calendar import get_available_slots, create_event

load_dotenv()

def condense_query(query: str, history: list) -> str:
    """Condense a follow-up query and history into a standalone search query."""
    if not history:
        return query
        
    # Exclude initial greeting to keep condensation focused on user inputs
    filtered_history = [turn for turn in history if "System initialized" not in turn.get("text", "")]
    if not filtered_history:
        return query
        
    history_parts = []
    for turn in filtered_history:
        role_label = "User" if turn.get("role") == "user" else "Assistant"
        history_parts.append(f"{role_label}: {turn.get('text', '')}")
    history_text = "\n".join(history_parts)
    
    client = Groq()
    prompt = (
        "Given the following conversation history and a follow up question, rephrase the follow up question to be a standalone question (which contains all necessary context from history to be understood on its own for search retrieval).\n"
        "Do not answer the question, just return the rephrased standalone question as plain text. Do not add any introduction or preamble.\n\n"
        f"History:\n{history_text}\n\n"
        f"Follow up question: {query}"
    )
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
        )
        condensed = completion.choices[0].message.content.strip()
        # Clean quotes if returned
        if (condensed.startswith('"') and condensed.endswith('"')) or (condensed.startswith("'") and condensed.endswith("'")):
            condensed = condensed[1:-1].strip()
        print(f"Memory Log - Original: '{query}' -> Standalone: '{condensed}'")
        return condensed
    except Exception as e:
        print(f"Error generating condensed query: {e}. Using original.")
        return query

def calendar_tool(query: str, voice: bool = False) -> dict:
    """Handles calendar availability and booking requests using Groq and the calendar API."""
    slots = get_available_slots()
    slots_str = ", ".join(slots)
    
    # Initialize Groq client
    client = Groq()
    
    voice_instruction = "\nKeep answers under 3 sentences and speak naturally. Voice responses should be shorter than chat responses." if voice else ""
    
    system_prompt = (
        "You are Shaaz's AI representative and calendar assistant.\n"
        "Your goal is to help the user schedule a meeting or view available times.\n\n"
        f"The list of available times (formatted as YYYY-MM-DD HH:MM in IST) is:\n[{slots_str}]\n\n"
        "Instructions:\n"
        "1. If the user is asking when Shaaz is available or for open times, list the available slots nicely.\n"
        "2. If the user wants to book/schedule a meeting, they MUST specify a date/time (matching one of the available slots) and their email address.\n"
        "3. If they have not provided BOTH a matching date/time and email address, ask them politely for the missing detail.\n"
        "4. If they HAVE provided both, you MUST output a JSON object enclosed in <BOOKING> and </BOOKING> tags. Example:\n"
        "<BOOKING>\n"
        "{\n"
        '  "title": "Briefing with Mohammed Shaaz",\n'
        '  "start": "2026-06-10 11:00",\n'
        '  "end": "2026-06-10 12:00",\n'
        '  "attendee_email": "user@example.com"\n'
        "}\n"
        "</BOOKING>\n"
        f"Do not invent dates or times not in the available slots list.{voice_instruction}"
    )
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            temperature=0.0,
        )
        completion_text = completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling LLM for calendar tool: {e}. Trying fallback...")
        try:
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                temperature=0.0,
            )
            completion_text = completion.choices[0].message.content.strip()
        except Exception as fallback_e:
            print(f"Fallback calendar model failed: {fallback_e}")
            return {"answer": "I encountered an error trying to access the calendar assistant.", "sources": ["system_check"]}
            
    # Check if LLM outputted a booking instruction
    if "<BOOKING>" in completion_text and "</BOOKING>" in completion_text:
        try:
            start_idx = completion_text.find("<BOOKING>") + len("<BOOKING>")
            end_idx = completion_text.find("</BOOKING>")
            booking_json = completion_text[start_idx:end_idx].strip()
            data = json.loads(booking_json)
            
            title = data.get("title", "Briefing with Mohammed Shaaz")
            start = data.get("start")
            end = data.get("end")
            
            # Default end to start + 1 hour if missing
            if not end and start:
                start_dt = datetime.datetime.strptime(start, "%Y-%m-%d %H:%M")
                end_dt = start_dt + datetime.timedelta(hours=1)
                end = end_dt.strftime("%Y-%m-%d %H:%M")
                
            email = data.get("attendee_email")
            
            # Create calendar event
            booking_res = create_event(title, start, end, email)
            
            # Build confirmation message
            is_mock = booking_res.get("mock", False)
            mock_notice = " (Mock Mode)" if is_mock else ""
            
            confirmation_msg = (
                f"**Meeting Confirmed{mock_notice}!**\n\n"
                f"- **Topic**: {title}\n"
                f"- **Time**: {start} IST\n"
                f"- **Attendee**: {email}\n\n"
                f"A calendar invitation has been sent. [View on Google Calendar]({booking_res.get('htmlLink')})"
            )
            return {"answer": confirmation_msg, "sources": ["google_calendar_api"]}
        except Exception as e:
            print(f"Failed to parse booking JSON or create event: {e}")
            return {"answer": "I was unable to schedule that. Please check the slot availability and format.", "sources": ["google_calendar_api"]}
            
    return {"answer": completion_text, "sources": ["google_calendar_api"]}

def rag_tool(query: str, history: list = None, voice: bool = False) -> dict:
    """Retrieve similarities from Qdrant vector DB and refine answering using Groq (RAG)."""
    # 1. Condense follow up question using conversation memory
    condensed_search_query = condense_query(query, history)
    
    # 2. Retrieve top 5 chunks using the condensed standalone query
    retrieved_chunks = retrieve(condensed_search_query, top_k=5)
    
    # Extract unique source names (excluding system summaries)
    sources = []
    for chunk in retrieved_chunks:
        meta = chunk.get("metadata", {})
        if meta.get("type") == "system_summary":
            continue
        if meta.get("source") == "resume":
            file_name = meta.get("file")
            if file_name and file_name not in sources:
                sources.append(file_name)
        elif meta.get("source") == "repo":
            repo_name = meta.get("repo")
            doc_type = meta.get("type")
            if repo_name:
                source_label = f"{repo_name} README" if doc_type == "readme" else f"{repo_name} commit"
                if source_label not in sources:
                    sources.append(source_label)
    
    # Format the context
    context_parts = []
    for i, chunk in enumerate(retrieved_chunks):
        meta = chunk.get("metadata", {})
        source_info = ""
        if meta.get("source") == "resume":
            source_info = f"Resume File: {meta.get('file', 'Unknown')}"
        elif meta.get("source") == "repo":
            repo_name = meta.get("repo", "Unknown")
            doc_type = meta.get("type", "Unknown")
            if doc_type == "readme":
                source_info = f"Repository README: {repo_name}"
            elif doc_type == "commit":
                source_info = f"Repository Git Commit: {repo_name} (by {meta.get('author', 'Unknown')} on {meta.get('date', 'Unknown')})"
            else:
                source_info = f"Repository {repo_name}"
        else:
            source_info = f"Source: {meta.get('source', 'Unknown')}"
            
        context_parts.append(f"[{i+1}] {source_info}\nContent: {chunk.get('text', '')}")
        
    context = "\n\n".join(context_parts)
    
    # Initialize Groq client
    client = Groq()
    
    # System Instructions based on mode
    if voice:
        system_prompt = (
            "You are Shaaz's AI representative.\n\n"
            "Keep answers under 3 sentences unless asked for more details.\n"
            "Speak naturally.\n"
            "Answer only using retrieved information.\n"
            "If unsure, say you don't know.\n\n"
            "Voice responses should be shorter than chat responses."
        )
    else:
        system_prompt = (
            "You are Shaaz's AI representative.\n\n"
            "Your goal is to answer the user's question accurately and professionally based on the retrieved context (resumes and GitHub repository files/commits).\n"
            "Use the retrieved context to formulate, infer, and refine your answer. For example, if asked why a project was built, explain its purpose, features, and benefits using the project description in the context.\n"
            "Be helpful and try to answer the question using reasoning based on the context, rather than strictly refusing, as long as the information is related to the retrieved data.\n\n"
            "If the question is completely unrelated to Shaaz's professional experience, projects, resume, or GitHub data (e.g., general knowledge questions like 'What is the capital of France?'), say exactly:\n"
            "\"I don't know based on my resume and GitHub data.\"\n\n"
            "Do not invent external details or facts that are not grounded in the context."
        )
    
    # Build context-aware chat messages sequence
    messages = []
    messages.append({"role": "system", "content": f"{system_prompt}\n\nRetrieved Context:\n{context}"})
    
    # Add history turns if present
    if history:
        for turn in history:
            role = "user" if turn.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": turn.get("text", "")})
            
    # Add current query
    messages.append({"role": "user", "content": query})
    
    answer = ""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.0,
        )
        answer = completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling llama-3.3-70b-versatile: {e}. Trying fallback model llama3-8b-8192...")
        try:
            completion = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=messages,
                temperature=0.0,
            )
            answer = completion.choices[0].message.content.strip()
        except Exception as fallback_e:
            print(f"Fallback model failed: {fallback_e}")
            answer = "I don't know based on my resume and GitHub data."
            
    return {"answer": answer, "sources": sources}

def generate_response_with_sources(query: str, history: list = None, voice: bool = False) -> dict:
    """Generate a response using Intent Detection. Routes either to Calendar or RAG."""
    query_lower = query.lower()
    booking_keywords = ["book", "schedule", "availability", "available", "interview", "meeting", "meet", "slots", "free"]
    has_booking_intent = any(kw in query_lower for kw in booking_keywords)
    
    if has_booking_intent:
        return calendar_tool(query, voice=voice)
    else:
        return rag_tool(query, history=history, voice=voice)

def generate_response(query: str, history: list = None, voice: bool = False) -> str:
    """Generate a response to the user's query using retrieved context and Groq (returns string only)."""
    res = generate_response_with_sources(query, history=history, voice=voice)
    return res["answer"]
