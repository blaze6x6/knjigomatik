import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("isbn") || request.nextUrl.searchParams.get("cobissId");
  if (!query) return NextResponse.json({ error: "Manjka COBISS ID" }, { status: 400 });

  const cobissId = query.replace(/[^0-9]/g, "").trim();
  if (!cobissId) return NextResponse.json({ error: "Neveljaven ID" }, { status: 400 });

  const thumbnailUrl = `https://d.cobiss.net/repository/si/thumbnails/cobib/${cobissId}`;

  try {
    const imgRes = await fetch(thumbnailUrl);
    if (!imgRes.ok) throw new Error("Napaka pri prenosu slike");
    
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    // Uporabimo aktualni priporočeni model gemini-3.6-flash
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      "Iz te naslovnice knjige preberi avtorja in naslov. Vrni odgovor izključno v JSON obliki z dvema ključema: 'title' (naslov knjige) in 'author' (avtor knjige). Brez dodatnega besedila in brez markdown oklepajev.",
    ]);

    const responseText = await result.response.text();
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    const parsedData = JSON.parse(cleanedJson);

    return NextResponse.json({
      title: parsedData.title || "Neznan naslov",
      author: parsedData.author || "Neznan avtor",
      year: null,
      thumbnail: thumbnailUrl,
      description: `https://plus.cobiss.net/cobiss/si/sl/bib/${cobissId}`,
      source: "Gemini AI Vision"
    });

  } catch (error: any) {
    console.error("AI Vision error:", error);
    return NextResponse.json({
      title: "Neznan naslov",
      author: "Neznan avtor",
      year: null,
      thumbnail: thumbnailUrl,
      description: `https://plus.cobiss.net/cobiss/si/sl/bib/${cobissId}`,
      source: "Samo povezava"
    });
  }
}