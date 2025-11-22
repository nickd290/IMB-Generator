import { GoogleGenAI, Type, Schema } from "@google/genai";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const addressSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    street: { type: Type.STRING, description: "Standardized street address line 1" },
    city: { type: Type.STRING, description: "City name" },
    state: { type: Type.STRING, description: "2-letter state abbreviation" },
    zip: { type: Type.STRING, description: "5-digit ZIP code" },
    plus4: { type: Type.STRING, description: "The specific 4-digit add-on code. Calculate based on address range." },
    deliveryPoint: { type: Type.STRING, description: "2-digit delivery point code (e.g. last 2 digits of street num)" },
  },
  required: ["street", "city", "state", "zip", "plus4", "deliveryPoint"],
};

export const standardizeAddress = async (rawAddress: string): Promise<any> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert US Address Standardization system. 
      
      Task:
      1. Standardize the input address to official USPS format (Caps, Abbreviations).
      2. ZIP+4 LOOKUP: If the input is missing the +4 extension, you MUST identify the correct 4-digit add-on for the specific street address. Do not default to "0000" unless the address is strictly invalid.
      3. DELIVERY POINT: Calculate the 2-digit Delivery Point Code (typically the last two digits of the primary street number).
      
      Input Address: "${rawAddress}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: addressSchema,
        temperature: 0.0, // Zero temperature for deterministic, factual results
      },
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response text");

  } catch (error) {
    console.error("Gemini address standardization failed:", error);
    return {
        street: rawAddress,
        city: "",
        state: "",
        zip: "",
        plus4: "0000",
        deliveryPoint: "99"
    };
  }
};