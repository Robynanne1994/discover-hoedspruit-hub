import HomeMasthead from "@/components/home/HomeMasthead";
import HomeCategoryChips from "@/components/home/HomeCategoryChips";
import HomeSpecials from "@/components/home/HomeSpecials";
import HomeWhatsOn from "@/components/home/HomeWhatsOn";
import HomeListings from "@/components/home/HomeListings";
import HomeLocalChannels from "@/components/home/HomeLocalChannels";

import { useState } from "react";

const SECTION_GAP = 36;

const Index = () => {
  const [activeChip, setActiveChip] = useState<"All" | "Eat" | "Stay" | "Do" | "Shop" | "Events" | "Specials">("All");

  const showSection = (key: "Lowdown" | "Specials") => activeChip === "All";

  return (
    <div
      className="home-page"
      style={{
        minHeight: "100vh",
        background: "#5C6446",
        paddingBottom: 120,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <HomeMasthead />
      <div style={{ height: 32 }} />
      <HomeCategoryChips active={activeChip} onChange={setActiveChip} />

      {showSection("Specials") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeSpecials />
        </div>
      )}

      {(activeChip === "All" || activeChip === "Events") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeWhatsOn />
        </div>
      )}

      {(activeChip === "All" || activeChip === "Eat") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeListings
            sectionKey="eat"
            categorySearch="%restaurant%"
            defaultTitle="Where to eat"
            seeAllHref="/category/c867119f-8ca9-45a7-870e-6671f028748c"
            primary="Where to"
            serif="eat"
          />
        </div>
      )}

      {(activeChip === "All" || activeChip === "Stay") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeListings
            sectionKey="stay"
            categorySearch="%accommodation%"
            defaultTitle="Where to stay"
            seeAllHref="/category/cef1c5ad-b199-41c9-bc8a-5834703a953a"
            primary="Where to"
            serif="stay"
          />
        </div>
      )}

      {(activeChip === "All" || activeChip === "Do") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeListings
            sectionKey="do"
            categorySearch={["%activit%", "%things to do%", "%adventure%"]}
            defaultTitle="What to do"
            seeAllHref="/category/4dc26115-569e-4af7-868a-9f783f8a38eb"
            primary="What to"
            serif="do"
          />
        </div>
      )}

      {(activeChip === "All" || activeChip === "Shop") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeListings
            sectionKey="shop"
            categorySearch="%shop%"
            defaultTitle="Where to shop"
            seeAllHref="/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8"
            primary="Where to"
            serif="shop"
          />
        </div>
      )}

      {showSection("Lowdown") && (
        <div style={{ marginTop: SECTION_GAP }}>
          <HomeLocalChannels />
        </div>
      )}

    </div>
  );
};

export default Index;
