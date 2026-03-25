import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, ShoppingBag, Compass } from "lucide-react";
import RestaurantQuizComponent from "@/components/quiz/RestaurantQuiz";

type QuizType = "none" | "restaurant" | "shopping";

const quizzes = [
  {
    id: "restaurant" as const,
    title: "Where to Eat",
    description: "Find the perfect restaurant based on your preferences",
    icon: UtensilsCrossed,
  },
  {
    id: "shopping" as const,
    title: "Where to Shop",
    description: "Discover the best shopping spots in Hoedspruit",
    icon: ShoppingBag,
    comingSoon: true,
  },
  {
    id: "explore" as const,
    title: "What to Do",
    description: "Find activities and experiences for your visit",
    icon: Compass,
    comingSoon: true,
  },
];

const RestaurantQuiz = () => {
  const [activeQuiz, setActiveQuiz] = useState<QuizType>("none");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        {activeQuiz === "none" ? (
          <div className="w-full max-w-3xl">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-foreground mb-3">Explore Hoedspruit</h1>
              <p className="text-lg text-muted-foreground">Take a quick quiz and we'll help you find exactly what you're looking for</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <Card
                  key={quiz.id}
                  className={`relative overflow-hidden border-2 transition-all duration-200 ${
                    quiz.comingSoon
                      ? "opacity-60 cursor-default border-border"
                      : "cursor-pointer border-border hover:border-primary hover:shadow-xl hover:-translate-y-1"
                  }`}
                  onClick={() => !quiz.comingSoon && setActiveQuiz(quiz.id as QuizType)}
                >
                  {quiz.comingSoon && (
                    <div className="absolute top-3 right-3 bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-full">
                      Coming Soon
                    </div>
                  )}
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <quiz.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">{quiz.title}</h2>
                    <p className="text-sm text-muted-foreground">{quiz.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : activeQuiz === "restaurant" ? (
          <RestaurantQuizComponent onBack={() => setActiveQuiz("none")} />
        ) : null}
      </main>

      <Footer />
    </div>
  );
};

export default RestaurantQuiz;
