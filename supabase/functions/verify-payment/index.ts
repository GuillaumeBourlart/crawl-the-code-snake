
// supabase/functions/verify-payment/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Missing session ID");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      throw new Error("Authentication required");
    }
    
    const user = data.user;

    // Retrieve the Checkout session to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.userId;
    const skinId = parseInt(session.metadata?.skinId || "0");

    // Verify that the user ID in the session matches the authenticated user
    if (userId !== user.id) {
      throw new Error("User mismatch");
    }

    // Get the skin details
    const { data: skinData, error: skinError } = await supabaseClient
      .from("game_skins")
      .select("*")
      .eq("id", skinId)
      .single();

    if (skinError || !skinData) {
      throw new Error("Skin not found");
    }

    // Get the user's profile to update the skins array
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("skins")
      .eq("id", userId)
      .single();

    if (profileError) {
      throw new Error("Failed to get user profile");
    }

    // Prepare the updated skins array
    let userSkins = [];
    if (profileData && profileData.skins) {
      userSkins = Array.isArray(profileData.skins) ? [...profileData.skins] : [];
    }

    // Check if the user already owns this skin
    if (!userSkins.includes(skinId)) {
      // Add the new skin to the array
      userSkins.push(skinId);

      // Update the profile with the new skins array
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ skins: userSkins })
        .eq("id", userId);

      if (updateError) {
        throw new Error("Failed to update profile with new skin");
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        skinName: skinData.name,
        skinId: skinId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
