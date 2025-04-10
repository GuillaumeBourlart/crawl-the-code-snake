
// supabase/functions/create-checkout/index.ts
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
    const { skinId, priceAmount, skinName } = await req.json();
    
    console.log("Payment request received:", { skinId, priceAmount, skinName });
    
    if (!skinId || !priceAmount) {
      throw new Error("Missing required parameters");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !data.user) {
      console.error("Authentication error:", authError);
      throw new Error("Authentication required");
    }
    
    const user = data.user;
    console.log("Authenticated user:", user.id, user.email);

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key is missing");
      throw new Error("Stripe configuration error");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Check if an existing Stripe customer record exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Using existing Stripe customer:", customerId);
    } else {
      // Create a new customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new Stripe customer:", customerId);
    }

    // Create a one-time payment session
    console.log("Creating checkout session with price:", priceAmount);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'google_pay'],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { 
              name: `${skinName || "Game Skin"}`, 
              description: "Skin personnalisé pour Code Crawl"
            },
            unit_amount: Math.round(priceAmount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://crawl-the-code-snake.lovable.app/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://crawl-the-code-snake.lovable.app/skins`,
      metadata: {
        userId: user.id,
        skinId: skinId.toString(),
      },
    });

    console.log("Checkout session created:", session.id, session.url);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
