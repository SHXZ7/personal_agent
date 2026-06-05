import PageWrapper from "../../components/layout/PageWrapper";
import VoiceAgent from "../../components/VoiceAgent";

export default function VoicePage() {
  return (
    <PageWrapper showNavbar={true} fixedHeight={true}>
      <div className="flex-1 flex flex-col justify-center items-center py-6 px-6 max-w-lg mx-auto w-full overflow-hidden">
        
        {/* Section Header */}
        <div className="text-center space-y-2 mb-6 select-none">
          <h2 className="font-display font-normal text-3xl sm:text-4xl text-white">
            Speak with Shaaz's Representative
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Voice-grounded RAG agent using Web Speech APIs.
          </p>
        </div>

        {/* Voice Agent UI Block */}
        <VoiceAgent />
        
      </div>
    </PageWrapper>
  );
}
