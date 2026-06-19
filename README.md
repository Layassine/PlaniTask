<div align="center">

# PlaniTask

### Application Web de Gestion du Planning Projet

[Java]
[Spring Boot]
[React]
[TypeScript]
[PostgreSQL]
[TailwindCSS]
</div>

---

## Aperçu du projet

**PlaniTask** est une application web complète de gestion du planning projet développée dans le cadre d'un **projet universitaire** (Sujet 4).

> **Contexte** : Projet académique réalisé par une équipe de 3 étudiants.  
> **Objectif** : Offrir une plateforme intuitive pour planifier, suivre et collaborer sur des projets, avec des outils visuels (Kanban, Gantt, tableaux de bord) et des exports de rapports.

---

## Fonctionnalités principales

| Fonctionnalité | Description |
|---|---|
| **Gestion des projets** | Création, édition, suppression avec suivi de l'avancement |
| **Gestion des tâches** | CRUD complet avec priorités, statuts, assignation et estimation du temps |
| **Vue Kanban** | Glisser-déposer des tâches entre colonnes (À faire → En cours → Terminé) |
| **Diagramme de Gantt** | Visualisation temporelle des tâches par projet |
| **Tableau de bord** | KPIs en temps réel (projets actifs, taux de complétion, charge d'équipe) |
| **Rapports PDF & Excel** | Export complet avec tâches, membres et indicateurs |
| **Gestion des équipes** | Rôles (Chef de projet, Admin, Membre, Observateur) par projet |
| **Notifications** | Alertes sur les assignations, retards et changements de statut |
| **Calendrier** | Vue calendrier des deadlines et jalons |
| **Profil utilisateur** | Statistiques personnelles de productivité |

---

## Stack technique

### Frontend
- **React 18** — Interface utilisateur réactive
- **TypeScript 5** — Typage statique
- **Tailwind CSS 3** — Styles utilitaires
- **shadcn/ui** — Composants UI modernes
- **Axios** — Client HTTP avec intercepteurs JWT
- **Recharts** — Graphiques et visualisations
- **Vite** — Bundler ultra-rapide

### Backend
- **Java 21** — Langage principal
- **Spring Boot 3.2** — Framework applicatif
- **Spring Security 6** — Authentification et autorisation
- **Spring Data JPA / Hibernate** — ORM
- **JWT (jjwt 0.11.5)** — Tokens d'authentification stateless

### Base de données
- **PostgreSQL 18** — Base de données relationnelle

### Export
- **OpenPDF 1.3.30** — Génération de rapports PDF
- **Apache POI 5.2.4** — Génération de fichiers Excel (.xlsx)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   NAVIGATEUR WEB                    │
│              React 18 + TypeScript                  │
│         (Vite dev server — port 3000)               │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP/REST + JWT
                       ▼
┌─────────────────────────────────────────────────────┐
│                SPRING BOOT BACKEND                  │
│              REST API — port 8080                   │
│      Controllers → Services → Repositories          │
│         Spring Security (JWT stateless)             │
└──────────────────────┬──────────────────────────────┘
                       │ JPA / Hibernate
                       ▼
┌─────────────────────────────────────────────────────┐
│               POSTGRESQL 18                         │
│           Base de données relationnelle             │
│                  port 5432                          │
└─────────────────────────────────────────────────────┘
```

### Structure des dossiers

```
planitask/
├── backend/                          # Spring Boot
│   └── src/main/java/com/planitask/
│       ├── config/                   # SecurityConfig, JwtConfig, GlobalExceptionHandler
│       ├── controller/               # REST Controllers (9)
│       ├── dto/                      # Request & Response DTOs
│       ├── entity/                   # Entités JPA (8)
│       ├── enums/                    # Enumerations (6)
│       ├── repository/               # Spring Data Repositories (7)
│       ├── security/                 # JwtUtil, JwtFilter
│       └── service/                  # Logique métier (6)
│
└── frontend/                         # React + Vite
    └── src/app/
        ├── api/                      # Clients Axios (axiosConfig, tacheApi, membreApi…)
        ├── context/                  # AuthContext, ProjetContext
        ├── pages/                    # Pages (Dashboard, Projects, Tasks, Kanban…)
        └── components/               # Composants réutilisables
```

---

## ⚙️ Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :

- **Java 21+** — [Télécharger](https://adoptium.net/)
- **Node.js 18+** — [Télécharger](https://nodejs.org/)
- **PostgreSQL 16+** — [Télécharger](https://www.postgresql.org/download/)
- **Maven 3.9+** — [Télécharger](https://maven.apache.org/download.cgi)

---

## Installation et lancement

### Étape 1 — Cloner le projet

```bash
git clone https://github.com/fadisafou196-source/Project-management-Plateform-Planitask.git
cd Project-management-Plateform-Planitask
```

### Étape 2 — Créer la base de données

Connectez-vous à PostgreSQL et exécutez :

```sql
CREATE DATABASE planitask;
```

> Les tables sont créées **automatiquement** au démarrage du backend via `schema.sql`.

### Étape 3 — Configurer application.properties

Le fichier se trouve dans `backend/src/main/resources/application.properties`.  
Vérifiez que les paramètres correspondent à votre installation :

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/planitask
spring.datasource.username=postgres
spring.datasource.password=postgres
```

### Étape 4 — Lancer le backend

```bash
cd backend
mvn spring-boot:run
```

> Le backend démarre sur **http://localhost:8080** en quelques secondes.

### Étape 5 — Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

> Le frontend démarre sur **http://localhost:3000**.

### Étape 6 — Accéder à l'application

Ouvrez votre navigateur :

```
http://localhost:3000
```

Créez un compte via la page d'inscription, puis connectez-vous.

---

## Configuration

### application.properties expliqué

```properties
# ── Base de données ──────────────────────────────────────
spring.datasource.url=jdbc:postgresql://localhost:5432/planitask
spring.datasource.username=postgres
spring.datasource.password=postgres

# ── Initialisation automatique du schéma ────────────────
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:db/schema.sql

# ── JPA / Hibernate ──────────────────────────────────────
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=false

# ── JWT ──────────────────────────────────────────────────
jwt.secret=votre-cle-secrete-tres-longue-minimum-256-bits
jwt.expiration=86400000
```

### Variables importantes

| Variable | Valeur par défaut | Description |
|---|---|---|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/planitask` | URL de la base de données |
| `spring.datasource.username` | `postgres` | Utilisateur PostgreSQL |
| `spring.datasource.password` | `postgres` | Mot de passe PostgreSQL |
| `jwt.expiration` | `86400000` | Durée du token JWT (24h en ms) |

---

## Utilisation

### 1. Créer un compte
Accédez à `/register`, renseignez votre prénom, nom, email et mot de passe (minimum 6 caractères).

### 2. Créer un projet
Depuis la page **Projets**, cliquez sur **Nouveau projet**. Vous êtes automatiquement désigné **Chef de projet**.

### 3. Ajouter des membres
Dans **Équipe**, sélectionnez votre projet et ajoutez des utilisateurs avec leur rôle (Admin, Membre, Observateur).

### 4. Gérer les tâches
Dans **Tâches** ou la vue **Kanban**, créez des tâches, assignez-les à des membres et suivez leur progression par glisser-déposer.

### 5. Exporter les rapports
Dans **Rapports**, sélectionnez un projet et cliquez sur **Export PDF** ou **Export Excel** pour télécharger un rapport complet.

---

## Structure complète du projet

```
planitask/
├── README.md
├── CLAUDE.md
│
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/planitask/
│       │   │   ├── PlaniTaskApplication.java
│       │   │   ├── config/
│       │   │   │   ├── GlobalExceptionHandler.java
│       │   │   │   ├── JwtConfig.java
│       │   │   │   └── SecurityConfig.java
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java
│       │   │   │   ├── DashboardController.java
│       │   │   │   ├── JalonController.java
│       │   │   │   ├── MembreController.java
│       │   │   │   ├── NotificationController.java
│       │   │   │   ├── ProjetController.java
│       │   │   │   ├── RapportController.java
│       │   │   │   ├── TacheController.java
│       │   │   │   └── UtilisateurController.java
│       │   │   ├── dto/
│       │   │   │   ├── request/
│       │   │   │   └── response/
│       │   │   ├── entity/
│       │   │   │   ├── Utilisateur.java
│       │   │   │   ├── Projet.java
│       │   │   │   ├── Tache.java
│       │   │   │   ├── MembreProjet.java
│       │   │   │   ├── Jalon.java
│       │   │   │   ├── Notification.java
│       │   │   │   ├── Rapport.java
│       │   │   │   └── Fichier.java
│       │   │   ├── enums/
│       │   │   │   ├── RoleProjet.java
│       │   │   │   ├── StatutProjet.java
│       │   │   │   ├── StatutTache.java
│       │   │   │   ├── Priorite.java
│       │   │   │   ├── FormatRapport.java
│       │   │   │   └── TypeNotification.java
│       │   │   ├── repository/
│       │   │   │   ├── UtilisateurRepository.java
│       │   │   │   ├── ProjetRepository.java
│       │   │   │   ├── TacheRepository.java
│       │   │   │   ├── MembreProjetRepository.java
│       │   │   │   ├── JalonRepository.java
│       │   │   │   ├── NotificationRepository.java
│       │   │   │   └── RapportRepository.java
│       │   │   ├── security/
│       │   │   │   ├── JwtFilter.java
│       │   │   │   └── JwtUtil.java
│       │   │   └── service/
│       │   │       ├── AuthService.java
│       │   │       ├── ProjetService.java
│       │   │       ├── TacheService.java
│       │   │       ├── MembreService.java
│       │   │       ├── NotificationService.java
│       │   │       └── RapportService.java
│       │   └── resources/
│       │       ├── application.properties
│       │       └── db/schema.sql
│       └── test/
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        └── app/
            ├── api/
            │   ├── axiosConfig.ts
            │   ├── tacheApi.ts
            │   └── membreApi.ts
            ├── context/
            │   ├── AuthContext.tsx
            │   └── ProjetContext.tsx
            ├── pages/
            │   ├── LoginPage.tsx
            │   ├── SignUpPage.tsx
            │   ├── ForgotPasswordPage.tsx
            │   ├── Dashboard.tsx
            │   ├── Projects.tsx
            │   ├── ProjectDetails.tsx
            │   ├── Tasks.tsx
            │   ├── Kanban.tsx
            │   ├── Gantt.tsx
            │   ├── Calendar.tsx
            │   ├── Team.tsx
            │   ├── Reports.tsx
            │   ├── Notifications.tsx
            │   ├── Settings.tsx
            │   └── UserProfile.tsx
            └── routes.tsx
```

---

## API Documentation

### Authentification

| Méthode | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter (retourne un JWT) |
| `POST` | `/api/auth/forgot-password` | Réinitialiser le mot de passe |

### Projets

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projets` | Lister mes projets |
| `POST` | `/api/projets` | Créer un projet |
| `GET` | `/api/projets/{id}` | Détails d'un projet |
| `PATCH` | `/api/projets/{id}` | Modifier un projet |
| `DELETE` | `/api/projets/{id}` | Supprimer un projet |

### Membres

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projets/{id}/membres` | Membres d'un projet |
| `POST` | `/api/projets/{id}/membres` | Ajouter un membre |
| `DELETE` | `/api/projets/{id}/membres/{userId}` | Retirer un membre |

### Tâches

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/taches/mes-taches` | Mes tâches assignées |
| `GET` | `/api/taches/projet/{id}` | Tâches d'un projet |
| `POST` | `/api/taches` | Créer une tâche |
| `PATCH` | `/api/taches/{id}` | Modifier une tâche |
| `DELETE` | `/api/taches/{id}` | Supprimer une tâche |

### Dashboard & Rapports

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | KPIs du tableau de bord |
| `GET` | `/api/rapports/export/pdf?projetId={id}` | Exporter un rapport PDF |
| `GET` | `/api/rapports/export/excel?projetId={id}` | Exporter un rapport Excel |

### Notifications

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Mes notifications |
| `PATCH` | `/api/notifications/{id}/lire` | Marquer comme lue |
| `DELETE` | `/api/notifications/{id}` | Supprimer une notification |

### Utilisateurs

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/utilisateurs/me` | Mon profil avec statistiques |
| `GET` | `/api/utilisateurs/{id}` | Profil d'un utilisateur |
| `PUT` | `/api/utilisateurs/me` | Modifier mon profil |
| `PUT` | `/api/utilisateurs/me/password` | Changer mon mot de passe |

> Tous les endpoints (sauf `/api/auth/*`) nécessitent un header `Authorization: Bearer <token>`.

---

## Captures d'écran

> *Section réservée — Les captures d'écran seront ajoutées prochainement.*

| Page | Description |
|---|---|
| Dashboard | Tableau de bord avec KPIs et activité récente |
| Projets | Vue grille et liste des projets avec filtres |
| Kanban | Vue Kanban avec colonnes de statut |
| Gantt | Diagramme de Gantt interactif |
| Rapports | Graphiques et export PDF/Excel |
| Équipe | Gestion des membres et charge de travail |

---

## Contributeurs

<table>
  <tr>
    <td align="center">
      <b>Membre 1</b><br/>
      <sub>LAMIASSER Ahmed Yassine</sub>
    </td>
    <td align="center">
      <b>Membre 2</b><br/>
      <sub>SAFOU Fadi</sub>
    </td>
    <td align="center">
      <b>Membre 3</b><br/>
      <sub>AOURIK Hamza</sub>
    </td>
  </tr>
</table>

> Projet Logiciel— Sujet 4

---

<div align="center">



**[⬆ Retour en haut](#-planitask)**

</div>