
import { serve } from "https://deno.land/std@0.125.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js?target=deno";

// Récupération des variables d'environnement
const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("SB_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SB_ANON_KEY");
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Log des variables d'environnement pour débogage
console.log("Variables d'environnement:", {
  supabaseUrl: supabaseUrl ? "défini" : "non défini",
  supabaseAnonKey: supabaseAnonKey ? "défini" : "non défini",
  stripeSecretKey: stripeSecretKey ? "défini" : "non défini",
  stripeWebhookSecret: stripeWebhookSecret ? "défini" : "non défini"
});

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2022-11-15" });
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    console.log("Traitement d'une requête OPTIONS CORS preflight");
    return new Response(null, { 
      status: 204, // No Content
      headers: corsHeaders 
    });
  }
  
  try {
    // Récupérer le chemin de l'URL pour router
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    console.log(`Requête reçue sur: ${pathname}, méthode: ${req.method}`);
    
    // Vérifier l'authentification pour les endpoints autres que le webhook
    if (!pathname.includes("/webhook-stripe")) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error("Authentification manquante");
        return new Response(JSON.stringify({ error: "Authentification requise" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const token = authHeader.replace("Bearer ", "");
      console.log("Vérification du token d'authentification...");
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData.user) {
        console.error("Erreur d'authentification:", authError);
        return new Response(JSON.stringify({ error: "Authentification requise" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      const user = userData.user;
      console.log("Utilisateur authentifié:", user.id, user.email);
    }

    // Router vers le bon handler en fonction du chemin
    if (pathname.includes("/webhook-stripe")) {
      return await handleWebhookStripe(req, corsHeaders);
    } else if (pathname.includes("/create-checkout-session")) {
      return await handleCreateCheckoutSession(req, corsHeaders);
    } else if (pathname.includes("/verify-payment")) {
      return await handleVerifyPayment(req, corsHeaders);
    } else {
      console.error("Endpoint non reconnu:", pathname);
      return new Response(JSON.stringify({ error: "Endpoint non reconnu" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    console.error("Erreur générale:", err.message);
    console.error("Stack:", err.stack);
    
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Handler pour le webhook Stripe
async function handleWebhookStripe(req, corsHeaders) {
  console.log("Traitement d'un webhook Stripe");
  
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    console.error("Signature Stripe manquante dans l'en-tête");
    return new Response("Signature manquante", { status: 400, headers: corsHeaders });
  }
  
  const body = await req.text();
  let event;
  
  try {
    console.log("Vérification de la signature du webhook...");
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
    console.log("Événement Stripe validé:", event.type);
  } catch (err) {
    console.error("Échec de la vérification de la signature du webhook:", err.message);
    return new Response(`Erreur de webhook: ${err.message}`, { status: 400, headers: corsHeaders });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("Session de paiement complétée:", session.id);
    console.log("Métadonnées:", session.metadata);
    
    const { user_id, skin_id } = session.metadata;
    if (!user_id || !skin_id) {
      console.error("Métadonnées user_id ou skin_id manquantes");
      return new Response("Métadonnées incomplètes", { status: 400, headers: corsHeaders });
    }
    
    // Met à jour la table user_skins sur Supabase
    console.log(`Enregistrement de l'achat: skin ${skin_id} pour l'utilisateur ${user_id}`);
    const { error } = await supabase.from("user_skins").insert({
      user_id,
      skin_id,
      purchase_date: new Date().toISOString(),
      transaction_id: session.id
    });
    
    if (error) {
      console.error("Erreur insertion user_skins:", error);
      return new Response(`Erreur de base de données: ${error.message}`, { 
        status: 500, 
        headers: corsHeaders 
      });
    } else {
      console.log(`Skin ${skin_id} acheté par ${user_id} enregistré avec succès.`);
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Handler pour la création d'une session de paiement
async function handleCreateCheckoutSession(req, corsHeaders) {
  console.log("Endpoint create-checkout-session");
  
  // Récupérer les données de la requête
  const requestData = await req.json().catch(e => {
    console.error("Erreur de parsing du corps de la requête:", e);
    return {};
  });
  
  const { skin_id, user_id } = requestData;
  
  if (!skin_id || !user_id) {
    console.error("skin_id ou user_id manquant");
    return new Response(JSON.stringify({
      error: "skin_id et user_id sont requis."
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  // Récupérer les informations du skin
  console.log(`Récupération des informations pour le skin ${skin_id}`);
  const { data: skinData, error: skinError } = await supabase
    .from("game_skins")
    .select("*")
    .eq("id", skin_id)
    .single();
  
  if (skinError || !skinData) {
    console.error("Erreur récupération du skin:", skinError);
    return new Response(JSON.stringify({
      error: "Skin introuvable"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  if (!skinData.is_paid || !skinData.price) {
    console.error("Le skin n'est pas payant ou n'a pas de prix défini");
    return new Response(JSON.stringify({
      error: "Ce skin n'est pas disponible à l'achat"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  // Créer la session de paiement Stripe
  console.log("Création de la session de paiement Stripe...");
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { 
            name: skinData.name || "Game Skin",
            description: skinData.description || "Skin personnalisé pour Code Crawl"
          },
          unit_amount: Math.round(skinData.price * 100), // Conversion en centimes
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://crawl-the-code-snake.lovable.app/payment-success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://crawl-the-code-snake.lovable.app/skins",
    metadata: {
      user_id,
      skin_id
    }
  });
  
  console.log("Session de paiement créée:", session.id);
  return new Response(JSON.stringify({
    sessionId: session.id
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200
  });
}

// Handler pour la vérification d'un paiement
async function handleVerifyPayment(req, corsHeaders) {
  console.log("Endpoint verify-payment");
  
  // Récupérer les données de la requête
  const requestData = await req.json().catch(e => {
    console.error("Erreur de parsing du corps de la requête:", e);
    return {};
  });
  
  const { sessionId } = requestData;
  
  if (!sessionId) {
    console.error("sessionId manquant");
    return new Response(JSON.stringify({
      error: "sessionId est requis."
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  try {
    // Vérifier la session Stripe
    console.log("Vérification de la session Stripe:", sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      console.error("Le paiement n'a pas été effectué:", session.payment_status);
      return new Response(JSON.stringify({
        error: "Le paiement n'a pas été effectué",
        success: false
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      });
    }
    
    // Récupérer les métadonnées de la session
    const { skin_id } = session.metadata;
    
    // Récupérer les informations du skin
    console.log("Récupération des informations du skin:", skin_id);
    const { data: skinData, error: skinError } = await supabase
      .from("game_skins")
      .select("name")
      .eq("id", skin_id)
      .single();
      
    if (skinError) {
      console.error("Erreur lors de la récupération des informations du skin:", skinError);
    }
    
    return new Response(JSON.stringify({
      success: true,
      skinName: skinData?.name || "skin",
      skinId: skin_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (error) {
    console.error("Erreur lors de la vérification du paiement:", error);
    return new Response(JSON.stringify({
      error: "Erreur lors de la vérification du paiement",
      success: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
}
