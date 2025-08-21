"use client";

import React, { useState } from "react";
import {
  Sun,
  Cloud,
  MapPin,
  Wind,
  Crosshair, // Changed from 'Navigation'
  Cloudy,
  CloudRain,
  Snowflake,
  Zap,
  Search,
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
    ];
    return messages[Math.floor(Math.random() * messages.length)]!;
  } else {
    const messages = [
      "Nah. Stay inside, the world is buffering.",
      "It's a no from me, dawg. The conditions are cringe.",
      "The outside has skill-based matchmaking today, and it's not in your favor.",
      "Stay indoors and farm some XP. The weather is currently OP.",
    ];
    return messages[Math.floor(Math.random() * messages.length)]!;
  }
};

// --- UI COMPONENTS ---

/**
 * Main Result Card: A more compact card for the primary result.
 */
const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  const isYes = result.verdict === "Yes";
  const WeatherIcon = getWeatherIcon(result.weather);
  const memeMessage = getMemeMessage(result.verdict);

  const cardClasses = isYes
    ? "bg-green-900/60 shadow-green-500/20"
    : "bg-red-900/60 shadow-red-500/20";
  const verdictTextClasses = isYes ? "text-green-300" : "text-red-300";

  return (
    <div
      className={`animate-fade-in flex h-full w-full flex-col justify-between rounded-2xl p-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-sm transition-all duration-500 ${cardClasses}`}
    >
      <div className="text-center">
        <p className="text-xl font-medium text-white/90">{result.city}</p>

        <p className="text-md font-medium text-white/70">
          {result.countryFlag}
        </p>

        <h2
          className={`my-2 text-7xl font-bold md:text-8xl ${verdictTextClasses}`}
        >
          {result.verdict}
        </h2>
        <p className="text-md text-white/80">{memeMessage}</p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-center">
        <div className="flex flex-col items-center gap-1">
          <WeatherIcon size={24} className="text-white/80" />
          <span className="text-md font-bold">{result.weather}</span>
          <span className="text-xs tracking-widest text-white/60 uppercase">
            Weather
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Wind size={24} className="text-white/80" />
          <span className="text-md font-bold">{result.aqi}</span>
          <span className="text-xs tracking-widest text-white/60 uppercase">
            AQI
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Cloud size={24} className="text-white/80" />
          <span className="text-md font-bold">{result.temp}</span>
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
    : "bg-red-900/50 hover:bg-red-900/80";
  return (
    <div
      className={`rounded-lg p-3 text-center ring-1 ring-white/10 transition-all duration-300 ${cardClasses}`}
    >
      <h4 className="text-md truncate font-bold text-white">{result.city}</h4>

      <p
        className={`text-2xl font-bold ${isYes ? "text-green-300" : "text-red-300"}`}
      >
        {result.verdict}
      </p>
      <p className="text-xs text-white/70">{result.temp}</p>
    </div>
  );
};

/**
 * Placeholder card for the initial view.
 */
const WelcomeCard = () => (
  <div className="animate-fade-in flex h-full flex-col items-center justify-center rounded-2xl bg-slate-800/80 p-6 text-center ring-1 ring-white/10">
    <Image src={AppLogo} alt="App Logo" className="h-24 w-auto" />
    <h2 className="mt-4 text-2xl font-bold text-white">
      Is it safe to venture out?
    </h2>

    <p className="text-white/70">
      Use the search bar above to check the outdoor conditions.
    </p>
  </div>
);

/**
 * Loading Spinner Component
 */
const LoadingSpinner = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl bg-slate-800/80 text-center ring-1 ring-white/10">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-600 border-t-green-500" />

    <p className="text-lg font-medium text-slate-300">
      Calibrating the grass-o-meter... 🤔
    </p>
  </div>
);

/**
 * Error Display Component
 */
const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="animate-fade-in bg-destructive/40 ring-destructive flex h-full flex-col items-center justify-center rounded-2xl p-6 text-center ring-1">
    <p className="text-destructive-foreground">{message}</p>
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
      setError("Yikes. The API is down. Maybe just look out the window? 🤷‍♂️");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!location) {
      setError("Bro, you gotta enter a location.");
      return;
    }
    void handleApiCall(getVerdictForCityAction(location));
  };

  const handleUseMyLocation = (): void => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        void handleApiCall(getVerdictForCoordsAction(latitude, longitude));
      },
      () => setError("Geolocation permission denied. I can't stalk you now."),
    );
  };

  const handleRandomCity = (): void => {
    void handleApiCall(getRandomCityVerdictAction());
  };

  return (
    <main className="text-foreground bg-background flex min-h-screen w-full flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl rounded-2xl bg-slate-900/60 p-5 shadow-2xl ring-1 ring-white/10 backdrop-blur-lg md:p-8">
        {/* --- HEADER & SEARCH --- */}
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3 self-start">
            <h1 className="text-foreground text-2xl font-extrabold tracking-tight">
              Should I Touch Grass?
            </h1>
          </div>

          <form onSubmit={handleSearch} className="flex w-full gap-2 md:w-auto">
            <div className="relative flex-grow">
              <MapPin
                className="absolute top-1/2 left-3 -translate-y-1/2 text-white/50"
                size={20}
              />

              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter a city..."
                className="border-border bg-muted/50 focus:ring-ring w-full rounded-full border-2 py-2 pr-4 pl-10 transition focus:ring-2 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="bg-accent text-accent-foreground grid h-10 w-10 flex-shrink-0 cursor-pointer place-items-center rounded-full font-bold transition-all hover:scale-105 active:scale-100"
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className="bg-secondary text-secondary-foreground grid h-10 w-10 flex-shrink-0 cursor-pointer place-items-center rounded-full font-bold transition-all hover:scale-105 active:scale-100"
              title="Use my device's location"
              aria-label="Use my device's location"
            >
              <Crosshair size={18} />
            </button>
          </form>
        </div>
        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          {/* --- LEFT COLUMN (Result Area) --- */}
          <div className="min-h-[350px] md:col-span-3">
            {isLoading ? <LoadingSpinner /> : null}
            {error ? <ErrorDisplay message={error} /> : null}
            {result ? <ResultCard result={result} /> : null}
            {!isLoading && !error && !result ? <WelcomeCard /> : null}
          </div>
          {/* --- RIGHT COLUMN (Popular/Random) --- */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <div>
              <h3 className="mb-3 text-center text-lg font-bold text-white/90 md:text-left">
                Popular Cities
              </h3>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2">
                {popularCities.map((city) => (
                  <div key={city}>
                    {initialPopularStatuses[city] ? (
                      <CompactResultCard
                        result={initialPopularStatuses[city]}
                      />
                    ) : (
                      <div className="flex h-full animate-pulse items-center justify-center rounded-lg bg-slate-800/50 p-3 text-xs">
                        {city}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleRandomCity}
              disabled={isLoading}
              className="mt-auto w-full cursor-pointer rounded-full bg-purple-500 px-4 py-3 font-bold text-white transition-all duration-200 hover:scale-105 hover:bg-purple-600 active:scale-100 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "🌍 Give me a random one"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
