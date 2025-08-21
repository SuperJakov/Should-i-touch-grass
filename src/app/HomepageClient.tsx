"use client";

import React, { useState } from "react";
import {
  Sun,
  Cloud,
  MapPin,
  Wind,
  Navigation,
  Cloudy,
  CloudRain,
  Snowflake,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  getVerdictForCityAction,
  getVerdictForCoordsAction,
  getRandomCityVerdictAction,
  type VerdictResponse,
} from "./actions";
import Image from "next/image";
import AppLogo from "public/logo.png";

// --- PROPS INTERFACES ---
interface ResultCardProps {
  result: VerdictResponse;
}

interface CompactResultCardProps {
  result: VerdictResponse;
}

// --- HELPER FUNCTIONS ---

/**
 * Selects an appropriate icon based on the weather description.
 */
const getWeatherIcon = (weather: string): LucideIcon => {
  const lowerCaseWeather = weather.toLowerCase();
  if (lowerCaseWeather.includes("rain")) return CloudRain;
  if (lowerCaseWeather.includes("cloud")) return Cloudy;
  if (lowerCaseWeather.includes("snow")) return Snowflake;
  if (lowerCaseWeather.includes("storm")) return Zap;
  return Sun; // Default icon
};

/**
 * MEME ZONE: Generates a random, witty message based on the verdict.
 */
const getMemeMessage = (verdict: "Yes" | "No"): string => {
  if (verdict === "Yes") {
    const messages = [
      "The prophecy is true. Go forth and touch grass.",
      "Permission granted. The sun is rendering at max settings.",
      "Go on, the real world has better graphics anyway.",
      "Leave the goblin cave. Vitamin D awaits.",
      "It's a beautiful day to log off.",
    ];
    return messages[Math.floor(Math.random() * messages.length)]!;
  } else {
    const messages = [
      "Nah. Stay inside, the world is buffering.",
      "It's a no from me, dawg. The conditions are cringe.",
      "The outside has skill-based matchmaking today, and it's not in your favor.",
      "Stay indoors and farm some XP. The weather is currently OP.",
      "This is fine. 🔥 Your PC is warmer anyway.",
    ];
    return messages[Math.floor(Math.random() * messages.length)]!;
  }
};

// --- UI COMPONENTS ---

/**
 * Main Result Card: Displays the detailed verdict for the searched location.
 */
