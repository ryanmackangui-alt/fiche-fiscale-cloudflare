# Fiche fiscale, version Cloudflare Worker

Une règle de fiscalité d'entreprise française par jour : lisible sur le site, puis envoyée par email. 30 fiches écrites et relues, de la découverte aux montages d'optimisation.

**Coût : zéro.** Pas de crédits, pas de limite de déploiements, pas de carte bancaire.

## Arborescence

```
public/          les fichiers du site, servis tels quels
  index.html, styles.css, app.js, fiches.json, mentions.html
src/
  index.js       routage des /api/... et tâche planifiée
  lib/
    email.js     gabarits, textes, mots d'intro
    envoi.js     logique d'envoi, modes drip et campagne
    abonnes.js   lecture de la liste Brevo, signatures, désinscription
wrangler.jsonc   configuration du Worker et du cron
```

Tout passe par un seul Worker : les fichiers statiques par le binding `ASSETS`, les routes `/api/...` par le code, et l'envoi quotidien par le cron déclaré dans `wrangler.jsonc`. Aucun service externe.

## Déploiement

**1. Le dépôt.** Pousse ce dossier sur GitHub, en gardant l'arborescence ci-dessus.

**2. Le projet Cloudflare.** dash.cloudflare.com → *Workers & Pages* → *Create* → *Import a repository*. Choisis le dépôt. Cloudflare lit `wrangler.jsonc` et configure tout seul le dossier statique et le cron.

**3. Les variables.** Projet → *Settings* → *Variables and secrets*. En type *Secret* pour les clés, *Text* pour le reste :

| Variable | Valeur |
|---|---|
| `BREVO_API_KEY` | ta clé Brevo |
| `BREVO_LIST_ID` | l'identifiant de ta liste |
| `SENDER_EMAIL` | l'adresse validée dans Brevo |
| `SENDER_NAME` | le nom d'expéditeur affiché |
| `SITE_URL` | l'URL finale, sans slash final |
| `TEST_TOKEN` | un mot de passe pour l'envoi de test |
| `UNSUB_SECRET` | un second, qui signe les liens de désinscription |
| `CRON_SECRET` | un troisième, pour le déclenchement manuel |
| `MODE_ENVOI` | `drip` ou `campagne` |

Redéploie après ajout, sinon le code en ligne ne les voit pas.

`UNSUB_SECRET` ne doit plus changer une fois des emails envoyés : les liens de désinscription déjà distribués cesseraient de fonctionner.

**4. Le domaine.** Projet → *Domains* → ajoute ton sous-domaine. **Fais cette étape avant de toucher au DNS**, sinon le domaine renvoie une erreur 522. Ensuite seulement, chez ton hébergeur DNS, fais pointer le sous-domaine en CNAME vers l'adresse `.workers.dev` du projet. Tes enregistrements Brevo ne bougent pas.

**5. Vérifie le cron.** Projet → *Settings* → *Trigger events*. La ligne `0 10 * * *` doit y figurer. Elle vient de `wrangler.jsonc`, il n'y a rien à saisir à la main.

## Tester

```
https://ton-site/api/envoi-test?cle=TON_TEST_TOKEN
```

Ajoute `&email=toi@domaine.fr` pour n'envoyer qu'à toi. Les logs sont dans l'onglet *Observability*.

Pour déclencher l'envoi complet à la main, `/api/envoi-quotidien?cle=TON_CRON_SECRET`.

## Les deux modes d'envoi

**`drip`, le mode par défaut.** Chaque abonné reçoit la fiche 001 le lendemain de son inscription, puis la 002, jusqu'à la trentième. Chacun suit la progression dans l'ordre quelle que soit sa date d'arrivée. Envoi individuel par l'API transactionnelle, avec en-tête `List-Unsubscribe` pour la désinscription en un clic.

**`campagne`.** Tout le monde reçoit la même fiche le même jour, choisie par la date.

Le plafond gratuit de Brevo, 300 emails par jour, correspond en mode drip à 300 abonnés actifs.

## Modifier le contenu

Les fiches sont dans `public/fiches.json`. Une fiche est un objet avec `id`, `niveau` (`Découverte`, `Fondamental` ou `Avancé`), `tampon` (14 caractères maximum), `titre`, `principe`, `exemple`, `erreur`, `limite`, `references`.

Les textes de l'email sont dans le bloc `VOIX`, en haut de `src/lib/email.js` : ton mot d'intro et ses variantes, la signature, le post-scriptum, le bloc de partage, l'emoji de l'objet. L'interrupteur `sobre` bascule entre la version graphique et une version texte, plus discrète pour les filtres de messagerie.

## Points de vigilance

**Les chiffres vieillissent.** Les fiches sont à jour au 30 juillet 2026, sur la base de la loi de finances pour 2026 et de la LFSS 2026. Les plus fragiles sont la taxe de 20 % sur les actifs non affectés (fiche 29), l'apport-cession (26), le Dutreil (27) et le calendrier de la facture électronique (10).

**L'heure.** Le cron est en UTC : `0 10 * * *` donne midi à Paris en été, 11 h en hiver. Pour un midi exact toute l'année, déclare `"0 10,11 * * *"` et sors de la fonction `scheduled` quand l'heure de Paris n'est pas 12.

**Un seul envoi par jour.** Si un autre hébergement du même projet tourne encore ailleurs, coupe-le ou retire sa clé Brevo, sinon les abonnés reçoivent deux emails.
