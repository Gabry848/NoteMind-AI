# Guida: Chat Multi-Documento 💬

## Come Utilizzare la Nuova Funzionalità

### 1. Accesso alla Chat Multi-Documento

Dalla **Dashboard**, hai due modi per accedere alla chat multi-documento:

- **Pulsante nella barra superiore**: Clicca su "💬 Multi-Document Chat"
- **Banner informativo**: Se hai 2+ documenti pronti, vedrai un banner con suggerimento

### 2. Selezione dei Documenti

1. Nella pagina di selezione, vedrai tutti i documenti con stato "ready"
2. Seleziona uno o più documenti cliccando sulle checkbox
3. I documenti selezionati saranno evidenziati in blu
4. Clicca su "Start Chat →" quando sei pronto

**Suggerimenti:**
- Puoi selezionare quanti documenti vuoi
- Solo i documenti processati (ready) sono disponibili
- Usa "Clear Selection" per deselezionare tutto

### 3. Chattare con i Documenti

Una volta avviata la chat:

1. Vedrai i documenti selezionati nella barra superiore
2. Scrivi la tua domanda nella casella di input in basso
3. Clicca "Send" o premi Invio
4. L'AI analizzerà **tutti** i documenti selezionati per rispondere

**Esempi di domande utili:**

- "Quali sono le differenze principali tra questi documenti?"
- "Quale documento parla di [argomento]?"
- "Fai un riassunto comparativo"
- "Trova informazioni su [topic] in tutti i file"

### 4. Funzionalità Aggiuntive

- **Cambiare documenti**: Clicca su "Change Documents" per selezionare altri file
  - ⚠️ Questo inizierà una nuova conversazione
  
- **Tornare indietro**: Usa la freccia ← in alto a sinistra
  - La conversazione sarà salvata automaticamente

- **Citazioni**: Se disponibili, l'AI mostrerà da quale documento proviene l'informazione

### 5. Vantaggi della Chat Multi-Documento

✅ **Confronto diretto**: Compara informazioni tra più file
✅ **Ricerca cross-document**: Trova info distribuite su più documenti
✅ **Analisi combinata**: Ottieni sintesi che uniscono più fonti
✅ **Risparmio di tempo**: Non devi chattare con ogni file separatamente

## Note Tecniche

- La conversazione viene salvata sul server
- Puoi tornare alle conversazioni precedenti
- I documenti devono essere processati prima dell'uso
- Le citazioni indicano il documento sorgente (quando disponibili)

## Risoluzione Problemi

**Non vedo documenti disponibili?**
- Assicurati che i documenti siano nello stato "ready"
- Ricarica la pagina
- Verifica che l'upload sia completato

**La chat non funziona?**
- Controlla la connessione al backend
- Verifica di aver selezionato almeno un documento
- Controlla la console per eventuali errori

**Voglio chattare con un singolo documento?**
- Puoi continuare a usare la chat tradizionale cliccando sul documento nella dashboard
- Oppure seleziona un solo documento nella multi-chat

---

Per supporto tecnico o bug, controlla i log del backend in `backend/main.py`
