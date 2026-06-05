"use client";

import { useState, useEffect } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import ChatWindow from "../../components/chat/ChatWindow";
import SkillsGrid from "../../components/persona/SkillsGrid";
import ProjectCard from "../../components/persona/ProjectCard";
import GlowDot from "../../components/ui/GlowDot";

// Fallback project names
const FALLBACK_PROJECTS = [
  { name: "StyleSync" },
  { name: "MotorGuard-AI" },
  { name: "autofloww" },
  { name: "medprompt" },
  { name: "rag_bot" }
];

export default function ChatPage() {
  const [projects, setProjects] = useState([]);
  const [triggerQuery, setTriggerQuery] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/projects`);
        if (!res.ok) throw new Error("Backend response error");
        const data = await res.json();
        
        if (data.projects && data.projects.length > 0) {
          const mapped = data.projects.map(name => ({ name }));
          setProjects(mapped);
        } else {
          setProjects(FALLBACK_PROJECTS);
        }
      } catch (e) {
        console.warn("Could not fetch projects from backend, using fallbacks:", e);
        setProjects(FALLBACK_PROJECTS);
      }
    }
    fetchProjects();
  }, []);

  const handleAskAI = (projectName) => {
    setTriggerQuery(`Tell me about the project ${projectName} and what Shaaz worked on.`);
  };

  return (
    <PageWrapper showNavbar={true} fixedHeight={true}>
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full min-h-0 overflow-hidden">
        
        {/* Left Side Panel - compact and non-scrollable */}
        <aside className="w-full md:w-[280px] md:border-r border-white/5 bg-[#0f0f1a]/40 flex flex-col justify-between md:h-full md:min-h-0 overflow-hidden p-5">
          <div className="space-y-5">
            
            {/* Profile info block */}
            <div className="space-y-1">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                About Shaaz
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Full-Stack & AI Systems Engineer. Focused on RAG, LLM agent pipelines, and high-performance interfaces.
              </p>
            </div>

            {/* Tech Stack Skills */}
            <div className="space-y-1">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                Tech Stack
              </h3>
              <SkillsGrid />
            </div>

            {/* Projects list */}
            <div className="space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                Projects ({projects.length})
              </h3>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                {projects.map((proj, idx) => (
                  <ProjectCard
                    key={idx}
                    name={proj.name}
                    onAskAI={handleAskAI}
                  />
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-1 pt-1">
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                Quick Actions
              </h3>
              <a
                href="/book"
                className="block text-center border border-white/5 hover:border-white/10 bg-[#16162a]/50 hover:bg-[#16162a] text-zinc-300 font-mono text-[11px] py-2 rounded-sm transition-all"
              >
                Schedule Interview ↗
              </a>
            </div>

          </div>

          {/* Bottom online status pill */}
          <div className="pt-4 border-t border-white/5 flex items-center gap-2 select-none">
            <GlowDot />
            <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Representative Active
            </span>
          </div>

        </aside>

        {/* Right Side Panel - Chat Area (the only scrolling container when feed grows) */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#080810]/30 p-4 md:p-5 overflow-hidden">
          <ChatWindow
            triggerQuery={triggerQuery}
            clearTriggerQuery={() => setTriggerQuery(null)}
          />
        </main>

      </div>
    </PageWrapper>
  );
}
