
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

  // Webhook Stripe - chemin complet
  if (pathname.includes("/webhook-stripe")) {
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
  // Gestion de l'endpoint /create-checkout-session comme sous-route de swift-endpoint
  else if (pathname.includes("/create-checkout-session")) {
    try {
      console.log("Traitement de l'endpoint create-checkout-session");
      
      // Vérifier l'authentification
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error("Authentification manquante");
        return new Response(JSON.stringify({ error: "Authentification requise" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
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
    } catch (err) {
      console.error("Erreur endpoint create-checkout-session:", err.message);
      console.error("Stack:", err.stack);
      
      return new Response(JSON.stringify({ error: err.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  }
  // Gestion de l'endpoint /verify-payment via le système "path" dans le corps de la requête
  else if (pathname === "/v1/swift-endpoint") {
    try {
      console.log("Traitement d'une invocation directe de la fonction");
      
      // Vérifier l'authentification
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
      
      // Récupérer les données de la requête
      const requestData = await req.json().catch(e => {
        console.error("Erreur de parsing du corps de la requête:", e);
        return {};
      });
      
      // Endpoint verify-payment
      if (requestData.path === "/verify-payment") {
        console.log("Endpoint verify-payment");
        const { sessionId } = requestData;
        
        if (!sessionId) {
          console.error("sessionId manquant");
          return new Response(JSON.stringify({
            error: "sessionId est requis"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Récupérer la session Stripe
        console.log("Récupération de la session Stripe:", sessionId);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log("Session Stripe récupérée:", session.id, "Statut:", session.payment_status);
        
        if (session.payment_status !== "paid") {
          console.error("Paiement non complété. Statut:", session.payment_status);
          return new Response(JSON.stringify({
            error: "Paiement non complété"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        const userId = session.metadata?.userId || session.metadata?.user_id;
        const skinId = parseInt(session.metadata?.skinId || session.metadata?.skin_id || "0");
        console.log("Métadonnées de la session:", { userId, skinId });
        
        // Vérifier que l'utilisateur authentifié correspond à celui de la session
        if (userId !== user.id) {
          console.error("L'utilisateur authentifié ne correspond pas à l'utilisateur de la session");
          return new Response(JSON.stringify({
            error: "Non autorisé à vérifier ce paiement"
          }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Récupérer les informations du skin
        console.log("Récupération des informations du skin:", skinId);
        const { data: skinData, error: skinError } = await supabase
          .from("game_skins")
          .select("*")
          .eq("id", skinId)
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
        
        // Mettre à jour le profil de l'utilisateur
        console.log("Mise à jour du profil utilisateur");
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("skins")
          .eq("id", userId)
          .single();
        
        if (profileError) {
          console.error("Erreur récupération profil:", profileError);
          return new Response(JSON.stringify({
            error: "Profil utilisateur introuvable"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        
        // Préparer le tableau des skins de l'utilisateur
        let userSkins = [];
        if (profileData && profileData.skins) {
          userSkins = Array.isArray(profileData.skins) ? [...profileData.skins] : [];
        }
        
        console.log("Skins actuels de l'utilisateur:", userSkins);
        
        // Ajouter le nouveau skin s'il n'est pas déjà présent
        if (!userSkins.includes(skinId)) {
          userSkins.push(skinId);
          
          // Mettre à jour le profil
          console.log("Ajout du skin au profil utilisateur");
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ skins: userSkins })
            .eq("id", userId);
          
          if (updateError) {
            console.error("Erreur mise à jour profil:", updateError);
            return new Response(JSON.stringify({
              error: "Échec de la mise à jour du profil"
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        
        // Enregistrer l'achat dans la table user_skins si ce n'est pas déjà fait
        console.log("Vérification si l'achat est déjà enregistré");
        const { data: existingSkin, error: existingSkinError } = await supabase
          .from("user_skins")
          .select("*")
          .eq("user_id", userId)
          .eq("skin_id", skinId)
          .maybeSingle();
        
        if (existingSkinError) {
          console.error("Erreur vérification skin existant:", existingSkinError);
        }
        
        // Si l'achat n'est pas déjà enregistré, l'ajouter
        if (!existingSkin) {
          console.log("Enregistrement de l'achat dans user_skins");
          const { error: insertError } = await supabase
            .from("user_skins")
            .insert({
              user_id: userId,
              skin_id: skinId,
              purchase_date: new Date().toISOString(),
              transaction_id: session.id
            });
          
          if (insertError) {
            console.error("Erreur enregistrement achat:", insertError);
            return new Response(JSON.stringify({
              error: "Échec de l'enregistrement de l'achat"
            }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }
        
        console.log("Vérification du paiement terminée avec succès");
        return new Response(JSON.stringify({
          success: true,
          skinName: skinData.name,
          skinId: skinId
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        });
      } else {
        console.error("Endpoint non reconnu dans le chemin:", requestData.path);
        return new Response(JSON.stringify({
          error: "Endpoint non reconnu"
        }), {
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
  } else {
    console.error("Route non reconnue:", pathname);
    return new Response(JSON.stringify({
      error: "Route non reconnue"
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
