import PageWrapper from "../components/layout/PageWrapper";
import HeroSection from "../components/persona/HeroSection";
import EvalMetrics from "../components/persona/EvalMetrics";

export default function Home() {
  return (
    <PageWrapper showNavbar={true} fixedHeight={true}>
      <div className="flex-1 flex flex-col justify-between py-6 md:py-8 px-6 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Spacer to push content down slightly for balanced feel */}
        <div />

        {/* Hero Section */}
        <div className="my-auto py-4">
          <HeroSection />
        </div>

        {/* Eval Metrics at the bottom */}
        <div className="mt-4">
          <EvalMetrics />
        </div>
      </div>
    </PageWrapper>
  );
}
