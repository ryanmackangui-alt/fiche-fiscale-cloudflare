/* Gabarit email et choix de la fiche du jour. Aucune dépendance externe. */

/* ==================================================================
   À PERSONNALISER. Tout ce que tu veux changer est dans ce bloc.
   Le reste du fichier n'a pas besoin d'être touché.
   ================================================================== */

const VOIX = {
  // Ton prénom, affiché dans la signature et l'accroche.
  prenom: "Rayane",

  // Ce que tu signes en bas de l'email.
  signature: "Rayane",

  // L'adresse à laquelle les lecteurs peuvent répondre.
  // Les réponses reçues sont un très bon signal pour Gmail.
  emailReponse: "rayane-makangui@rayanemakangui.com",

  // L'emoji placé devant l'objet. Mets "" pour aucun.
  // Un emoji fait plus chaleureux mais pousse vers l'onglet Promotions.
  emojiObjet: "📊",

  // true  : version sobre, sans couleur ni bouton, pensée pour l'onglet Principal.
  // false : version graphique, avec bandeau coral et bloc de partage.
  sobre: false,

  // Les mots d'intro. Une variante est choisie chaque jour, et la même
  // journée donne toujours la même. Chaque variante est une liste de
  // paragraphes. Ajoute, retire ou réécris librement.
  // {salutation} devient "Bon lundi", "Bon vendredi", "Bonjour" selon le jour.
  intros: [
    [
      "Hello ici Rayane !",
      "Que vous soyez au bureau ou en vacances, je vous souhaite une excellente journée !",
    ],
    [
      "Hello, c'est Rayane !",
      "{salutation} à vous. Trois minutes de lecture, puis je vous rends votre journée.",
    ],
    [
      "Hello ici Rayane !",
      "Au bureau, dans le train ou entre deux rendez-vous, voici la fiche du jour.",
    ],
    [
      "Salut, ici Rayane !",
      "{salutation} ! J'espère que la semaine se passe bien de votre côté.",
    ],
    [
      "Hello ici Rayane !",
      "{salutation} ! On attaque avec une règle utile et un exemple chiffré.",
    ],
    [
      "Hello, Rayane à l'appareil !",
      "Un café, la fiche du jour, et vous saurez une chose de plus qu'hier.",
    ],
    [
      "Salut, c'est Rayane !",
      "{salutation} à vous. La fiche du jour est courte, comme toujours.",
    ],
    [
      "Hello ici Rayane !",
      "Que la journée soit chargée ou tranquille, celle-ci se lit en trois minutes.",
    ],
  ],

  // Le post-scriptum, sous la signature. Mets "" pour aucun.
  ps: "Une question sur une fiche ? Répondez directement à cet email, je lis tout.",

  // L'email de bienvenue, envoyé immédiatement à l'inscription.
  bienvenue: {
    sujet: "Bienvenue, votre première fiche arrive demain à midi",
    paragraphes: [
      "Hello ici Rayane !",
      "Merci de vous être inscrit. À partir de demain, vous recevrez chaque jour à midi une règle de fiscalité d'entreprise expliquée en trois minutes : le principe, un exemple chiffré, l'erreur classique et la limite légale.",
      "Les trente fiches suivent une progression. On commence par les bases, ce que coûte vraiment une activité et comment fonctionne l'impôt quand on se lance. On termine par les montages d'optimisation, holding, apport-cession, pacte Dutreil, avec chaque fois l'endroit précis où l'administration considère qu'on a passé la ligne.",
    ],
    // Le service à demander tout de suite, tant que l'attention est là.
    demandeTitre: "Deux gestes qui prennent trente secondes",
    demandeTexte:
      "Gmail range ce type d'email dans l'onglet Promotions. Glissez celui-ci vers l'onglet Principal, et acceptez quand Gmail proposera d'appliquer le changement aux suivants. Puis répondez à cet email, même par un seul mot : c'est le signal le plus fort pour que les prochaines fiches arrivent sous vos yeux.",
    lienTexte: "Lire une fiche tout de suite",
  },

  // Le texte du bloc de partage.
  partageTitre: "Ça vous a été utile ?",
  partageTexte: "Transférez cet email à quelqu'un qui monte sa boîte, ou partagez le lien. C'est ce qui fait grandir cette newsletter.",
};

/* ================================================================== */

const ORIGINE = Date.UTC(2026, 0, 1);

/* Index de la fiche du jour, calculé sur la date de Paris.
   Le site et l'email tombent forcément sur la même fiche. */
