# Multi-Document Chat Feature

## Panoramica
È stata implementata la funzionalità di chat con più documenti contemporaneamente. Ora puoi fare domande su più file nella stessa conversazione e l'AI analizzerà tutti i documenti per fornire risposte complete.

## Modifiche Implementate

### 1. Modello Database
- Aggiunta tabella `conversation_documents` per relazione molti-a-molti
- `Conversation` ora supporta sia documento singolo (backward compatibility) che documenti multipli
- Script di migrazione in `backend/migrations/001_add_multi_document_conversations.py`

### 2. API Schema
- `ChatRequest` ora accetta:
  - `document_id` (singolo documento, per retrocompatibilità)
  - `document_ids` (lista di documenti)
- `ConversationResponse` include sia `document_id` che `document_ids`

### 3. Servizio Gemini
- Nuovo metodo `chat_with_documents()` per gestire più file
- Mantiene `chat_with_document()` per compatibilità
- L'AI riceve istruzioni per citare da quale documento proviene l'informazione

### 4. Endpoint Chat
- `/api/chat` aggiornato per supportare documenti multipli
- Verifica che tutti i documenti appartengano all'utente
- Crea associazioni corrette nel database

## Come Usare

### Esempio 1: Chat con singolo documento (backward compatible)
```json
POST /api/chat
{
  "document_id": 1,
  "message": "Qual è il contenuto principale?",
  "conversation_id": null
}
```

### Esempio 2: Chat con più documenti
```json
POST /api/chat
{
  "document_ids": [1, 2, 3],
  "message": "Quali sono le differenze tra questi documenti?",
  "conversation_id": null
}
```

### Esempio 3: Continuare conversazione multi-documento
```json
POST /api/chat
{
  "document_ids": [1, 2],
  "message": "Puoi approfondire questo punto?",
  "conversation_id": 42
}
```

## Migrazione Database

Per applicare la migrazione al database esistente:

```bash
cd backend
python migrations/001_add_multi_document_conversations.py
```

Oppure, se usi SQLite e vuoi ricrearlo:
```bash
rm backend/database.db
python backend/main.py  # Ricrea il database con i nuovi modelli
```

## Vantaggi

1. **Confronto documenti**: Compara informazioni tra più file
2. **Ricerca cross-document**: Trova info distribuite su più documenti
3. **Analisi combinata**: Ottieni risposte che sintetizzano più fonti
4. **Backward compatible**: Le API esistenti continuano a funzionare

## Note Tecniche

- I documenti devono essere nello stato "ready" per essere usati
- Tutti i documenti devono appartenere all'utente autenticato
- L'AI riceve tutti i file e può referenziarli nella risposta
- Le citazioni (se disponibili) indicano da quale documento provengono

## Prossimi Sviluppi

- UI per selezionare più documenti nella chat
- Visualizzazione migliore delle citazioni multi-documento
- Filtri per cercare in documenti specifici
- Analisi comparative automatiche
