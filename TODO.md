# NoteMind-AI - Piano di Sviluppo Nuove Funzionalità

## Obiettivo
Implementare 5 nuove funzionalità principali per NoteMind-AI, mantenendo coerenza con l'architettura esistente e supporto mobile responsive.

---

## 1️⃣ SUPPORT FOR MORE FILE FORMATS (Audio & Video)

### Analisi
- **Attuale**: Supporto per documenti (PDF, DOCX, TXT, MD, JSON), codice (PY, JS, TS), immagini (JPG, PNG, WEBP)
- **Obiettivo**: Aggiungere audio (MP3, WAV, M4A, OGG, FLAC) e video (MP4, AVI, MOV, WEBM, MKV)
- **Strategia**: Usare Gemini API per trascrizione audio/video (simile a OCR per immagini)

### Task Backend
- [ ] **1.1** Aggiornare `backend/app/core/config.py`
  - Aggiungere nuove estensioni: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac`, `.mp4`, `.avi`, `.mov`, `.webm`, `.mkv`
  - Aumentare `MAX_UPLOAD_SIZE` a 50MB per file multimediali

- [ ] **1.2** Creare `backend/app/services/media_service.py`
  - Implementare `transcribe_audio()` usando Gemini API
  - Implementare `transcribe_video()` usando Gemini API
  - Generare titolo automatico dal contenuto trascritto
  - Salvataggio trascrizione in formato Markdown

- [ ] **1.3** Aggiornare `backend/app/utils/file_handler.py`
  - Aggiungere metodi per validazione file multimediali
  - Aggiungere metodo `is_media_file()` per distinguere audio/video
  - Gestione metadati (durata, codec, etc.)

- [ ] **1.4** Modificare `backend/app/api/documents.py`
  - Estendere endpoint `/upload` per gestire audio/video
  - Processing pipeline: Upload → Trascrizione → Salva .md → Upload a Gemini
  - Gestione errori specifici per file multimediali

- [ ] **1.5** Aggiornare modello `Document`
  - Aggiungere campo `media_duration` (INTEGER, nullable)
  - Aggiungere campo `transcript_content` (TEXT, nullable)
  - Migrazione database

### Task Frontend
- [ ] **1.6** Aggiornare `web/components/FileUpload.tsx`
  - Accettare nuovi formati audio/video
  - Mostrare icona specifica per file multimediali
  - Validazione dimensione 50MB

- [ ] **1.7** Creare `web/components/MediaPlayer.tsx`
  - Player audio HTML5 per file audio
  - Player video HTML5 per file video
  - Controlli personalizzati (play, pause, timeline)
  - Design responsive per mobile

- [ ] **1.8** Aggiornare `web/app/document/[id]/page.tsx`
  - Rilevare tipo file multimediale
  - Mostrare MediaPlayer + trascrizione in parallelo
  - Layout a 2 colonne (desktop) / verticale (mobile)

### Test
- [ ] **1.9** Test upload file MP3 e verifica trascrizione
- [ ] **1.10** Test upload file MP4 e verifica trascrizione
- [ ] **1.11** Test chat su documento trascritto
- [ ] **1.12** Test responsive mobile

---

## 2️⃣ ADVANCED SEARCH AND FILTERS

### Analisi
- **Attuale**: Nessun sistema di ricerca implementato
- **Obiettivo**: Ricerca full-text su contenuto documenti, filtri avanzati
- **Strategia**: Implementare endpoint ricerca con SQLAlchemy LIKE/FTS

### Task Backend
- [ ] **2.1** Creare `backend/app/schemas/search.py`
  - Schema `SearchRequest` (query, filters, sort)
  - Schema `SearchResult` (documents, conversations, total)
  - Schema `SearchFilters` (file_type, date_range, folder_id)

- [ ] **2.2** Creare `backend/app/services/search_service.py`
  - Metodo `search_documents()` con full-text search
  - Metodo `search_conversations()` per ricerca messaggi
  - Applicazione filtri (tipo, data, folder)
  - Ordinamento risultati (relevance, date, name)
  - Highlighting dei match

- [ ] **2.3** Creare `backend/app/api/search.py`
  - Endpoint `POST /search/documents` per ricerca documenti
  - Endpoint `POST /search/conversations` per ricerca conversazioni
  - Endpoint `GET /search/suggestions` per autocompletamento
  - Paginazione risultati (limit, offset)

- [ ] **2.4** Aggiungere indici database
  - Indice full-text su `documents.original_filename`
  - Indice su `documents.file_type`
  - Indice su `messages.content`

### Task Frontend
- [ ] **2.5** Creare `web/components/SearchBar.tsx`
  - Input ricerca con icona lente
  - Debouncing 300ms per suggerimenti
  - Autocompletamento dropdown
  - Shortcut keyboard (Cmd/Ctrl + K)

- [ ] **2.6** Creare `web/components/SearchFilters.tsx`
  - Filtri tipo file (checkboxes)
  - Date range picker
  - Filtro folder (dropdown)
  - Ordinamento (relevance, date, name)
  - Design collapsible per mobile

- [ ] **2.7** Creare `web/app/search/page.tsx`
  - Pagina risultati ricerca
  - Lista documenti trovati con highlights
  - Lista conversazioni trovate
  - Paginazione infinita (scroll)
  - Layout responsive

- [ ] **2.8** Aggiornare `web/lib/api.ts`
  - Funzione `search.documents()`
  - Funzione `search.conversations()`
  - Funzione `search.suggestions()`

### Test
- [ ] **2.9** Test ricerca per nome file
- [ ] **2.10** Test ricerca per contenuto
- [ ] **2.11** Test filtri combinati
- [ ] **2.12** Test responsive mobile

---

## 3️⃣ EXPORT CONVERSATIONS

### Analisi
- **Attuale**: Sistema export già implementato per quiz (JSON, MD, PDF)
- **Obiettivo**: Export conversazioni in formati JSON, Markdown, PDF
- **Strategia**: Riusare pattern di `backend/app/api/quiz.py` per export

### Task Backend
- [ ] **3.1** Creare `backend/app/services/export_service.py`
  - Metodo `export_conversation_to_json()`
  - Metodo `export_conversation_to_markdown()`
  - Metodo `export_conversation_to_pdf()` (usando ReportLab)
  - Formattazione messaggi con timestamp e ruoli
  - Inclusione metadati (titolo, data, documenti)

- [ ] **3.2** Aggiornare `backend/app/api/chat.py`
  - Endpoint `GET /chat/{conversation_id}/export?format=json|markdown|pdf`
  - Gestione Content-Type appropriato
  - Download file con nome corretto

- [ ] **3.3** Implementare generazione PDF
  - Template PDF professionale
  - Intestazione con logo e titolo
  - Messaggi formattati con colori diversi (user/assistant)
  - Footer con pagina e data
  - Supporto code blocks e formatting

### Task Frontend
- [ ] **3.4** Aggiornare `web/lib/api.ts`
  - Funzione `chat.exportConversation(conversationId, format)`
  - Gestione download blob per PDF/MD
  - Parsing JSON per preview

- [ ] **3.5** Creare `web/components/ExportConversationButton.tsx`
  - Dropdown con opzioni export (JSON, MD, PDF)
  - Icona download
  - Loading state durante generazione
  - Tooltip esplicativo

- [ ] **3.6** Aggiornare `web/app/document/[id]/page.tsx`
  - Aggiungere ExportConversationButton nell'header chat
  - Integrazione con conversazione corrente
  - Design mobile-friendly

- [ ] **3.7** Creare `web/app/multi-chat/page.tsx` - Export
  - Aggiungere export anche per multi-document chat
  - Indicazione di tutti i documenti nella conversazione

### Test
- [ ] **3.8** Test export JSON e verifica formato
- [ ] **3.9** Test export Markdown e verifica formattazione
- [ ] **3.10** Test export PDF e verifica layout
- [ ] **3.11** Test responsive mobile

---

## 4️⃣ DOCUMENT SHARING

### Analisi
- **Attuale**: Sistema di shared quiz già implementato con token
- **Obiettivo**: Condivisione documenti con link pubblici e scadenza
- **Strategia**: Riusare pattern di `SharedQuiz` per `SharedDocument`

### Task Backend
- [ ] **4.1** Creare modello `backend/app/models/shared_document.py`
  - Tabella `shared_documents`
  - Campi: id, document_id, user_id, share_token (UUID), title, description
  - Campi: created_at, expires_at, view_count, is_active
  - Relazioni con Document e User

- [ ] **4.2** Creare `backend/app/schemas/shared_document.py`
  - Schema `SharedDocumentCreate`
  - Schema `SharedDocumentResponse`
  - Schema `SharedDocumentPublic` (senza info sensibili)

- [ ] **4.3** Creare `backend/app/api/shared_documents.py`
  - Endpoint `POST /documents/{id}/share` per creare share
  - Endpoint `GET /shared/{token}` per accesso pubblico
  - Endpoint `DELETE /shared/{token}` per revocare share
  - Endpoint `GET /documents/{id}/shares` per lista shares
  - Validazione scadenza e conteggio visualizzazioni

- [ ] **4.4** Implementare logica sicurezza
  - Token UUID sicuro
  - Validazione scadenza automatica
  - Rate limiting su accessi pubblici
  - Log accessi per analytics

### Task Frontend
- [ ] **4.5** Creare `web/components/ShareDocumentModal.tsx`
  - Modal per configurare condivisione
  - Input titolo e descrizione
  - Select scadenza (1 giorno, 7 giorni, 30 giorni, mai)
  - Generazione link condivisibile
  - Copia link in clipboard
  - Design responsive

- [ ] **4.6** Creare `web/app/shared/[token]/page.tsx`
  - Pagina pubblica per visualizzare documento condiviso
  - Mostra titolo, descrizione, contenuto documento
  - Watermark "Shared by NoteMind AI"
  - No autenticazione richiesta
  - Design responsive

- [ ] **4.7** Aggiornare `web/app/document/[id]/page.tsx`
  - Bottone "Share" nell'header
  - Apertura ShareDocumentModal
  - Lista shares esistenti
  - Revoca condivisioni

- [ ] **4.8** Aggiornare `web/lib/api.ts`
  - Funzione `documents.share()`
  - Funzione `documents.getShared(token)`
  - Funzione `documents.deleteShare(token)`

### Test
- [ ] **4.9** Test creazione share e verifica token
- [ ] **4.10** Test accesso pubblico senza auth
- [ ] **4.11** Test scadenza automatica
- [ ] **4.12** Test revoca condivisione

---

## 5️⃣ INTEGRATIONS (Google Drive & Dropbox)

### Analisi
- **Attuale**: Nessuna integrazione cloud
- **Obiettivo**: Import/export documenti da Google Drive e Dropbox
- **Strategia**: OAuth2 + API ufficiali Google Drive e Dropbox

### Task Backend
- [ ] **5.1** Aggiungere dipendenze
  - `google-auth-oauthlib==1.2.0`
  - `google-auth-httplib2==0.2.0`
  - `google-api-python-client==2.147.0`
  - `dropbox==12.0.2`
  - Aggiornare `requirements.txt`

- [ ] **5.2** Creare modello `backend/app/models/cloud_integration.py`
  - Tabella `cloud_integrations`
  - Campi: id, user_id, provider (google_drive|dropbox), access_token, refresh_token
  - Campi: token_expires_at, is_active, created_at, updated_at
  - Relazione con User

- [ ] **5.3** Aggiornare `backend/app/core/config.py`
  - Variabili: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - Variabili: `DROPBOX_APP_KEY`, `DROPBOX_APP_SECRET`, `DROPBOX_REDIRECT_URI`

- [ ] **5.4** Creare `backend/app/services/google_drive_service.py`
  - Metodo `get_auth_url()` per OAuth2 flow
  - Metodo `handle_oauth_callback()` per ottenere tokens
  - Metodo `list_files()` per listare file Drive
  - Metodo `import_file(file_id)` per importare in NoteMind
  - Metodo `export_file(document_id)` per esportare a Drive
  - Gestione refresh token automatica

- [ ] **5.5** Creare `backend/app/services/dropbox_service.py`
  - Metodo `get_auth_url()` per OAuth2 flow
  - Metodo `handle_oauth_callback()` per ottenere tokens
  - Metodo `list_files()` per listare file Dropbox
  - Metodo `import_file(path)` per importare in NoteMind
  - Metodo `export_file(document_id)` per esportare a Dropbox

- [ ] **5.6** Creare `backend/app/api/integrations.py`
  - Endpoint `GET /integrations/google-drive/auth` (redirect OAuth)
  - Endpoint `GET /integrations/google-drive/callback` (OAuth callback)
  - Endpoint `GET /integrations/google-drive/files` (lista file)
  - Endpoint `POST /integrations/google-drive/import/{file_id}` (import)
  - Endpoint `POST /integrations/google-drive/export/{document_id}` (export)
  - Endpoint `DELETE /integrations/google-drive/disconnect` (revoca)
  - Stessi endpoint per Dropbox

- [ ] **5.7** Implementare sicurezza OAuth
  - State parameter per CSRF protection
  - PKCE per sicurezza enhanced
  - Encrypted storage tokens nel database

### Task Frontend
- [ ] **5.8** Creare `web/components/IntegrationCard.tsx`
  - Card per ogni integrazione (Google Drive, Dropbox)
  - Stato connessione (connected/disconnected)
  - Bottone "Connect" / "Disconnect"
  - Logo e descrizione provider

- [ ] **5.9** Creare `web/components/CloudFilePicker.tsx`
  - Modal per selezionare file da cloud storage
  - Lista file con icone e dimensioni
  - Checkbox selezione multipla
  - Bottone "Import selected"
  - Indicatore progresso upload

- [ ] **5.10** Creare `web/app/settings/page.tsx` - Integrations
  - Sezione "Cloud Integrations"
  - Lista IntegrationCard per ogni provider
  - Gestione OAuth flow con popup/redirect
  - Feedback connessione riuscita/fallita

- [ ] **5.11** Aggiornare `web/components/FileUpload.tsx`
  - Bottone "Import from Cloud"
  - Apertura CloudFilePicker
  - Selezione provider (Google Drive / Dropbox)

- [ ] **5.12** Aggiornare `web/app/document/[id]/page.tsx`
  - Bottone "Export to Cloud" nel menu actions
  - Selezione provider destinazione
  - Conferma export e feedback

- [ ] **5.13** Aggiornare `web/lib/api.ts`
  - Funzione `integrations.connectGoogleDrive()`
  - Funzione `integrations.listGoogleDriveFiles()`
  - Funzione `integrations.importFromGoogleDrive(fileId)`
  - Funzione `integrations.exportToGoogleDrive(documentId)`
  - Funzioni simili per Dropbox

### Test
- [ ] **5.14** Test OAuth flow Google Drive
- [ ] **5.15** Test import file da Google Drive
- [ ] **5.16** Test export file a Google Drive
- [ ] **5.17** Test OAuth flow Dropbox
- [ ] **5.18** Test import file da Dropbox
- [ ] **5.19** Test export file a Dropbox
- [ ] **5.20** Test disconnessione integrazione

---

## PRIORITÀ DI IMPLEMENTAZIONE

### Sprint 1 (Alta priorità)
1. **Support for more file formats** - Migliora significativamente le capabilities
2. **Advanced search and filters** - Feature molto richiesta dagli utenti
3. **Export conversations** - Relativamente semplice, riusa codice esistente

### Sprint 2 (Media priorità)
4. **Document sharing** - Migliora collaborazione

### Sprint 3 (Bassa priorità - più complessa)
5. **Integrations** - Richiede setup OAuth e API esterne

---

## CHECKLIST GENERALE

### Prima di ogni commit
- [ ] Testare funzionalità implementata
- [ ] Verificare che non ci siano errori in console
- [ ] Verificare responsive mobile
- [ ] Controllare coerenza stile con resto app
- [ ] Scrivere commit message descrittivo

### Dopo tutte le implementazioni
- [ ] Test end-to-end completo
- [ ] Aggiornare documentazione
- [ ] Push finale al branch
- [ ] Creare Pull Request con descrizione dettagliata

---

## NOTE TECNICHE

### Pattern di sviluppo da seguire
1. **Backend first**: Implementare sempre API backend prima del frontend
2. **Riuso codice**: Usare pattern esistenti (export quiz, shared quiz, etc.)
3. **Gestione errori**: Try-catch con messaggi user-friendly
4. **Validazione**: Sia client-side che server-side
5. **Responsive**: Mobile-first design
6. **Accessibilità**: ARIA labels, keyboard navigation

### Tecnologie chiave
- **Backend**: FastAPI, SQLAlchemy, Gemini API
- **Frontend**: Next.js 16, React 19, Tailwind CSS, Zustand
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI**: Google Gemini 2.5 Flash

### Convenzioni
- **Commit messages**: `feat: <descrizione>`, `fix: <descrizione>`, `refactor: <descrizione>`
- **Branch**: `claude/notemind-new-features-013ceEg7HRgZZe7RFd7iEKWJ`
- **Naming**: snake_case (Python), camelCase (TypeScript)
