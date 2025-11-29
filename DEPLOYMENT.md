# 🚀 NoteMind AI - Deployment Guide

## Sistema di Auto-Migrazioni

Il sistema esegue **automaticamente** tutte le migrazioni mancanti all'avvio del server.

### Come Funziona

1. All'avvio, il server controlla quali migrazioni sono già state applicate
2. Esegue automaticamente quelle mancanti in ordine
3. Traccia le migrazioni applicate nella tabella `migration_history`
4. Il server parte anche se alcune migrazioni falliscono (con warning)

### Struttura Migrazioni

```
backend/migrations/
├── 001_add_multi_document_conversations.py
├── 002_add_folders_support.py
├── 003_add_quiz_results.py
├── 004_add_user_language.py
├── 005_add_mermaid_schema.py
├── 006_add_file_content_to_documents.py
├── 007_add_user_theme.py              ← NUOVA
└── 008_add_quiz_templates.py          ← NUOVA
```

### Output Esempio

```
🚀 Starting NoteMind AI Backend...
📊 Initializing database...
🔄 Checking for database migrations...

============================================================
🗃️  DATABASE MIGRATION CHECK
============================================================
📋 Found 2 pending migration(s):

   - 007_add_user_theme.py
   - 008_add_quiz_templates.py

🚀 Starting migration process...

  🔄 Running migration: 007_add_user_theme.py
  Adding theme column...
  Column added successfully!
  Migration completed successfully!
  ✅ Migration 007_add_user_theme.py completed successfully

  🔄 Running migration: 008_add_quiz_templates.py
  Creating quiz_templates table...
  Table created successfully!
  Migration completed successfully!
  ✅ Migration 008_add_quiz_templates.py completed successfully

✅ Successfully applied 2/2 migration(s)
============================================================

✅ Server startup complete!
```

---

## 🐳 Deployment con Docker

### 1. Development (con Docker Compose)

```bash
# Build e avvia tutti i servizi
docker-compose up --build

# Avvia in background
docker-compose up -d

# Visualizza logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Ferma i servizi
docker-compose down
```

### 2. Production (solo Backend)

```bash
# Build immagine
cd backend
docker build -t notemind-backend .

# Run container
docker run -d \
  --name notemind-backend \
  -p 8000:8000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  -e GEMINI_API_KEY=your_api_key \
  -e SECRET_KEY=your_secret_key \
  notemind-backend
```

### 3. Variabili d'Ambiente

Crea un file `.env` nella root del progetto:

```env
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Security
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Database
DATABASE_URL=sqlite:///./data/notemind.db

# CORS
FRONTEND_URL=http://localhost:3000

# Uploads
UPLOAD_DIR=/app/uploads
MAX_UPLOAD_SIZE=10485760
```

---

## 🔧 Deployment Manuale (senza Docker)

### Backend

```bash
cd backend

# 1. Installa dipendenze
pip install -r requirements.txt

# 2. Configura variabili d'ambiente
export GEMINI_API_KEY=your_key
export SECRET_KEY=your_secret

# 3. Avvia server (le migrazioni partono automaticamente!)
python main.py

# Oppure con uvicorn direttamente
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd web

# 1. Installa dipendenze
npm install

# 2. Build per produzione
npm run build

# 3. Avvia server produzione
npm start

# Oppure con PM2
pm2 start npm --name "notemind-frontend" -- start
```

---

## 📊 Verificare le Migrazioni

### Controllare migrazioni applicate

```sql
-- Connettiti al database
sqlite3 backend/data/notemind.db

-- Lista migrazioni applicate
SELECT * FROM migration_history ORDER BY applied_at;
```

Output:
```
id|migration_name|applied_at
1|001_add_multi_document_conversations|2025-01-15 10:30:00
2|002_add_folders_support|2025-01-15 10:30:01
...
7|007_add_user_theme|2025-01-16 14:22:05
8|008_add_quiz_templates|2025-01-16 14:22:06
```

### Eseguire manualmente una migration

```bash
cd backend
python migrations/007_add_user_theme.py

# Rollback (se supportato)
python migrations/007_add_user_theme.py --rollback
```

---

## 🆕 Nuove Funzionalità in questa Release

### ✅ Rate Limiting
- Protezione contro abuse API
- Limiti specifici per endpoint (login, chat, quiz, upload)

### ✅ Tema Scuro/Chiaro
- Toggle tema nell'header dashboard
- Sincronizzazione preferenza con backend
- Supporto tema automatico (system)

### ✅ Ricerca Full-Text Documenti
- Endpoint `/api/documents/search?q=termine`
- Ricerca in filename e summary

### ✅ Template Quiz
- API CRUD completa `/api/quiz-templates`
- Salvataggio configurazioni quiz preferite

### ✅ Generazione Podcast (Preview)
- Endpoint `/api/documents/{id}/podcast`
- Script conversazionale a 2 voci
- Pronto per Gemini 2.5 TTS

---

## 🔄 Aggiornamento da Versione Precedente

```bash
# 1. Pull ultime modifiche
git pull origin main

# 2. Aggiorna dipendenze backend
cd backend
pip install -r requirements.txt

# 3. Aggiorna dipendenze frontend
cd ../web
npm install

# 4. Restart servizi (le migrazioni partono automaticamente!)
docker-compose restart

# Oppure manualmente:
# - Restart backend → migrazioni eseguite automaticamente
# - Restart frontend
```

**IMPORTANTE**: Le migrazioni vengono eseguite **automaticamente** all'avvio del backend. Non serve fare nulla manualmente!

---

## 🐛 Troubleshooting

### Problema: Migrazioni falliscono

```bash
# 1. Controlla logs
docker-compose logs backend

# 2. Verifica database
sqlite3 backend/data/notemind.db ".tables"

# 3. Esegui migration manualmente
cd backend
python migrations/007_add_user_theme.py
```

### Problema: Server non parte

```bash
# Controlla che GEMINI_API_KEY sia configurata
echo $GEMINI_API_KEY

# Controlla porte in uso
lsof -i :8000
lsof -i :3000

# Rimuovi container e ricrea
docker-compose down
docker-compose up --build
```

---

## 📝 Note Importanti

1. **Le migrazioni sono idempotenti**: Puoi eseguirle più volte senza problemi
2. **Tracking automatico**: Il sistema sa quali migrazioni sono già state applicate
3. **Zero downtime**: Il server parte anche se alcune migrazioni falliscono
4. **Logs dettagliati**: Ogni migrazione logga il suo stato (success/fail)

---

## 🎯 Checklist Pre-Deployment

- [ ] Configurate variabili d'ambiente (`.env`)
- [ ] GEMINI_API_KEY valida
- [ ] SECRET_KEY cambiata (min 32 caratteri)
- [ ] Database backup (se production)
- [ ] Dipendenze aggiornate (`pip install -r requirements.txt`)
- [ ] Build frontend (`npm run build`)
- [ ] Test endpoint `/health` funziona
- [ ] Verifica migrazioni applicate correttamente

Fatto! 🚀
