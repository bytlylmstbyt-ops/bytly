import React from "react";
import LandingHero from "@/components/landing/LandingHero";
import LandingAbout from "@/components/landing/LandingAbout";
import LandingBenefits from "@/components/landing/LandingBenefits";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCategories from "@/components/landing/LandingCategories";
import LandingTrust from "@/components/landing/LandingTrust";
import LandingFinalCTA from "@/components/landing/LandingFinalCTA";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <LandingAbout />
      <LandingBenefits />
      <LandingHowItWorks />
      <LandingCategories />
      <LandingTrust />
      <LandingFinalCTA />
    </div>
  );
}