# 🚀 Nova Auth Implementation Plan

**Ziel:** Zentrale Auth (E-Mail/Passwort + 2FA) für alle Nova-Apps mit **einer PostgreSQL-DB** und **getrennten Schemas pro Service**.  
**Aktuelle Basis:** `nova-template` (Fastify API + Vue Dashboard + Prisma/SQLite).

---

---

## 📌 **Kernanforderungen**

- **Eine PostgreSQL-DB** für alle Apps mit **getrennten Schemas** (`public`, `code`, `task`, `budget`, `tab`).
- **Zentrale User-Auth** im `public`-Schema (E-Mail/Passwort + 2FA).
- **Jede App läuft in ihrem eigenen Container**, greift aber auf dieselbe DB zu.
- **Nutzer registrieren sich einmal** und können alle Apps nutzen.
- **NextAuth.js** für Auth + 2FA (mit `next-auth-2fa`).

---

---

## 🔍 **Aktueller Stand des Repos**

### **API (`/api`)**

- **Tech-Stack:** Fastify + Prisma (SQLite) + manuelles JWT (`jsonwebtoken`/`bcrypt`).
- **Aktuelle Auth-Routen:** `/api/auth/register`, `/api/auth/login`, `/api/auth/validate`, `/api/auth/password`.
- **Datenbank:** SQLite mit Modellen: `User`, `ApiKey`, `UserSettings`, `AppSettings`.

### **Dashboard (`/dashboard`)**

- **Tech-Stack:** Vue 3 + Pinia + Axios.
- **Auth-Integration:** Login/Registrierung über API-Routen, JWT im `localStorage`.

### **Docker**

- Separate Container für API und Dashboard, **SQLite-DB im Volume**.

---

---

## 🎯 **Zielarchitektur**

```
Datenbank (PostgreSQL):
├── Schema: public   # User, Session, Account (NextAuth.js)
├── Schema: code     # CodeProject, etc.
├── Schema: task     # TaskList, etc.
├── Schema: budget   # BudgetEntry, etc.
└── Schema: tab      # TabConfig, etc.

Apps (jeweils eigene Container):
├── code.runnova.dev
├── task.runnova.dev
├── budget.runnova.dev
└── tab.runnova.dev
```

---

---

## 📋 **Implementierungsplan**

---

### **🔹 Phase 1: Datenbank & Prisma-Schema**

#### **1.1. Prisma-Schema für PostgreSQL + Multi-Schema**

**Datei:** `/api/prisma/schema.prisma`