export function indexDuJour(total, date = new Date()) {
  const p = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [a, m, j] = p.split("-").map(Number);
  const jours = Math.floor((Date.UTC(a, m - 1, j) - ORIGINE) / 86400000);
  return ((jours % total) + total) % total;
}

export function dateLongue(date = new Date()) {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

/* Salutation qui varie avec le jour, pour ne pas écrire deux fois
   la même phrase dans la semaine. */
function salutation(date = new Date()) {
  const jour = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
  }).format(date);
  const variantes = {
    lundi: "Bon lundi",
    mardi: "Bonjour",
    mercredi: "Bon mercredi",
    jeudi: "Bonjour",
    vendredi: "Bon vendredi",
    samedi: "Bon samedi",
    dimanche: "Bon dimanche",
  };
  return variantes[jour] || "Bonjour";
}

/* Variante d'intro du jour. Le pas de 7 évite que la rotation des mots
   se cale sur celle des fiches, ce qui donnerait toujours la même paire. */
function introDuJour(date = new Date()) {
  const liste = Array.isArray(VOIX.intros) && VOIX.intros.length ? VOIX.intros : [[]];
  const p = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [a, m, j] = p.split("-").map(Number);
  const jours = Math.floor((Date.UTC(a, m - 1, j) - ORIGINE) / 86400000);
  const i = (((jours * 7 + 3) % liste.length) + liste.length) % liste.length;
  return liste[i].filter(Boolean);
}

/* Objet de l'email, avec emoji. */
export function sujetEmail(fiche) {
  const e = VOIX.emojiObjet ? `${VOIX.emojiObjet} ` : "";
  return `${e}${fiche.tampon} : ${fiche.titre}`.slice(0, 120);
}

/* Adresse de réponse, lue par la fonction d'envoi. */
export function adresseReponse() {
  return VOIX.emailReponse || null;
}

