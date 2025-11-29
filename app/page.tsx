import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AboutSection from "@/components/About";
// import PricingSection from "@/components/PricingSection";
import CTASection from "@/components/CTAsection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      {/* <PricingSection /> */}
      <CTASection />
      <Footer />
    </div>
  );
}