import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Baby,
  PawPrint,
  Cigarette,
  Utensils,
  Armchair,
  Sparkles,
  ChefHat,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  MapPin,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { sanitizeDashesList } from "@/lib/sanitizeListing";

type Answers = {
  kids: "yes" | "no" | null;
  pets: "yes" | "no" | null;
  smoking: "yes" | "no" | null;
  meal: string | null; // "Any" | "Breakfast" | ...
  seating: string | null; // "Any" | "Indoor" | "Outdoor" | "Bar"
  vibe: string | null; // "Any" | ...
  cuisine: string | null; // "Any" | ...
  service: string | null; // "Any" | "Sit down" | "Take away"
};

const initialAnswers: Answers = {
  kids: null,
  pets: null,
  smoking: null,
  meal: null,
  seating: null,
  vibe: null,
  cuisine: null,
  service: null,
};

type QType = "yesno" | "options";

type QuestionDef = {
  key: keyof Answers;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  type: QType;
  options?: string[];
};

const MEAL_OPTIONS = ["Not sure yet", "Breakfast", "Brunch", "Lunch", "Dinner", "Snacks"];
const SEATING_OPTIONS = ["Any", "Indoor", "Outdoor", "Bar"];
const VIBE_OPTIONS = ["Any", "Casual", "Family", "Romantic", "Fine Dining", "Live Music"];
const CUISINE_OPTIONS = ["Any", "African", "Italian", "Pizza", "Burgers", "Seafood", "Sushi", "Steakhouse", "Vegetarian", "Tapas", "Vegan", "Coffee", "Baked Goods", "Mexican", "Asian", "Desserts", "Healthy Eats", "Pasta"];
const SERVICE_OPTIONS = ["Any", "Sit down", "Take away"];

const questions: QuestionDef[] = [
  { key: "kids", title: "Are you bringing kids?", subtitle: "We'll filter for child-friendly spots", icon: Baby, type: "yesno" },
  { key: "pets", title: "Are you bringing pets?", subtitle: "We'll show pet-friendly venues", icon: PawPrint, type: "yesno" },
  { key: "smoking", title: "Do you need a smoking section?", subtitle: "We'll find places that allow smoking", icon: Cigarette, type: "yesno" },
  { key: "meal", title: "What meal would you like?", subtitle: "Pick your preferred meal type", icon: Utensils, type: "options", options: MEAL_OPTIONS },
  { key: "seating", title: "Seating preference?", subtitle: "Where would you like to sit?", icon: Armchair, type: "options", options: SEATING_OPTIONS },
  { key: "vibe", title: "What vibe are you after?", subtitle: "Choose the atmosphere you prefer", icon: Sparkles, type: "options", options: VIBE_OPTIONS },
  { key: "cuisine", title: "Any cuisine in mind?", subtitle: "Pick a cuisine type", icon: ChefHat, type: "options", options: CUISINE_OPTIONS },
  { key: "service", title: "Sit down or take away?", subtitle: "How would you like to dine?", icon: ShoppingBag, type: "options", options: SERVICE_OPTIONS },
];

interface RestaurantQuizProps {
  onBack: () => void;
}

const RESTAURANT_CAT_ID = "c867119f-8ca9-45a7-870e-6671f028748c";

const RestaurantQuiz = ({ onBack }: RestaurantQuizProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [showResults, setShowResults] = useState(false);

  const { data: listings } = useQuery({
    queryKey: ["restaurant-quiz-listings"],
    queryFn: async () => {
      // Get listing IDs in the Restaurants & Cafés category (junction + legacy)
      const [{ data: jData }, { data: lData }] = await Promise.all([
        supabase.from("listing_categories").select("listing_id").eq("category_id", RESTAURANT_CAT_ID),
        supabase.from("listings").select("id").eq("category_id", RESTAURANT_CAT_ID),
      ]);
      const ids = new Set<string>();
      (jData || []).forEach((r: any) => ids.add(r.listing_id));
      (lData || []).forEach((r: any) => ids.add(r.id));
      if (ids.size === 0) return [];
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("id", Array.from(ids));
      if (error) throw error;
      return sanitizeDashesList(data as any[]);
    },
  });

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    const includesCI = (arr: string[] | null | undefined, v: string) =>
      (arr || []).map((x) => x.toLowerCase()).includes(v.toLowerCase());

    return listings.filter((l: any) => {
      if (answers.kids === "yes" && !(l.good_for_kids || l.child_friendly)) return false;
      if (answers.pets === "yes" && !l.pets_allowed) return false;
      if (answers.smoking === "yes" && !l.smoking_allowed) return false;

      if (answers.meal && answers.meal !== "Not sure yet") {
        const target = answers.meal === "Snacks" ? "Pub Grub" : answers.meal;
        if (!includesCI(l.meal, target) && !includesCI(l.meal, answers.meal)) return false;
      }
      if (answers.seating && answers.seating !== "Any") {
        if (!includesCI(l.seating, answers.seating)) return false;
      }
      if (answers.vibe && answers.vibe !== "Any") {
        if (!includesCI(l.vibe, answers.vibe)) return false;
      }
      if (answers.cuisine && answers.cuisine !== "Any") {
        if (!includesCI(l.cuisine, answers.cuisine)) return false;
      }
      if (answers.service && answers.service !== "Any") {
        if (!includesCI(l.service_type, answers.service)) return false;
      }
      return true;
    });
  }, [listings, answers]);

  const advance = () => {
    if (step < questions.length - 1) {
      setTimeout(() => setStep((s) => s + 1), 250);
    } else {
      setTimeout(() => setShowResults(true), 250);
    }
  };

  const handleAnswer = (key: keyof Answers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value as any }));
    advance();
  };

  const handleSkip = () => {
    const q = questions[step];
    setAnswers((prev) => ({ ...prev, [q.key]: null }));
    if (step < questions.length - 1) setStep(step + 1);
    else setShowResults(true);
  };

  const reset = () => {
    setStep(0);
    setAnswers(initialAnswers);
    setShowResults(false);
  };

  const progress = showResults ? 100 : (step / questions.length) * 100;
  const currentQuestion = questions[step];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Utensils className="w-4 h-4" />
          Restaurants & Cafés
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Where to eat or drink</h1>
        <p className="text-muted-foreground">Answer a few quick questions and we'll match you with the perfect spot</p>
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

            {currentQuestion.type === "yesno" ? (
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="px-8 text-lg" onClick={() => handleAnswer(currentQuestion.key, "yes")}>
                  Yes
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 text-lg"
                  onClick={() => handleAnswer(currentQuestion.key, "no")}
                >
                  No
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options?.map((option) => (
                  <Button
                    key={option}
                    variant="outline"
                    className="h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleAnswer(currentQuestion.key, option)}
                  >
                    {option}
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
                ? `We found ${filteredListings.length} match${filteredListings.length !== 1 ? "es" : ""}!`
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
                <Button className="mt-4" onClick={reset}>
                  Start Over
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {filteredListings.map((listing: any) => (
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
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        {listing.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {listing.location}
                          </span>
                        )}
                        {listing.google_rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" /> {Number(listing.google_rating).toFixed(1)}
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

      <div className="text-center mt-8">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
    </div>
  );
};

export default RestaurantQuiz;
