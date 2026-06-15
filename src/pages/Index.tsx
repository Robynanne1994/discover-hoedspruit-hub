import HomeMasthead from "@/components/home/HomeMasthead";
import HomeCategoryChips from "@/components/home/HomeCategoryChips";
import HomeSpecials from "@/components/home/HomeSpecials";
import HomeWhatsOn from "@/components/home/HomeWhatsOn";
import HomeListings from "@/components/home/HomeListings";
import HomeLocalChannels from "@/components/home/HomeLocalChannels";
import Seo from "@/components/Seo";

const SECTION_GAP = 32;

const Index = () => {
  return (
    <>
    <Seo
      title="Hello Hoedspruit – Your Guide to the Lowveld"
      description="Discover the best restaurants, lodges, safari activities, events and specials in Hoedspruit, South Africa's Lowveld."
      path="/"
    />

    <div
      className="home-page"
      style={{
        minHeight: "100vh",
        background: "#E6E0CC",
        paddingBottom: 100,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <HomeMasthead />
      <div style={{ height: 24 }} />
      <HomeCategoryChips />


      <div style={{ marginTop: SECTION_GAP }}>
        <HomeSpecials />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HomeWhatsOn />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HomeListings
          sectionKey="eat"
          categorySearch="%restaurant%"
          defaultTitle="Where to Eat"
          seeAllHref="/category/c867119f-8ca9-45a7-870e-6671f028748c"
        />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HomeListings
          sectionKey="do"
          categorySearch={["%activit%", "%things to do%", "%adventure%"]}
          defaultTitle="What to Do"
          seeAllHref="/category/4dc26115-569e-4af7-868a-9f783f8a38eb"
        />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HomeListings
          sectionKey="shop"
          categorySearch="%shop%"
          defaultTitle="Where to Shop"
          seeAllHref="/category/7b335bd5-3ce9-4ecd-92bd-3735804402b8"
        />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HomeListings
          sectionKey="stay"
          categorySearch="%accommodation%"
          defaultTitle="Where to Stay"
          seeAllHref="/category/cef1c5ad-b199-41c9-bc8a-5834703a953a"
        />
      </div>

      <div style={{ marginTop: SECTION_GAP }}>
        <HomeLocalChannels />
      </div>
    </div>
  );
};

export default Index;
