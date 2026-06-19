-- PlaniTask — Schéma PostgreSQL
-- Idempotent : utilise CREATE TABLE IF NOT EXISTS

CREATE TABLE IF NOT EXISTS utilisateurs (
    id            BIGSERIAL PRIMARY KEY,
    nom           VARCHAR(100)  NOT NULL,
    prenom        VARCHAR(100)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255)  NOT NULL,
    avatar        VARCHAR(500),
    date_creation TIMESTAMP     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projets (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(255) NOT NULL,
    description     TEXT,
    date_debut      DATE,
    date_fin        DATE,
    statut          VARCHAR(50)  NOT NULL DEFAULT 'EN_COURS',
    avancement      DOUBLE PRECISION      DEFAULT 0.0,
    couleur         VARCHAR(20),
    proprietaire_id BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    date_creation   TIMESTAMP             DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membres_projet (
    id              BIGSERIAL PRIMARY KEY,
    utilisateur_id  BIGINT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    projet_id       BIGINT NOT NULL REFERENCES projets(id)      ON DELETE CASCADE,
    role            VARCHAR(50) NOT NULL DEFAULT 'MEMBRE',
    date_ajout      TIMESTAMP           DEFAULT NOW(),
    CONSTRAINT uq_membre_projet UNIQUE (utilisateur_id, projet_id)
);

CREATE TABLE IF NOT EXISTS taches (
    id             BIGSERIAL PRIMARY KEY,
    titre          VARCHAR(255) NOT NULL,
    description    TEXT,
    projet_id      BIGINT       NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    assignee_id    BIGINT       REFERENCES utilisateurs(id) ON DELETE SET NULL,
    statut         VARCHAR(50)  NOT NULL DEFAULT 'A_FAIRE',
    priorite       VARCHAR(50)  NOT NULL DEFAULT 'MOYENNE',
    date_debut     DATE,
    date_fin       DATE,
    progression    INTEGER      NOT NULL DEFAULT 0,
    temps_estime   DOUBLE PRECISION      DEFAULT 0.0,
    temps_reel     DOUBLE PRECISION      DEFAULT 0.0,
    date_creation  TIMESTAMP             DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jalons (
    id             BIGSERIAL PRIMARY KEY,
    nom            VARCHAR(255) NOT NULL,
    description    TEXT,
    projet_id      BIGINT       NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    date_echeance  DATE,
    atteint        BOOLEAN      NOT NULL DEFAULT FALSE,
    date_creation  TIMESTAMP             DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers (
    id             BIGSERIAL PRIMARY KEY,
    nom            VARCHAR(255) NOT NULL,
    chemin         VARCHAR(500),
    taille         BIGINT,
    type           VARCHAR(100),
    uploadeur_id   BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    tache_id       BIGINT REFERENCES taches(id)       ON DELETE SET NULL,
    projet_id      BIGINT REFERENCES projets(id)      ON DELETE CASCADE,
    date_upload    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id             BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT   NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    message        TEXT     NOT NULL,
    type           VARCHAR(100),
    lue            BOOLEAN  NOT NULL DEFAULT FALSE,
    projet_id      BIGINT,
    tache_id       BIGINT,
    date_creation  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rapports (
    id              BIGSERIAL PRIMARY KEY,
    nom             VARCHAR(255) NOT NULL,
    projet_id       BIGINT       NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    format          VARCHAR(50)  NOT NULL DEFAULT 'HTML',
    contenu         TEXT,
    genere_par_id   BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    date_generation TIMESTAMP DEFAULT NOW()
);

-- Colonnes supplémentaires utilisateurs (idempotent)
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS poste VARCHAR(200);
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS bio TEXT;

-- Tokens de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    token      VARCHAR(255) NOT NULL UNIQUE,
    email      VARCHAR(255) NOT NULL,
    expiration TIMESTAMP    NOT NULL,
    utilise    BOOLEAN      NOT NULL DEFAULT FALSE
);

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_taches_projet    ON taches(projet_id);
CREATE INDEX IF NOT EXISTS idx_taches_assignee  ON taches(assignee_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user      ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_membres_projet   ON membres_projet(projet_id);
CREATE INDEX IF NOT EXISTS idx_membres_user     ON membres_projet(utilisateur_id);
