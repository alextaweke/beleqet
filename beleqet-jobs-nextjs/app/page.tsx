import Hero from "@/components/Hero";
// import StatsBar from "@/components/StatsBar";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedJobs from "@/components/FeaturedJobs";
import WhyChoose from "@/components/WhyChoose";
import CTABanner from "@/components/CTABanner";
import JobsListing from "@/components/JobsListing";

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* <StatsBar /> */}
      <CategoryGrid />
      <FeaturedJobs />
      <JobsListing />
      <WhyChoose />
      <CTABanner />
    </>
  );
}