function echapper(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function emailHtml(fiche, urlSite, dateStr, date = new Date(), lienDesinscription = null) {
  if (VOIX.sobre) return emailSobre(fiche, urlSite, dateStr, date, lienDesinscription);
  const paragraphes = introDuJour(date).map((t) => t.replace("{salutation}", salutation(date)));

  const partageTexte = encodeURIComponent(
    `Je suis cette newsletter : une règle de fiscalité d'entreprise par jour, en trois minutes. ${urlSite}`
  );
  const lienWhatsapp = `https://wa.me/?text=${partageTexte}`;
  const lienMail = `mailto:?subject=${encodeURIComponent(
    "Une newsletter qui pourrait t'intéresser"
  )}&body=${partageTexte}`;

  const bloc = (num, etiquette, texte, couleur, epaisseur) => `
    <tr><td style="padding:24px 0 0;border-top:${epaisseur}px solid ${couleur};">
      <div style="font-family:'Arial Narrow',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.2em;font-size:9.5px;font-weight:bold;color:${couleur};padding-bottom:9px;"><span style="color:#EE6A4D;">${num}</span>&nbsp;&nbsp;${etiquette}</div>
      <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.68;color:#1F1D1A;">${echapper(texte)}</div>
    </td></tr>`;

  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:26px 12px;background:#E9E5DC;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#F1EDE4;border:1px solid #CCC5B6;">
  <tr><td style="padding:30px 26px 28px;">

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1F1D1A;"></span>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EE6A4D;"></span>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#7E9086;"></span>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#6F7A6E;"></span>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#C2A878;"></span>
        </td>
        <td align="right" style="font-family:'Arial Narrow',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:9.5px;font-weight:bold;color:#5C574E;">${echapper(dateStr)}</td>
      </tr>
    </table>

    <!-- mot d'introduction -->
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F1D1A;padding-top:26px;">
      ${paragraphes.map((t) => `<p style="margin:0 0 12px;">${echapper(t)}</p>`).join("")}
    </div>

    <!-- la fiche -->
    <div style="font-family:'Arial Narrow',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.19em;font-size:9.5px;font-weight:bold;color:#5C574E;padding-top:30px;">
      Fiche n° ${String(fiche.id).padStart(3, "0")} &nbsp;/&nbsp; <span style="color:#EE6A4D;">${echapper(fiche.niveau)}</span>
    </div>

    <div style="background:#EE6A4D;color:#F1EDE4;display:inline-block;padding:8px 11px;margin-top:14px;font-family:Impact,'Arial Narrow',Helvetica,sans-serif;text-transform:uppercase;letter-spacing:.02em;font-size:14px;">${echapper(fiche.tampon)}</div>

    <h1 style="font-family:Impact,'Arial Narrow',Helvetica,sans-serif;font-size:33px;line-height:1.04;font-weight:normal;letter-spacing:.005em;text-transform:uppercase;color:#1F1D1A;margin:16px 0 0;">${echapper(fiche.titre)}</h1>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:26px;">
      ${bloc("01", "Le principe", fiche.principe, "#7E9086", 1)}
      ${bloc("02", "Exemple chiffré", fiche.exemple, "#7E9086", 1)}
      ${bloc("03", "L'erreur classique", fiche.erreur, "#7E9086", 1)}
      ${bloc("04", "La limite légale", fiche.limite, "#EE6A4D", 3)}
    </table>

    <div style="margin-top:26px;padding-top:13px;border-top:1px solid #1F1D1A;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.06em;color:#5C574E;">
      ${(fiche.references || []).map(echapper).join(" &nbsp;·&nbsp; ")}
    </div>

    <!-- signature -->
    <div style="margin-top:30px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F1D1A;">
      À demain,<br />
      <span style="font-family:Impact,'Arial Narrow',Helvetica,sans-serif;font-size:19px;letter-spacing:.02em;">${echapper(VOIX.signature)}</span>
    </div>

    ${
      VOIX.ps
        ? `<div style="margin-top:14px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.65;color:#5C574E;font-style:italic;">${echapper(VOIX.ps)}</div>`
        : ""
    }

    <!-- partage -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:30px;background:#1F1D1A;">
      <tr><td style="padding:22px 22px 20px;">
        <div style="font-family:Impact,'Arial Narrow',Helvetica,sans-serif;font-size:19px;letter-spacing:.02em;color:#F1EDE4;">${echapper(VOIX.partageTitre)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.65;color:#A9A297;padding:9px 0 16px;">${echapper(VOIX.partageTexte)}</div>
        <a href="${lienWhatsapp}" style="display:inline-block;background:#EE6A4D;color:#F1EDE4;text-decoration:none;font-family:'Arial Narrow',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:bold;padding:12px 18px;margin:0 8px 8px 0;">Partager sur WhatsApp</a>
        <a href="${lienMail}" style="display:inline-block;border:1px solid #5C574E;color:#F1EDE4;text-decoration:none;font-family:'Arial Narrow',Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:bold;padding:12px 18px;margin:0 0 8px 0;">Envoyer par email</a>
      </td></tr>
    </table>

    <div style="margin-top:26px;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;line-height:1.65;color:#5C574E;">
      Veille pédagogique, pas un conseil fiscal : fais valider toute décision par ton expert-comptable.
      <br /><a href="${urlSite}" style="color:#EE6A4D;">Lire les autres fiches</a>${
        lienDesinscription
          ? ` &nbsp;·&nbsp; <a href="${lienDesinscription}" style="color:#5C574E;">Se désinscrire</a>`
          : ""
      }
    </div>

  </td></tr>
</table>
</body></html>`;
}


/* ------------------------------------------------------------------
   Version sobre. Pas d'aplat de couleur, pas de bouton, pas d'image.
   Une seule colonne de texte, des liens en clair. C'est la forme qui
   ressemble le moins à une promotion aux yeux de Gmail.
------------------------------------------------------------------ */
function emailSobre(fiche, urlSite, dateStr, date, lienDesinscription) {
  const paragraphes = introDuJour(date).map((t) => t.replace("{salutation}", salutation(date)));

  const partage = encodeURIComponent(
    `Je suis cette newsletter : une règle de fiscalité d'entreprise par jour, en trois minutes. ${urlSite}`
  );

  const section = (etiquette, texte) => `
    <p style="margin:0 0 6px;font-size:13px;color:#666666;"><strong>${etiquette}</strong></p>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.62;color:#222222;">${echapper(texte)}</p>`;

  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:20px;background:#ffffff;">
<div style="max-width:560px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:#222222;">

  ${paragraphes.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;">${echapper(t)}</p>`).join("")}

  <p style="margin:26px 0 4px;font-size:13px;color:#666666;">Fiche ${String(fiche.id).padStart(3, "0")} sur 30, niveau ${echapper(fiche.niveau)}, ${echapper(dateStr)}</p>
  <p style="margin:0 0 24px;font-size:19px;line-height:1.35;font-weight:bold;">${echapper(fiche.titre)}</p>

  ${section("Le principe", fiche.principe)}
  ${section("Exemple chiffré", fiche.exemple)}
  ${section("L'erreur classique", fiche.erreur)}
  ${section("La limite légale", fiche.limite)}

  <p style="margin:0 0 26px;font-size:13px;color:#666666;">Références : ${(fiche.references || []).map(echapper).join(", ")}</p>

  <p style="margin:0 0 4px;font-size:15px;line-height:1.7;">À demain,<br />${echapper(VOIX.signature)}</p>

  ${VOIX.ps ? `<p style="margin:14px 0 0;font-size:14px;line-height:1.65;color:#555555;">${echapper(VOIX.ps)}</p>` : ""}

  <p style="margin:26px 0 0;font-size:14px;line-height:1.7;color:#555555;">
    ${echapper(VOIX.partageTexte)}<br />
    <a href="https://wa.me/?text=${partage}" style="color:#1a5490;">Partager sur WhatsApp</a> &nbsp;·&nbsp;
    <a href="mailto:?subject=${encodeURIComponent("Une newsletter qui pourrait t'intéresser")}&body=${partage}" style="color:#1a5490;">Envoyer par email</a>
  </p>

  <p style="margin:26px 0 0;padding-top:16px;border-top:1px solid #dddddd;font-size:12px;line-height:1.6;color:#777777;">
    Veille pédagogique, pas un conseil fiscal : fais valider toute décision par ton expert-comptable.
    <a href="${urlSite}" style="color:#1a5490;">Lire les autres fiches</a>${
      lienDesinscription
        ? ` &nbsp;·&nbsp; <a href="${lienDesinscription}" style="color:#777777;">Se désinscrire</a>`
        : ""
    }
  </p>

</div>
</body></html>`;
}


/* ------------------------------------------------------------------
   Email de bienvenue, envoyé au moment de l'inscription.
------------------------------------------------------------------ */
export function sujetBienvenue() {
  const e = VOIX.emojiObjet ? `${VOIX.emojiObjet} ` : "";
  return `${e}${VOIX.bienvenue.sujet}`.slice(0, 120);
}

export function emailBienvenue(urlSite, lienDesinscription = null) {
  const b = VOIX.bienvenue;

  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:26px 12px;background:#E9E5DC;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#F1EDE4;border:1px solid #CCC5B6;">
  <tr><td style="padding:30px 26px 28px;">

    <div>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1F1D1A;"></span>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#EE6A4D;"></span>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#7E9086;"></span>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#6F7A6E;"></span>
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#C2A878;"></span>
    </div>

    <div style="height:2px;background:#EE6A4D;width:58px;margin-top:24px;"></div>

    <h1 style="font-family:Impact,'Arial Narrow',Helvetica,sans-serif;font-size:30px;line-height:1.08;font-weight:normal;color:#1F1D1A;margin:20px 0 22px;">C'est enregistré.</h1>

    ${b.paragraphes
      .map(
        (t) =>
          `<p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F1D1A;margin:0 0 14px;">${echapper(t)}</p>`
      )
      .join("")}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:26px;background:#1F1D1A;">
      <tr><td style="padding:22px 22px 20px;">
        <div style="font-family:Impact,'Arial Narrow',Helvetica,sans-serif;font-size:18px;letter-spacing:.02em;color:#F1EDE4;">${echapper(b.demandeTitre)}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13.5px;line-height:1.68;color:#A9A297;padding-top:10px;">${echapper(b.demandeTexte)}</div>
      </td></tr>
    </table>

    <p style="margin:26px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F1D1A;">
      <a href="${urlSite}" style="color:#EE6A4D;">${echapper(b.lienTexte)}</a>
    </p>

    <p style="margin:26px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1F1D1A;">
      À demain,<br />
      <span style="font-family:Impact,'Arial Narrow',Helvetica,sans-serif;font-size:19px;letter-spacing:.02em;">${echapper(VOIX.signature)}</span>
    </p>

    <div style="margin-top:26px;padding-top:14px;border-top:1px solid #CCC5B6;font-family:Helvetica,Arial,sans-serif;font-size:11.5px;line-height:1.65;color:#5C574E;">
      Veille pédagogique, pas un conseil fiscal : fais valider toute décision par ton expert-comptable.${
        lienDesinscription
          ? ` <a href="${lienDesinscription}" style="color:#5C574E;">Se désinscrire</a>`
          : ""
      }
    </div>

  </td></tr>
</table>
</body></html>`;
}
