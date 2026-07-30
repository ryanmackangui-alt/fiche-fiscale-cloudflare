/* Fiche fiscale : logique front. Tout est local, aucune clé, aucun appel payant. */

const $ = (id) => document.getElementById(id);
const ORIGINE = Date.UTC(2026, 0, 1);

let fiches = [];
let captureDejaVue = false;

/* ---------- fiche du jour : même calcul que la fonction d'envoi ---------- */
function indexDuJour(total, date = new Date()) {
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

/* ---------- démarrage ---------- */
$("date-jour").textContent = new Date().toLocaleDateString("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

(async function charger() {
  try {
    const res = await fetch("/fiches.json");
    if (!res.ok) throw new Error("fiches");
    const data = await res.json();
    fiches = data.fiches || [];
    if (data.meta && data.meta.verifie_le) $("maj").textContent = data.meta.verifie_le;
    construireSommaire("Découverte");
    if (fiches.length) {
      afficherFiche(fiches[indexDuJour(fiches.length)]);
      $("btn-jour").setAttribute("data-actif", "1");
    }
  } catch (e) {
    afficherErreur("Les fiches n'ont pas pu être chargées. Recharge la page.");
  }
})();

function afficherErreur(txt) {
  const err = $("zone-erreur");
  err.textContent = txt;
  err.hidden = false;
}

/* ---------- boutons ---------- */
$("btn-jour").addEventListener("click", () => {
  if (!fiches.length) return;
  afficherFiche(fiches[indexDuJour(fiches.length)]);
  $("btn-jour").setAttribute("data-actif", "1");
  $("carte").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("btn-parcourir").addEventListener("click", () => {
  const s = $("sommaire");
  s.hidden = !s.hidden;
  $("btn-parcourir").textContent = s.hidden ? "Parcourir les 30 fiches" : "Masquer le sommaire";
  if (!s.hidden) s.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".sommaire .seg button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".sommaire .seg button").forEach((x) => x.setAttribute("data-on", "0"));
    b.setAttribute("data-on", "1");
    construireSommaire(b.dataset.niveau);
  });
});

const NOTES = {
  "Découverte": "Pour qui envisage de se lancer. Ce que coûte vraiment une activité, avant tout montage.",
  "Fondamental": "Pour qui dirige déjà. Les règles qui décident du montant de l'impôt payé.",
  "Avancé": "Les montages d'optimisation, et la frontière exacte de l'abus de droit.",
};

function construireSommaire(niveau) {
  const ol = $("liste-fiches");
  ol.innerHTML = "";
  $("sommaire-note").textContent = NOTES[niveau] || "";
  fiches
    .filter((f) => f.niveau === niveau)
    .forEach((f) => {
      const li = document.createElement("li");
      const b = document.createElement("button");
      const t = document.createElement("span");
      t.textContent = f.titre;
      const n = document.createElement("span");
      n.className = "mono liste-num";
      n.textContent = String(f.id).padStart(3, "0");
      b.append(n, t);
      b.addEventListener("click", () => {
        afficherFiche(f);
        $("btn-jour").setAttribute("data-actif", "0");
        $("carte").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      li.appendChild(b);
      ol.appendChild(li);
    });
}

/* ---------- rendu ---------- */
function afficherFiche(f) {
  $("zone-vide").hidden = true;
  $("carte").hidden = false;

  $("tampon-mot").textContent = f.tampon;
  $("tampon-niv").textContent = f.niveau;
  $("fiche-num").textContent = `Fiche ${String(f.id).padStart(3, "0")} / 30`;
  $("fiche-titre").textContent = f.titre;
  $("fiche-principe").textContent = f.principe;
  $("fiche-exemple").textContent = f.exemple;
  $("fiche-erreur").textContent = f.erreur;
  $("fiche-limite").textContent = f.limite;

  const refs = $("fiche-refs");
  refs.innerHTML = "";
  (f.references || []).forEach((r) => {
    const s = document.createElement("span");
    s.textContent = r;
    refs.appendChild(s);
  });

  observerFinDeLecture();
}

/* ---------- le bloc email apparaît au bas d'une fiche lue ---------- */
function observerFinDeLecture() {
  if (captureDejaVue) return;
  const obs = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        captureDejaVue = true;
        $("capture").hidden = false;
        obs.disconnect();
      }
    },
    { threshold: 0.6 }
  );
  obs.observe($("fiche-refs"));
}

/* ---------- inscription ---------- */
$("btn-inscrire").addEventListener("click", inscrire);
$("email").addEventListener("keydown", (e) => {
  if (e.key === "Enter") inscrire();
});

async function inscrire() {
  const email = $("email").value.trim();
  const consent = $("consent").checked;
  const msg = $("message-inscription");
  const btn = $("btn-inscrire");

  const afficher = (etat, texte) => {
    msg.hidden = false;
    msg.dataset.etat = etat;
    msg.textContent = texte;
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    afficher("ko", "Cette adresse n'a pas l'air valide. Vérifie la saisie.");
    return;
  }
  if (!consent) {
    afficher("ko", "Coche la case de consentement pour recevoir la fiche quotidienne.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Enregistrement…";

  try {
    const res = await fetch("/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      afficher("ok", "C'est enregistré. La prochaine fiche arrive demain à midi.");
      $("email").value = "";
      $("consent").checked = false;
      btn.textContent = "Inscrit";
      return;
    }
    if (res.status === 409) {
      afficher("ok", "Cette adresse est déjà inscrite. Rien de plus à faire.");
    } else {
      afficher("ko", data.message || "L'inscription a échoué. Réessaie dans un instant.");
    }
  } catch (e) {
    afficher("ko", "L'inscription a échoué. Réessaie dans un instant.");
  }

  btn.textContent = "Recevoir la suite";
  btn.disabled = false;
}
