/* Envoi de la fiche du jour.

   Sur Cloudflare, les variables d'environnement arrivent dans l'objet `env`
   passé à chaque fonction. Rien n'est lu depuis process.env.

   Deux modes, réglés par la variable MODE_ENVOI :

   - "drip" (défaut) : chaque abonné reçoit la fiche 001 le lendemain de son
     inscription, puis la 002, etc. Envoi individuel, transactionnel.
   - "campagne" : tout le monde reçoit la même fiche le même jour.
*/

import { emailHtml, indexDuJour, dateLongue, sujetEmail, adresseReponse } from "./email.js";
import { listerAbonnes, jourDeParcours, lienDesinscription, envoyerUn } from "./abonnes.js";

function config(env) {
  const c = {
    cleBrevo: env.BREVO_API_KEY,
    listId: Number(env.BREVO_LIST_ID),
    urlSite: (env.SITE_URL || "").replace(/\/$/, ""),
    senderEmail: env.SENDER_EMAIL,
    senderName: env.SENDER_NAME || "Fiche fiscale",
    secret: env.UNSUB_SECRET || env.TEST_TOKEN,
    mode: (env.MODE_ENVOI || "drip").toLowerCase(),
  };
  const manquantes = [];
  if (!c.cleBrevo) manquantes.push("BREVO_API_KEY");
  if (!c.listId) manquantes.push("BREVO_LIST_ID");
  if (!c.urlSite) manquantes.push("SITE_URL");
  if (!c.senderEmail) manquantes.push("SENDER_EMAIL");
  if (!c.secret) manquantes.push("UNSUB_SECRET ou TEST_TOKEN");
  c.manquantes = manquantes;
  return c;
}

async function chargerFiches(env, urlSite) {
  // Les fichiers statiques sont accessibles directement par le binding ASSETS,
  // sans passer par le réseau. On retombe sur une requête HTTP si besoin.
  const requete = new Request(`${urlSite || "https://interne"}/fiches.json`);
  const res = env.ASSETS ? await env.ASSETS.fetch(requete) : await fetch(requete);
  if (!res.ok) throw new Error(`fiches.json inaccessible (${res.status})`);
  const { fiches } = await res.json();
  if (!Array.isArray(fiches) || !fiches.length) throw new Error("fiches.json vide ou mal formé");
  return fiches;
}

export async function envoyerFicheDuJour(env, { brouillon = false, cible = null } = {}) {
  const c = config(env);
  if (c.manquantes.length) {
    return { ok: false, message: `Variables manquantes : ${c.manquantes.join(", ")}` };
  }

  try {
    const fiches = await chargerFiches(env, c.urlSite);
    return c.mode === "campagne"
      ? await envoiCampagne(c, fiches, brouillon)
      : await envoiIndividuel(c, fiches, cible);
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

/* ---------- mode drip ---------- */
async function envoiIndividuel(c, fiches, cible) {
  const maintenant = new Date();
  const dateStr = dateLongue(maintenant);
  const abonnes = await listerAbonnes(c.cleBrevo, c.listId);

  let envoyes = 0;
  let termines = 0;
  let ignores = 0;
  const erreurs = [];

  for (const contact of abonnes) {
    const email = contact.email;
    if (cible && email.toLowerCase() !== cible.toLowerCase()) continue;

    const jour = jourDeParcours(contact, maintenant);
    if (jour === null || jour < 1) {
      ignores++;
      continue;
    }
    if (jour > fiches.length) {
      termines++;
      continue;
    }

    const fiche = fiches[jour - 1];
    const lienDesabo = await lienDesinscription(email, c.urlSite, c.secret);
    const html = emailHtml(fiche, c.urlSite, dateStr, maintenant, lienDesabo);

    try {
      await envoyerUn({
        cleBrevo: c.cleBrevo,
        senderName: c.senderName,
        senderEmail: c.senderEmail,
        replyTo: adresseReponse(),
        email,
        sujet: sujetEmail(fiche),
        html,
        lienDesabo,
      });
      envoyes++;
    } catch (e) {
      erreurs.push(`${email} : ${e.message}`);
    }
  }

  const resume =
    `Mode drip. ${envoyes} envoyé(s), ${ignores} pas encore commencé(s), ` +
    `${termines} série terminée, ${erreurs.length} erreur(s).` +
    (erreurs.length ? ` Détail : ${erreurs.slice(0, 3).join(" | ")}` : "");

  return { ok: erreurs.length === 0, message: resume };
}

/* ---------- mode campagne ---------- */
async function envoiCampagne(c, fiches, brouillon) {
  const maintenant = new Date();
  const dateStr = dateLongue(maintenant);
  const fiche = fiches[indexDuJour(fiches.length, maintenant)];

  const creation = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: { "content-type": "application/json", "api-key": c.cleBrevo },
    body: JSON.stringify({
      name: `Fiche ${dateStr} : ${fiche.titre}`.slice(0, 100),
      subject: sujetEmail(fiche),
      sender: { name: c.senderName, email: c.senderEmail },
      replyTo: adresseReponse() || c.senderEmail,
      htmlContent: emailHtml(fiche, c.urlSite, dateStr, maintenant),
      recipients: { listIds: [c.listId] },
    }),
  });

  if (!creation.ok) {
    return {
      ok: false,
      message: `Création de campagne refusée (${creation.status}) : ${(await creation.text()).slice(0, 300)}`,
    };
  }

  const { id } = await creation.json();

  if (brouillon) {
    return { ok: true, message: `Brouillon ${id} créé dans Brevo, fiche ${fiche.id} : ${fiche.titre}` };
  }

  const envoi = await fetch(`https://api.brevo.com/v3/emailCampaigns/${id}/sendNow`, {
    method: "POST",
    headers: { "api-key": c.cleBrevo },
  });

  if (!envoi.ok) {
    return { ok: false, message: `Envoi refusé (${envoi.status}) : ${(await envoi.text()).slice(0, 300)}` };
  }

  return { ok: true, message: `Campagne ${id} envoyée, fiche ${fiche.id} : ${fiche.titre}` };
}
