import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Baby, PawPrint, Accessibility, DollarSign, ArrowRight, ArrowLeft, RotateCcw, MapPin, Phone, Globe, UtensilsCrossed, Cigarette, Coffee, Sparkles, ChefHat, Armchair, TreePine, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

type Answers = {
  kids: boolean | null;
  pets: boolean | null;
  wheelchair: boolean | null;
  priceLevel: number | null;
  smoking: boolean | null;
  meal: string | null;
  vibe: string | null;
  cuisine: string | null;
  seating: string | null;
  kidsPlayground: boolean | null;
  serviceType: string | null;
};

const mealOptions = ["Breakfast", "Lunch", "Dinner", "Brunch", "Pub Grub"];
const vibeOptions = ["Casual", "Social", "Fancy", "Scenic"];
const cuisineOptions = ["Seafood", "Sushi", "Burgers", "Pizzas", "Indian", "Grill", "Italian", "Local", "Fast Food"];
const seatingOptions = ["Indoor", "Outdoor", "No Seating", "Bar"];
const serviceTypeOptions = ["Sit down", "Take away"];

type QuestionDef = {
  key: keyof Answers;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  type: "boolean" | "price" | "multi";
  options?: string[];
};

const questions: QuestionDef[] = [
  { key: "kids", title: "Are you bringing kids?", subtitle: "We'll find places that are family-friendly", icon: Baby, type: "boolean" },
  { key: "pets", title: "Bringing any furry friends?", subtitle: "We'll show pet-friendly restaurants", icon: PawPrint, type: "boolean" },
  { key: "wheelchair", title: "Need wheelchair access?", subtitle: "We'll filter for accessible venues", icon: Accessibility, type: "boolean" },
  { key: "smoking", title: "Do you need a smoking area?", subtitle: "We'll find places that allow smoking", icon: Cigarette, type: "boolean" },
  { key: "kidsPlayground", title: "Need a kids playground?", subtitle: "We'll find places with play areas", icon: TreePine, type: "boolean" },
  { key: "meal", title: "What meal are you looking for?", subtitle: "Pick your preferred meal type", icon: Coffee, type: "multi", options: mealOptions },
  { key: "vibe", title: "What vibe are you after?", subtitle: "Choose the atmosphere you prefer", icon: Sparkles, type: "multi", options: vibeOptions },
  { key: "cuisine", title: "What cuisine do you fancy?", subtitle: "Pick a cuisine type", icon: ChefHat, type: "multi", options: cuisineOptions },
  { key: "seating", title: "Seating preference?", subtitle: "Where would you like to sit?", icon: Armchair, type: "multi", options: seatingOptions },
  { key: "serviceType", title: "Sit down or take away?", subtitle: "How would you like to dine?", icon: ShoppingBag, type: "multi", options: serviceTypeOptions },
  { key: "priceLevel", title: "What's your budget?", subtitle: "Pick your preferred price range", icon: DollarSign, type: "price" },
];

const priceLevels = [
  { value: 1, label: "Budget", description: "Affordable & casual" },
  { value: 2, label: "Moderate", description: "Mid-range dining" },
  { value: 3, label: "Upscale", description: "Fine dining experience" },
  { value: 4, label: "Premium", description: "Top-tier luxury" },
];

interface RestaurantQuizProps {
  onBack: () => void;
}

const RestaurantQuiz = ({ onBack }: RestaurantQuizProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    kids: null, pets: null, wheelchair: null, priceLevel: null,
    smoking: null, meal: null, vibe: null, cuisine: null,
    seating: null, kidsPlayground: null, serviceType: null,
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
    if (answers.smoking === true && !listing.smoking_allowed) return false;
    if (answers.kidsPlayground === true && !listing.kids_playground) return false;
    if (answers.priceLevel !== null && listing.price_level !== null && listing.price_level > answers.priceLevel) return false;
    if (answers.meal !== null && listing.meal && !listing.meal.includes(answers.meal)) return false;
    if (answers.vibe !== null && listing.vibe && !listing.vibe.includes(answers.vibe)) return false;
    if (answers.cuisine !== null && listing.cuisine && !listing.cuisine.includes(answers.cuisine)) return false;
    if (answers.seating !== null && listing.seating && !listing.seating.includes(answers.seating)) return false;
    if (answers.serviceType !== null && listing.service_type && !listing.service_type.includes(answers.serviceType)) return false;
    return true;
  }) ?? [];

  const advance = () => {
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => setShowResults(true), 300);
    }
  };

  const handleBooleanAnswer = (key: keyof Answers, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    advance();
  };

  const handleMultiAnswer = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    advance();
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
    setAnswers({
      kids: null, pets: null, wheelchair: null, priceLevel: null,
      smoking: null, meal: null, vibe: null, cuisine: null,
      seating: null, kidsPlayground: null, serviceType: null,
    });
    setShowResults(false);
  };

  const progress = showResults ? 100 : (step / questions.length) * 100;
  const currentQuestion = questions[step];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <UtensilsCrossed className="w-4 h-4" />
          Where to Eat in Hoedspruit
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Restaurant Finder</h1>
        <p className="text-muted-foreground">Answer a few questions and we'll match you with the perfect spot</p>
      </div>

      <Progress value={progress} className="mb-8 h-2" />

      {!showResults ? (
        <Card className="border-2 border-border shadow-card">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <currentQuestion.icon className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">{currentQuestion.title}</h2>
            <p className="text-muted-foreground mb-8">{currentQuestion.subtitle}</p>

            {currentQuestion.type === "boolean" ? (
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="px-8 text-lg" onClick={() => handleBooleanAnswer(currentQuestion.key, true)}>Yes</Button>
                <Button size="lg" variant="outline" className="px-8 text-lg" onClick={() => handleBooleanAnswer(currentQuestion.key, false)}>No</Button>
              </div>
            ) : currentQuestion.type === "multi" ? (
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options?.map((option) => (
                  <Button key={option} variant="outline" className="h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => handleMultiAnswer(currentQuestion.key, option)}>
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {priceLevels.map((level) => (
                  <Button key={level.value} variant="outline" className="h-auto py-4 flex flex-col gap-1 hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => handlePriceAnswer(level.value)}>
                    <span className="font-semibold">{level.label}</span>
                    <span className="text-xs opacity-70">{level.description}</span>
                  </Button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
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
                <Card className="overflow-hidden hover:shadow-card transition-shadow cursor-pointer border border-border">
                  <div className="flex">
                    {listing.image_url && (
                      <div className="w-28 h-28 flex-shrink-0">
                        <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-4 flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg truncate">{listing.title}</h3>
                      {listing.description && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {listing.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>}
                        {listing.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {listing.phone}</span>}
                        {listing.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Website</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {listing.good_for_kids && <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"><Baby className="w-3 h-3" /> Kids</span>}
                        {listing.pets_allowed && <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"><PawPrint className="w-3 h-3" /> Pets</span>}
                        {listing.wheelchair_friendly && <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"><Accessibility className="w-3 h-3" /> Accessible</span>}
                        {listing.price_level && <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{"R".repeat(listing.price_level)}</span>}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-8">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
        </Button>
      </div>
    </div>
  );
};

export default RestaurantQuiz;
