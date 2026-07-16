# 💎 Palace Gestion — Bot Discord

Bot Discord pour la gestion de panel premium avec système de tickets.

## Fonctionnalités

- **`/panel`** — Créer un panel premium personnalisable dans n'importe quel salon
- **`/setup`** — Configurer le bot (rôle premium, catégorie tickets, message de refus)
- **Bouton "Payer le premium 💎"** — Ouvre un ticket privé entre l'utilisateur et l'owner
- **Ticket Accept/Refuse** — Attribution automatique du rôle ou mute 24h + MP

## Installation

### 1. Prérequis
- [Node.js](https://nodejs.org) v18+
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Permissions du bot (Discord Developer Portal)
Active ces options :
- **Bot** → `SERVER MEMBERS INTENT` ✅
- **Bot** → `MESSAGE CONTENT INTENT` ✅

Permissions OAuth2 à cocher lors de l'invitation :
- `Manage Roles`, `Manage Channels`, `Moderate Members`
- `Send Messages`, `Read Messages`, `View Channel`
- `Send Messages in Threads`, `Read Message History`

### 3. Cloner et installer
```bash
git clone https://github.com/pailillomathyss-prog/palace-gestion
cd palace-gestion/bot
npm install
```

### 4. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Remplis le fichier `.env` :
```
DISCORD_TOKEN=ton_token_ici
DISCORD_CLIENT_ID=ton_client_id_ici
GUILD_ID=ton_guild_id_ici   # (optionnel mais recommandé pour test rapide)
```

### 5. Déployer les commandes slash
```bash
node deploy-commands.js
```

### 6. Lancer le bot
```bash
node index.js
```

---

## Utilisation

### Configuration initiale (owner uniquement)

```
/setup role_premium role:@Premium       → Définit le rôle attribué si ticket accepté
/setup salon_tickets categorie:#🎫Tickets → Définit la catégorie pour les tickets
/setup message_refus message:Ta demande a été refusée. → Personnalise le MP de refus
/setup voir                              → Affiche la config actuelle
```

### Créer/customiser le panel

```
/panel
/panel titre:💎 PREMIUM 1€ SEULEMENT description:Accède au contenu exclusif ! couleur:#FFD700
/panel image:https://ton-image.com/preview.png label_bouton:Payer 1€ 💎
```

### Flux ticket

1. Un membre clique sur **Payer le premium 💎**
2. Un salon privé `#ticket-pseudo` est créé (visible uniquement par le membre + owner)
3. L'owner voit deux boutons : **Accepter ✅** ou **Refuser ❌**
4. **Si accepté** → le rôle premium est attribué + MP de confirmation
5. **Si refusé** → mute 24h + MP de refus + ticket supprimé dans 5s

---

## Structure du projet

```
bot/
├── commands/
│   ├── panel.js          # Commande /panel
│   └── setup.js          # Commande /setup
├── events/
│   ├── ready.js          # Événement prêt
│   └── interactionCreate.js  # Gestion boutons & commandes
├── config.js             # Stockage config par serveur
├── deploy-commands.js    # Script déploiement des slash commands
├── index.js              # Point d'entrée du bot
└── .env.example          # Template variables d'environnement
```
