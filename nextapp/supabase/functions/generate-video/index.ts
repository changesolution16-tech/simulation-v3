import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VideoRequest {
  scenarioId: string;
  prompt: string;
  videoType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { scenarioId, prompt, videoType }: VideoRequest = await req.json();

    // Get API key from environment
    const synthesiaApiKey = Deno.env.get("SYNTHESIA_API_KEY");
    if (!synthesiaApiKey) {
      throw new Error("SYNTHESIA_API_KEY not configured");
    }

    // Call Synthesia API directly using fetch
    const synthesiaResponse = await fetch("https://api.synthesia.io/v2/videos", {
      method: "POST",
      headers: {
        "Authorization": synthesiaApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: false,
        input: [
          {
            scriptText: prompt,
            avatar: "anna_costume1_cameraA",
            background: "office1",
          }
        ],
        title: `Scenario ${scenarioId} - ${videoType}`,
        visibility: "public",
      }),
    });

    if (!synthesiaResponse.ok) {
      const errorData = await synthesiaResponse.text();
      throw new Error(`Synthesia API error: ${errorData}`);
    }

    const video = await synthesiaResponse.json();

    // Store video details in Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: dbError } = await supabase
      .from("scenario_videos")
      .upsert({
        scenario_id: scenarioId,
        video_type: videoType,
        synthesia_video_id: video.id,
        video_url: video.download || "",
        metadata: { status: "processing" },
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to store video data: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({ videoId: video.id, status: "processing" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating video:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});