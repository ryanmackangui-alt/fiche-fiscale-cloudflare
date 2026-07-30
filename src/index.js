/* Point d'entrée unique du Worker.

   - Les fichiers statiques sont servis par le binding ASSETS.
   - Les routes /api/... sont traitées ici.
   - La tâche planifiée déclenche l'envoi quotidien, sans service externe. */

import { envoyerFicheDuJour } from "./lib/envoi.js";
import { signer, desinscrire } from "./lib/abonnes.js";

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const texte = (corps, status = 200) =>
  new Response(corps, { status, headers: { "content-type": "text/plain; charset=utf-8" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case "/api/inscription":
        return inscription(request, env);
      case "/api/envoi-test":
        return envoiTest(url, env);
      case "/api/envoi-quotidien":
        return envoiQuotidien(url, env);
      case "/api/desinscription":
        return desinscription(url, env);
      default:
        return env.ASSETS.fetch(request);
    }
  },

  /* Déclenché par le cron défini dans wrangler.jsonc. */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      envoyerFicheDuJour(env).then((r) => {
        if (r.ok) console.log(r.message);
        else console.error(r.message);
      })
    );
  },
};

/* ---------------------------------------------------------------- */

async function inscription(request, env) {
  if (request.method !== "POST") {
    return Response.json({ message: "Méthode non autorisée." }, { status: 405 });
  }

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return Response.json({ message: "Requête illisible." }, { status: 400 });
  }

  email = String(email || "").trim().toLowerCase();
  if (!EMAIL_OK.test(email) || email.length > 254) {
    return Response.json({ message: "Adresse invalide." }, { status: 400 });
  }

  const cle = env.BREVO_API_KEY;
  const listId = Number(env.BREVO_LIST_ID);
  if (!cle || !listId) {
    return Response.json({ message: "Service d'envoi non configuré." }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "content-type": "application/json", "api-key": cle },
      body: JSON.stringify({
        email,
        listIds: [listId],
        updateEnabled: true,
        attributes: { SOURCE: "site", CONSENTEMENT: new Date().toISOString() },
      }),
    });

    if (res.status === 201 || res.status === 204) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const detail = await res.json().catch(() => ({}));
    if (detail.code === "duplicate_parameter") {
      return Response.json({ message: "Déjà inscrit." }, { status: 409 });
    }

    console.error("Brevo:", res.status, JSON.stringify(detail));
    return Response.json({ message: "L'inscription a échoué." }, { status: 502 });
  } catch (e) {
    console.error("inscription :", e.message);
    return Response.json({ message: "L'inscription a échoué." }, { status: 502 });
  }
}

async function envoiTest(url, env) {
  if (!env.TEST_TOKEN) return texte("TEST_TOKEN n'est pas défini dans les variables.", 500);
  if (url.searchParams.get("cle") !== env.TEST_TOKEN) return texte("Jeton invalide.", 401);

  const r = await envoyerFicheDuJour(env, {
    brouillon: url.searchParams.get("brouillon") === "1",
    cible: url.searchParams.get("email"),
  });
  return texte(r.message, r.ok ? 200 : 500);
}

/* Conservé pour déclencher l'envoi à la main en cas de besoin.
   Le fonctionnement normal passe par le cron. */
async function envoiQuotidien(url, env) {
  const jeton = env.CRON_SECRET || env.TEST_TOKEN;
  if (!jeton) return texte("CRON_SECRET n'est pas défini.", 500);
  if (url.searchParams.get("cle") !== jeton) return texte("Jeton invalide.", 401);

  const r = await envoyerFicheDuJour(env);
  return texte(r.message, r.ok ? 200 : 500);
}

const PAGE = (titre, corps) => `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titre}</title></head>
<body style="margin:0;padding:60px 20px;background:#E9E5DC;font-family:Georgia,serif;color:#1F1D1A;">
<div style="max-width:460px;margin:0 auto;">
  <div style="width:52px;height:4px;background:#EE6A4D;margin-bottom:22px;"></div>
  <h1 style="font-size:24px;line-height:1.2;margin:0 0 14px;">${titre}</h1>
  <p style="font-size:15px;line-height:1.7;color:#5C574E;margin:0;">${corps}</p>
</div></body></html>`;

async function desinscription(url, env) {
  const email = (url.searchParams.get("e") || "").trim().toLowerCase();
  const signature = url.searchParams.get("s") || "";
  const secret = env.UNSUB_SECRET || env.TEST_TOKEN;

  const page = (titre, corps, status = 200) =>
    new Response(PAGE(titre, corps), {
      status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });

  if (!secret || !env.BREVO_API_KEY) {
    return page("Service indisponible", "La désinscription n'est pas configurée. Écris-nous et nous le ferons à la main.", 500);
  }

  if (!email || (await signer(email, secret)) !== signature) {
    return page("Lien invalide", "Ce lien de désinscription n'est pas valide. Utilise celui du dernier email reçu.", 400);
  }

  const ok = await desinscrire(env.BREVO_API_KEY, email);
  return ok
    ? page("C'est fait", "Tu ne recevras plus la fiche quotidienne. Le site reste accessible librement si tu veux continuer à lire.")
    : page("Échec", "La désinscription n'a pas pu être enregistrée. Réessaie dans un instant.", 502);
}
