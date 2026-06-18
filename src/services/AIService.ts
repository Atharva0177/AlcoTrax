import { GoogleGenAI } from "@google/genai";
import { type LoggedDrink, type SessionSummary, type CustomDrink } from "../types";

let ai: GoogleGenAI | null = null;

export const getGeminiAPI = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

export async function getSmartCoaching(sessionHistory: SessionSummary[], goals: string = ''): Promise<string | null> {
  const gemini = getGeminiAPI();
  if (!gemini || sessionHistory.length === 0) return null;

  try {
    const recentHistory = sessionHistory.slice(-14).map(s => ({
      date: new Date(s.timestamp).toLocaleDateString(),
      durationMins: s.durationMins,
      drinkCount: s.drinkCount,
      peakBac: s.peakBac,
      waterVolume: s.waterVolume,
      totalUnits: s.totalUnits
    }));
    
    let goalsText = goals ? `The user has stated the following personal goals: "${goals}". Center your advice around these goals.` : '';

    const response = await gemini.models.generateContent({
      model: "gemini-3.1-flash-lite", // Using a faster model for simple insights
      contents: `You are an empathetic, non-judgmental wellness coach helping someone moderate their drinking. 
Here is the user's recent drinking session history: 
${JSON.stringify(recentHistory, null, 2)}
${goalsText}

Provide a very short, 1-2 sentence encouraging insight or suggestion based on their pattern. 
Examples: "You tend to drink mostly on Fridays. Try alternating with water this Friday!" or "Great job drinking water during your last session!" or "Your BAC tends to peak higher on weekends. Consider starting with lower ABV drinks."
Only output the coaching message, no other text.`,
      config: {
        temperature: 0.7
      }
    });

    return response.text;
  } catch (err: any) {
    console.warn("AI Coaching fallback used due to API limitation:", err.message || err);
    const lastSession = sessionHistory[sessionHistory.length - 1];
    if (lastSession) {
      if ((lastSession.totalUnits || 0) > 4) {
        return "Your last recorded session indicates peak metabolic load. Prioritize deep hydration and sleep recovery.";
      } else {
         return "Your recent baseline looks stable. Maintaining low metabolic disruption optimizes cognitive resilience.";
      }
    }
    return "Hydration and consistent sleep cycles are the two foundational pillars of optimal metabolic clearance.";
  }
}

export async function getDrinkSuggestions(
  currentBac: number, 
  currentDrinks: LoggedDrink[], 
  drinkLibrary: CustomDrink[],
  goals: string = ''
): Promise<string | null> {
  const gemini = getGeminiAPI();
  if (!gemini) return null;

  try {
    const recentDrinks = currentDrinks.slice(-3).map(d => ({ name: d.name, abv: d.abv }));
    let goalsText = goals ? `The user has stated the following personal goals regarding drinking: "${goals}". Strongly consider these goals in your recommendation.` : '';
    
    // Suggest alternatives
    const response = await gemini.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `You are a helpful wellness assistant promoting mindful drinking.
The current time is ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}. 
The user is currently drinking. Current BAC: ${currentBac.toFixed(3)}.
Recent drinks in this session: ${JSON.stringify(recentDrinks)}.
Available saved drinks in their library: ${JSON.stringify(drinkLibrary.map(d => ({name: d.name, abv: d.abv})))}.
${goalsText}

If their BAC is above 0.05 or they've had a few high ABV drinks, suggest a lower ABV alternative or a specific mocktail/water break in a friendly, concise 1 sentence tone. 
Consider the time of day: if it's late at night, strongly suggest water or concluding the session. If it's early, pacing is key.
Example: "It's getting late, how about finishing the night with a glass of club soda to meet your goal of drinking less?"
Only output the suggestion, no other text.`,
      config: {
        temperature: 0.7
      }
    });

    return response.text;
  } catch (err: any) {
    console.warn("AI Suggestion fallback used due to API limitation:", err.message || err);
    if (currentBac > 0.05) {
       return "Your metabolic load is elevating. A hydration break is highly recommended right now.";
    }
    return "Maintaining an even pace optimizes metabolic clearance and sleep architecture.";
  }
}