- **Datenbank-Konfiguration:**
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    schemas  = ["public", "code", "task", "budget", "tab"]
  }
  generator client {
    provider = "prisma-client-js"
    previewFeatures = ["multiSchema"]
  }
  ```
- `**public`-Schema (nur Auth + Shared Settings):**
  ```prisma
  // User: Zentrale Auth
  model User {
    id                String    @id @default(cuid())
    email             String    @unique
    username          String    @unique
    password          String?   // Gehashtes Passwort (bcrypt)
    name              String?
    emailVerified     DateTime?
    isAdmin           Boolean   @default(false)
    createdAt         DateTime  @default(now())
    updatedAt         DateTime  @updatedAt

    // 2FA
    twoFactorSecret   String?
    twoFactorEnabled  Boolean  @default(false)
    backupCodes       String[]

    // Einstellungen
    language          String    @default("en")
    autoTheme         Boolean   @default(true)
    darkTheme         String?
    lightTheme        String?
    aiFeaturesDisabled Boolean  @default(false)
    avatarUrl         String?

    // NextAuth.js Relationen (erforderlich für Prisma-Adapter)
    accounts          Account[]
    sessions          Session[]
  }

  // Account & Session: ERFORDERLICH für NextAuth.js Prisma-Adapter!
  // Auch wenn nur E-Mail/Passwort genutzt wird, braucht NextAuth.js diese Tabellen
  // für Session-Management und zukünftige OAuth-Provider.
  model Account {
    id                 String  @id @default(cuid())
    userId             String
    type               String
    provider           String
    providerAccountId  String
    refresh_token      String? @db.Text
    access_token       String? @db.Text
    expires_at         Int?
    token_type         String?
    scope              String?
    id_token           String? @db.Text
    session_state      String?
    user               User    @relation(fields: [userId], references: [id])

    @@unique([provider, providerAccountId])
    @@map("public")
  }

  model Session {
    id            String   @id
    sessionToken String   @unique
    userId        String
    expires       DateTime
    user          User     @relation(fields: [userId], references: [id])

    @@map("public")
  }
  ```
- **Service-Schemas (Beispiele):**
  ```prisma
  // Code-Schema (nova-code)
  model CodeProject @@map("code") {
    id       String   @id @default(cuid())
    name     String
    userId   String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    // ... weitere Felder
  }

  // Task-Schema (nova-task)
  model TaskList @@map("task") {
    id       String   @id @default(cuid())
    title    String
    userId   String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    // ... weitere Felder
  }
  ```
  > **Wichtig:** Keine Relationen zwischen `User` und Service-Modellen im `public`-Schema! Die `userId`-Felder in den Service-Modellen verweisen auf `User.id`, aber die Relationen werden **nicht im User-Modell definiert**.

---

#### **1.2. Migration zu PostgreSQL**

1. **Docker-Compose anpassen** (`docker-compose.yml`):
  ```yaml
   services:
     db:
       image: postgres:14
       environment:
         POSTGRES_DB: runnova
         POSTGRES_USER: user
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U user -d runnova"]
         interval: 5s
         timeout: 5s
         retries: 5

     api:
       build: ./api
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: "postgresql://user:password@db:5432/runnova?schema=public,code,task,budget,tab"
         NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
         NEXTAUTH_URL: "http://localhost:3000"
       depends_on:
         db:
           condition: service_healthy
   volumes:
     postgres_data:
  ```
2. **Prisma Migration ausführen:**
  ```bash
   cd api
   npx prisma migrate dev --name init_postgresql
  ```

---

---

### **🔹 Phase 2: Auth-Logik (NextAuth.js + 2FA)**

**Ziel:** Ersetze manuelles JWT durch **NextAuth.js** mit E-Mail/Passwort + 2FA.

#### **2.1. Abhängigkeiten installieren**

```bash
cd api
npm install next-auth @next-auth/prisma-adapter bcryptjs next-auth-2fa otplib qrcode
```

#### **2.2. NextAuth.js konfigurieren**

- **Datei:** `/api/src/routes/auth.ts`
  - **Inhalte:**
    - NextAuth.js-Handler mit `CredentialsProvider` (E-Mail/Passwort).
    - Integration von `next-auth-2fa` für TOTP.
    - Prisma-Adapter für `User`, `Account`, `Session`.

#### **2.3. 2FA-Routen hinzufügen**

- **Datei:** `/api/src/routes/2fa.ts`
  - **Inhalte:**
    - `/api/auth/2fa/enable` – 2FA aktivieren (TOTP-Secret generieren).
    - `/api/auth/2fa/verify` – 2FA-Code verifizieren.
    - `/api/auth/2fa/disable` – 2FA deaktivieren.

---

---

### **🔹 Phase 3: Dashboard-Anpassungen**

#### **3.1. Login/Registrierung aktualisieren**

- **Datei:** `/dashboard/src/views/Login.vue`
  - E-Mail/Passwort-Formular.
  - 2FA-Eingabe nach Login (falls aktiviert).

#### **3.2. 2FA-Einrichtungsseite**

- **Datei:** `/dashboard/src/views/Settings2FA.vue`
  - QR-Code für TOTP anzeigen.
  - Backup-Codes generieren/anzeigen.

---

---

### **🔹 Phase 4: Docker & Deployment**

- **Dockerfiles** für API und Dashboard anpassen (PostgreSQL-Unterstützung).
- **Umgebungsvariablen** in `.env.example` aktualisieren:
  - `DATABASE_URL` für PostgreSQL.
  - `NEXTAUTH_SECRET` für NextAuth.js.
  - `NEXTAUTH_URL` für Callback-URLs.