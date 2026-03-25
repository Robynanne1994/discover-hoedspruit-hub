import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Baby, PawPrint, Accessibility, DollarSign, ArrowRight, ArrowLeft, RotateCcw, MapPin, Phone, Globe, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

type Answers = {
  kids: boolean | null;
  pets: boolean | null;
  wheelchair: boolean | null;
  priceLevel: number | null;
};

const questions = [
  {
    key: "kids" as const,
    title: "Are you bringing kids?",
    subtitle: "We'll find places that are family-friendly",
    icon: Baby,
    type: "boolean" as const,
  },
  {
    key: "pets" as const,
    title: "Bringing any furry friends?",
    subtitle: "We'll show pet-friendly restaurants",
    icon: PawPrint,
    type: "boolean" as const,
  },
  {
    key: "wheelchair" as const,
    title: "Need wheelchair access?",
    subtitle: "We'll filter for accessible venues",
    icon: Accessibility,
    type: "boolean" as const,
  },
  {
    key: "priceLevel" as const,
    title: "What's your budget?",
    subtitle: "Pick your preferred price range",
    icon: DollarSign,
    type: "price" as const,
  },
];

const priceLevels = [
  { value: 1, label: "Budget", description: "Affordable & casual" },
  { value: 2, label: "Moderate", description: "Mid-range dining" },
  { value: 3, label: "Upscale", description: "Fine dining experience" },
  { value: 4, label: "Premium", description: "Top-tier luxury" },
];

const RestaurantQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    kids: null,
    pets: null,
    wheelchair: null,
    priceLevel: null,
  });
  const [showResults, setShowResults] = useState(false);

  const { data: listings } = useQuery({
    queryKey: ["quiz-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_categories(category_id, categories:category_id(title))")
        .eq("show_attributes", true);
      if (error) throw error;
      return data;
    },
  });

  const filteredListings = listings?.filter((listing) => {
    if (answers.kids === true && !listing.good_for_kids) return false;
    if (answers.pets === true && !listing.pets_allowed) return false;
    if (answers.wheelchair === true && !listing.wheelchair_friendly) return false;
    if (answers.priceLevel !== null && listing.price_level !== null && listing.price_level > answers.priceLevel) return false;
    return true;
  }) ?? [];

  const handleBooleanAnswer = (key: "kids" | "pets" | "wheelchair", value: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const handlePriceAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, priceLevel: value }));
    setTimeout(() => setShowResults(true), 300);
  };

  const handleSkip = () => {
    const q = questions[step];
    setAnswers((prev) => ({ ...prev, [q.key]: null }));
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({ kids: null, pets: null, wheelchair: null, priceLevel: null });
    setShowResults(false);
  };

  const progress = showResults ? 100 : ((step) / questions.length) * 100;
  const currentQuestion = questions[step];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <UtensilsCrossed className="w-4 h-4" />
              Where to Eat in Hoedspruit
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Restaurant Finder</h1>
            <p className="text-muted-foreground">Answer a few questions and we'll match you with the perfect spot</p>
          </div>

          {/* Progress */}
          <Progress value={progress} className="mb-8 h-2" />

          {!showResults ? (
            /* Question Card */
            <Card className="border-2 border-border shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <currentQuestion.icon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">{currentQuestion.title}</h2>
                <p className="text-muted-foreground mb-8">{currentQuestion.subtitle}</p>

                {currentQuestion.type === "boolean" ? (
                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      className="px-8 text-lg"
                      onClick={() => handleBooleanAnswer(currentQuestion.key as "kids" | "pets" | "wheelchair", true)}
                    >
                      Yes
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="px-8 text-lg"
                      onClick={() => handleBooleanAnswer(currentQuestion.key as "kids" | "pets" | "wheelchair", false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {priceLevels.map((level) => (
                      <Button
                        key={level.value}
                        variant="outline"
                        className="h-auto py-4 flex flex-col gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handlePriceAnswer(level.value)}
                      >
                        <span className="font-semibold">{level.label}</span>
                        <span className="text-xs opacity-70">{level.description}</span>
                      </Button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={step === 0}
                    onClick={() => setStep(step - 1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSkip}>
                    Skip <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Results */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  {filteredListings.length > 0
                    ? `We found ${filteredListings.length} match${filteredListings.length !== 1 ? "es" : ""} for you!`
                    : "No exact matches found"}
                </h2>
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Retake
                </Button>
              </div>

              {filteredListings.length === 0 && (
                <Card className="mb-4">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p>Try adjusting your preferences for more results.</p>
                    <Button className="mt-4" onClick={reset}>Start Over</Button>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <Link key={listing.id} to={`/listing/${listing.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-border">
                      <div className="flex">
                        {listing.image_url && (
                          <div className="w-28 h-28 flex-shrink-0">
                            <img
                              src={listing.image_url}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4 flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-lg truncate">{listing.title}</h3>
                          {listing.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            {listing.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {listing.location}
                              </span>
                            )}
                            {listing.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {listing.phone}
                              </span>
                            )}
                            {listing.website && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" /> Website
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {listing.good_for_kids && (
                              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <Baby className="w-3 h-3" /> Kids
                              </span>
                            )}
                            {listing.pets_allowed && (
                              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <PawPrint className="w-3 h-3" /> Pets
                              </span>
                            )}
                            {listing.wheelchair_friendly && (
                              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <Accessibility className="w-3 h-3" /> Accessible
                              </span>
                            )}
                            {listing.price_level && (
                              <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {"R".repeat(listing.price_level)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RestaurantQuiz;
