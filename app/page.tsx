import HeroSection from "@/components/landing/HeroSection";   
import SolutionSection from "@/components/landing/Solution";
import BenefitsSection from "@/components/landing/Benifits";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialSection";
import FinalCTASection from "@/components/landing/CTAsection";
import FAQsection from "@/components/landing/FAQ";

export default function HomePage() {
  return (
    <div className="min-h-scree bg-[#0A0F0D] text-white font-sans antialiased">
      <HeroSection />
      {/* <ProblemSection /> */}
      <SolutionSection />
      <BenefitsSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQsection />
      <FinalCTASection />
    </div>
  );
}