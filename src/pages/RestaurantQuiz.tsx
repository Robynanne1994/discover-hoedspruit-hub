import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";
import RestaurantQuizComponent from "@/components/quiz/RestaurantQuiz";
import { useNavigate } from "react-router-dom";

const RestaurantQuiz = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center px-6 pt-24 pb-12">
        <div className="w-full max-w-3xl mb-4">
          <BackButton />
        </div>
        <RestaurantQuizComponent onBack={() => navigate(-1)} />
      </main>
    </div>
  );
};

export default RestaurantQuiz;
