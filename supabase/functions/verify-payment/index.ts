
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
    console.log("Payment verification request received");
    
    // Verify request body
    const body = await req.json().catch(e => {
      console.error("Error parsing request body:", e);
      return {};
    });
    
    const { sessionId } = body;
    
    console.log("Verifying payment for session:", sessionId);
    
    if (!sessionId) {
      console.error("Missing session ID in request");
      throw new Error("Missing session ID");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key is missing");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables");
      throw new Error("Server configuration error: Missing Supabase credentials");
    }
    
    console.log("Initializing Supabase with URL:", supabaseUrl);
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Authentication required");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error("Authentication error:", authError);
      throw new Error("Authentication required");
    }
    
    const user = data.user;
    console.log("Authenticated user:", user.id);

    // Retrieve the Checkout session to verify payment
    console.log("Retrieving Stripe session:", sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log("Session payment status:", session.payment_status);

    if (session.payment_status !== "paid") {
      console.error("Payment not completed. Status:", session.payment_status);
      throw new Error("Payment not completed");
    }

    const userId = session.metadata?.userId;
    const skinId = parseInt(session.metadata?.skinId || "0");
    console.log("Session metadata:", { userId, skinId });

    // Verify that the user ID in the session matches the authenticated user
    if (userId !== user.id) {
      console.error("User mismatch:", { sessionUserId: userId, authenticatedUserId: user.id });
      throw new Error("User mismatch");
    }

    // Get the skin details
    const { data: skinData, error: skinError } = await supabaseClient
      .from("game_skins")
      .select("*")
      .eq("id", skinId)
      .single();

    if (skinError) {
      console.error("Skin lookup error:", skinError);
      throw new Error("Skin not found");
    }

    console.log("Found skin:", skinData?.name);

    // 1. Get the user's profile to update the skins array
    console.log("Fetching user profile for ID:", userId);
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("skins")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      throw new Error("Failed to get user profile");
    }

    // Prepare the updated skins array
    let userSkins = [];
    if (profileData && profileData.skins) {
      userSkins = Array.isArray(profileData.skins) ? [...profileData.skins] : [];
    }

    console.log("Current user skins:", userSkins);

    // Check if the user already owns this skin in the profile
    if (!userSkins.includes(skinId)) {
      // Add the new skin to the array
      userSkins.push(skinId);

      // Update the profile with the new skins array
      console.log("Updating profile with new skin:", skinId);
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ 
          skins: userSkins,
          // Aussi mettre à jour default_skin_id si c'est le premier skin de l'utilisateur
          ...(userSkins.length === 1 ? { default_skin_id: skinId } : {})
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error("Failed to update profile with new skin");
      }
    }

    // 2. Also record the purchase in the user_skins table
    // First check if we already have a record
    console.log("Checking if user already owns skin in user_skins table");
    const { data: existingSkin, error: existingSkinError } = await supabaseClient
      .from("user_skins")
      .select("*")
      .eq("user_id", userId)
      .eq("skin_id", skinId)
      .maybeSingle();

    if (existingSkinError) {
      console.error("Existing skin check error:", existingSkinError);
      throw new Error("Failed to check if user already owns skin");
    }

    // Only insert if the user doesn't already have this skin in user_skins
    if (!existingSkin) {
      console.log("Recording purchase in user_skins table");
      const { error: insertError } = await supabaseClient
        .from("user_skins")
        .insert({
          user_id: userId,
          skin_id: skinId,
          purchased_at: new Date().toISOString(), // Corrigé de purchase_date à purchased_at
          transaction_id: session.id
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to record skin purchase in user_skins");
      }
    }

    console.log("Payment verification successful");
    return new Response(
      JSON.stringify({
        success: true,
        skinName: skinData?.name,
        skinId: skinId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error.message);
    console.error("Error stack:", error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
