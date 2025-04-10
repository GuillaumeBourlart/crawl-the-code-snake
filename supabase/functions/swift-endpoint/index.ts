
import { serve } from "https://deno.land/std@0.125.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js?target=deno";

// Récupération des variables d'environnement
const supabaseUrl = Deno.env.get("SB_URL");
const supabaseAnonKey = Deno.env.get("SB_ANON_KEY");
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

console.log("Initialisation de swift-endpoint avec les variables d'environnement:", {
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
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Récupérer le chemin de l'URL pour router
  const url = new URL(req.url);
  const pathname = url.pathname;

  console.log(`Requête reçue sur: ${pathname}`);

  // --- Endpoint Webhook Stripe ---
  // Doit être appelé via https://ckvbjbclofykscigudjs.supabase.co/functions/v1/swift-endpoint/webhook-stripe
  if (pathname.includes("/webhook-stripe")) {
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { user_id, skin_id } = session.metadata;
      // Met à jour la table user_skins sur Supabase
      const { error } = await supabase.from("user_skins").insert({
        user_id,
        skin_id,
        purchase_date: new Date().toISOString(),
        transaction_id: session.id
      });
      if (error) {
        console.error("Erreur insertion user_skins:", error);
      } else {
        console.log(`Skin ${skin_id} acheté par ${user_id} enregistré.`);
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  // --- Endpoint pour créer une session de paiement ---
  // Normalement appelé via supabase.functions.invoke("swift-endpoint", { body: {...} })
  else {
    try {
      console.log("Demande de création de session de paiement reçue");
      
      // Vérifier l'authentification
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error("Authentification manquante");
        throw new Error("Authentification requise");
      }
      
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !userData.user) {
        console.error("Erreur d'authentification:", authError);
        throw new Error("Authentification requise");
      }
      
      const user = userData.user;
      console.log("Utilisateur authentifié:", user.id, user.email);
      
      // Récupérer les données de la requête
      const requestData = await req.json().catch(e => {
        console.error("Erreur de parsing du corps de la requête:", e);
        return {};
      });
      
      const { skinId, priceAmount, skinName } = requestData;
      console.log("Détails de la demande de paiement:", { skinId, priceAmount, skinName });
      
      if (!skinId) {
        console.error("ID du skin manquant");
        throw new Error("ID du skin requis");
      }

      // Vérifier si l'utilisateur a déjà un customer Stripe
      console.log("Recherche d'un client Stripe pour l'email:", user.email);
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId;
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log("Utilisation du client Stripe existant:", customerId);
      } else {
        // Créer un nouveau client si aucun n'existe
        console.log("Création d'un nouveau client Stripe pour l'utilisateur:", user.id);
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
          },
        });
        customerId = customer.id;
        console.log("Nouveau client Stripe créé:", customerId);
      }

      // Créer une session de paiement unique
      console.log("Création d'une session de paiement avec prix:", priceAmount, "pour le skin:", skinName);
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
              unit_amount: Math.round(priceAmount * 100), // Conversion en centimes
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

      console.log("Session de paiement créée:", session.id, session.url);
      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (err) {
      console.error("Erreur de création de session de paiement:", err.message);
      console.error("Stack d'erreur:", err.stack);
      
      return new Response(JSON.stringify({ error: err.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }
});
