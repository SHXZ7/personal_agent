import Tag from "../ui/Tag";

export default function SkillsGrid() {
  const skills = [
    "Python",
    "FastAPI",
    "Next.js",
    "React 19",
    "Qdrant DB",
    "Groq AI",
    "RAG / Agents",
    "Docker",
    "Git"
  ];

  return (
    <div className="flex flex-wrap gap-1.5 select-none">
      {skills.map((skill, idx) => (
        <Tag key={idx} className="px-1.5 py-0.5 text-[10px]">
          {skill}
        </Tag>
      ))}
    </div>
  );
}