const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isYes = result.verdict === "Yes";
  const WeatherIcon = getWeatherIcon(result.weather);
  const memeMessage = getMemeMessage(result.verdict); // Get our fresh meme message

  const cardClasses = isYes
    ? "bg-green-900/60 shadow-green-500/20"
    : "bg-slate-800/80 shadow-slate-900/40";

  const verdictTextClasses = isYes ? "text-green-300" : "text-slate-300";

  return (
    <div
      className={`animate-fade-in-up w-full max-w-lg transform rounded-3xl p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm transition-all duration-500 ${cardClasses}`}
    >
      <div className="text-center">
        <div className="mb-4">
            <p className="text-xl font-medium text-white/80">{result.city}</p>
            <p className="text-md font-medium text-white/70 flex items-center justify-center gap-2">
              <span>{result.countryFlag}</span>
            </p>
          </div>
        <h2
          className={`my-4 text-7xl font-bold md:text-8xl ${verdictTextClasses}`}
        >
          {result.verdict}
        </h2>
        {/* We use our meme message here instead of the API's */}
        <p className="text-lg text-white/90">{memeMessage}</p>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <WeatherIcon size={28} className="text-white/80" />
          <span className="text-lg font-bold">{result.weather}</span>
          <span className="text-xs tracking-widest text-white/60 uppercase">
            Weather
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Wind size={28} className="text-white/80" />
          <span className="text-lg font-bold">{result.aqi}</span>
          <span className="text-xs tracking-widest text-white/60 uppercase">
            AQI
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Cloud size={28} className="text-white/80" />
          <span className="text-lg font-bold">{result.temp}</span>
          <span className="text-xs tracking-widest text-white/60 uppercase">
            Temp
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Compact Result Card: A smaller card for the "Popular Cities" grid.
 */
const CompactResultCard: React.FC<CompactResultCardProps> = ({ result }) => {
  const isYes = result.verdict === "Yes";
  const cardClasses = isYes
    ? "bg-green-900/50 hover:bg-green-900/80"
    : "bg-slate-800/50 hover:bg-slate-800/80";

  return (
    <div
      className={`rounded-2xl p-5 text-center ring-1 ring-white/10 transition-all duration-300 ${cardClasses}`}
    >
      <h4 className="text-lg font-bold text-white">{result.city}</h4>
        <p className="text-sm text-white/70 flex items-center justify-center gap-1">
          <span>{result.countryFlag}</span>
        </p>
      <p
        className={`text-3xl font-bold ${isYes ? "text-green-300" : "text-slate-300"}`}
      >
        {result.verdict}
      </p>
      <p className="text-sm text-white/70">{result.temp}</p>
    </div>
  );
};

/**
 * Loading Spinner Component
 */
const LoadingSpinner = () => (
  <div className="flex w-full flex-col items-center justify-center gap-6 text-center">
    <div className="h-20 w-20 animate-spin rounded-full border-4 border-slate-600 border-t-green-500"></div>
    <p className="text-xl font-medium text-slate-300">
      Calibrating the grass-o-meter... 🤔
    </p>
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function HomePageClient({
  initialPopularStatuses,
}: {
  initialPopularStatuses: Record<string, VerdictResponse>;
}) {
  const [location, setLocation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerdictResponse | null>(null);
  const [error, setError] = useState<string>("");
  
  // Ref for scrolling to results
  const resultRef = React.useRef<HTMLDivElement>(null);

  const popularCities: string[] = [
    "New York",
    "London",
    "Tokyo",
    "Los Angeles",
    "Paris",
    "Singapore",
  ];

  const handleApiCall = async (apiCall: Promise<VerdictResponse>) => {
    setIsLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiCall;
      setResult(data);
    } catch (e: unknown) {
      setError(
        "Yikes. The API is probably down. Maybe just look out the window? 🤷‍♂️",
      );
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to results when they appear
  React.useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [result]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!location) {
      setError("Bro, you gotta enter a location. I'm not a mind reader.");
      return;
    }
    void handleApiCall(getVerdictForCityAction(location));
  };

  const handleUseMyLocation = (): void => {
    if (!navigator.geolocation) {
      setError("Your browser is ancient. Geolocation is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        void handleApiCall(getVerdictForCoordsAction(latitude, longitude));
      },
      () => {
        setError(
          "Permission denied. I guess you don't want me to stalk you. Fair.",
        );
      },
    );
  };

  const handleRandomCity = (): void => {
    void handleApiCall(getRandomCityVerdictAction());
  };

  return (
    <main className="text-foreground bg-background flex min-h-screen w-full flex-col items-center justify-center p-6 font-sans sm:p-8">
      <div className="w-full max-w-lg space-y-12">
        {/* --- INITIAL VIEW & SEARCH FORM --- */}
        {!result && !isLoading && (
          <div className="animate-fade-in space-y-8 text-center">
            <div>
              <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <h1 className="text-foreground text-5xl leading-none font-extrabold tracking-tight md:text-6xl">
                  Should I Touch Grass?
                </h1>
                <Image src={AppLogo} alt="App Logo" className="h-16 w-auto" />
              </div>
              <p className="mt-4 text-lg">
                For Redditors, Discord mods, and professional gamers. Is it safe
                to go out?
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <MapPin
                  className="absolute top-1/2 left-4 -translate-y-1/2"
                  size={20}
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your city..."
                  className="border-border bg-muted focus:ring-ring placeholder:text-muted-foreground text-foreground w-full rounded-full border-2 py-3.5 pr-4 pl-12 transition focus:ring-2 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="bg-accent text-accent-foreground w-full cursor-pointer rounded-full px-4 py-3.5 font-bold transition-all duration-200 hover:scale-105 active:scale-100"
              >
                Check Conditions
              </button>
            </form>

            <div className="flex items-center">
              <div className="border-border flex-grow border-t"></div>
              <span className="mx-4 flex-shrink text-sm">OR</span>
              <div className="border-border flex-grow border-t"></div>
            </div>

            <button
              onClick={handleUseMyLocation}
              className="hover:bg-secondary/90 bg-secondary text-secondary-foreground flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-3.5 font-bold transition-all duration-200 hover:scale-105 active:scale-100"
            >
              <Navigation size={18} />
              Use My Current Location
            </button>
          </div>
        )}

        {/* --- LOADING, ERROR & RESULT STATES --- */}
        <div ref={resultRef}>
          {isLoading && <LoadingSpinner />}
          {error && (
            <p className="animate-fade-in bg-destructive text-destructive-foreground rounded-lg p-4 text-center">
              {error}
            </p>
          )}
          {result && <ResultCard result={result} />}
        </div>

        {/* --- POPULAR CITIES SECTION --- */}
        <div className="w-full pt-8">
          <h3 className="mb-6 text-center text-xl font-bold">Popular Cities</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {popularCities.map((city) => {
              const status = initialPopularStatuses[city];
              return (
                <div key={city}>
                  {status ? (
                    <CompactResultCard result={status} />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl text-sm">
                      Loading...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- RANDOM CITY BUTTON --- */}
        <div className="w-full pt-2">
          <button
            onClick={handleRandomCity}
            disabled={isLoading}
            className="bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed w-full cursor-pointer rounded-full px-4 py-3.5 font-bold transition-all duration-200 disabled:scale-100 hover:scale-105 active:scale-100"
          >
            {isLoading ? "Searching the globe..." : "🌍 Give me a random one"}
          </button>
        </div>
      </div>
    </main>
  );
}
