import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import peopleImg from "@/assets/people-communicating.png";

const bubbles = [
  { word: "Hola", rotate: "-6deg", x: "-60px", y: "0px" },
  { word: "Hello", rotate: "0deg", x: "0px", y: "-18px" },
  { word: "Ciao", rotate: "5deg", x: "60px", y: "0px" },
];

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8 py-10">
        {/* Illustration */}
        <img
          src={peopleImg}
          alt="People communicating"
          className="w-48 h-48 object-contain"
        />

        {/* Chat bubbles */}
        <div className="flex items-end justify-center gap-3">
          {bubbles.map(({ word, rotate }) => (
            <div
              key={word}
              className="rounded-2xl bg-card px-4 py-2 shadow-sm text-sm font-semibold text-card-foreground"
              style={{ transform: `rotate(${rotate})` }}
            >
              {word}
            </div>
          ))}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Translator
          </h1>
          <p className="text-muted-foreground text-base max-w-xs mx-auto">
            Translate easy and fast into heritage languages
          </p>
        </div>

        {/* Continue button */}
        <button
          onClick={() => navigate("/translator")}
          className="w-full max-w-xs py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Welcome;
