# 📸 Upload Immagini con OCR - Guida

## 🎯 Funzionalità

NoteMind AI ora supporta l'**upload di foto** con estrazione automatica del testo tramite OCR!

### Come funziona?

1. **Scatta una foto** ad una pagina del tuo quaderno
2. **Carica la foto** nella sezione Documents
3. **L'IA elabora l'immagine** attraverso questi passaggi:
   - 📝 **Estrazione del testo** tramite Google Gemini Vision
   - 🔧 **Correzione errori OCR** (parole spezzate, typos)
   - ✨ **Formattazione Markdown** professionale
   - 🏷️ **Generazione automatica del titolo** descrittivo
4. **Salvataggio automatico** come file markdown
5. **Pronto per quiz e chat!** 🎓

## 📋 Formati supportati

- **Immagini**: JPG, JPEG, PNG, WEBP
- **Documenti**: PDF, TXT, DOCX, MD, JSON

## 🚀 Come usare

### 1. Vai su `/documents`

### 2. Clicca su "Upload Document"

### 3. Seleziona o trascina una foto

Puoi caricare:
- Foto di appunti scritti a mano
- Screenshot di documenti
- Foto di pagine di libri
- Qualsiasi immagine con testo

### 4. Aspetta l'elaborazione

L'IA processerà l'immagine in circa 10-30 secondi:
```
Step 1: Extracting text from image...
Step 2: Correcting text errors...
Step 3: Formatting as markdown...
Step 4: Generating document title...
```

### 5. Il documento è pronto!

Troverai un file markdown con:
- ✅ Testo estratto e corretto
- ✅ Formattazione markdown pulita
- ✅ Titolo descrittivo auto-generato
- ✅ Pronto per fare quiz o chat

## 💡 Suggerimenti

### Per foto migliori:
- 📱 Usa buona illuminazione
- 🎯 Inquadra bene il testo
- 📐 Tieni la camera dritta
- 🔍 Evita sfocature

### Dopo l'upload:
- 💬 Usa il documento per chat
- 📝 Genera quiz sugli appunti
- 📚 Organizza in cartelle
- 🔍 Cerca nel contenuto

## 🛠️ Implementazione Tecnica

### Backend (`ocr_service.py`)

```python
# Pipeline completa:
1. extract_text_from_image()     # Gemini Vision OCR
2. correct_and_improve_text()    # Correzione errori
3. format_as_markdown()          # Formattazione
4. generate_document_title()     # Titolo automatico
```

### Endpoint API

```python
POST /api/documents/upload
- Supporta multipart/form-data
- Rileva automaticamente immagini
- Processa con OCR se è un'immagine
- Salva come markdown
```

### Frontend

```tsx
// FileUpload component con supporto immagini
<FileUpload 
  onFileSelect={handleFileSelect} 
  acceptImages={true} 
/>
```

## 🎓 Caso d'uso: Quiz da foto

1. **Scatta foto** agli appunti della lezione
2. **Carica** su NoteMind AI
3. **L'IA elabora** il testo
4. **Vai su Quiz** e seleziona il documento
5. **Genera quiz** personalizzato
6. **Studia** con domande basate sui tuoi appunti!

## 🔧 Requisiti

### Python Dependencies:
```bash
google-generativeai>=0.8.0
google-cloud-vision>=3.7.0
pillow>=10.2.0
```

### API Key:
Assicurati di avere `GEMINI_API_KEY` configurato nel file `.env`

## 📊 Limiti

- **Dimensione massima**: 10MB per immagine
- **Tempo elaborazione**: 10-30 secondi
- **Qualità OCR**: Dipende dalla qualità dell'immagine
- **Lingue**: Supporta tutte le lingue riconosciute da Gemini

## 🐛 Troubleshooting

### Errore "Failed to extract text"
- Verifica che l'immagine contenga testo leggibile
- Prova con un'immagine più chiara
- Controlla che GEMINI_API_KEY sia configurato

### Testo non corretto
- L'IA fa del suo meglio, ma dipende dalla qualità dell'immagine
- Puoi sempre modificare il documento dopo

### Processing lento
- È normale! L'elaborazione richiede 4 passaggi con l'IA
- Il documento verrà salvato non appena pronto

## 🎉 Prova subito!

Vai su `/documents` e carica la tua prima foto! 📸
