// Translation files for NoteMind AI
// Supported languages: Italian (it), English (en)

interface Translations {
  [key: string]: any;
}

const translations: { [lang: string]: Translations } = {
  it: {
    // Common
    common: {
      login: "Login",
      logout: "Logout",
      register: "Registrati",
      cancel: "Annulla",
      save: "Salva",
      delete: "Elimina",
      edit: "Modifica",
      create: "Crea",
      search: "Cerca",
      loading: "Caricamento...",
      error: "Errore",
      success: "Successo",
      confirm: "Conferma",
      back: "Indietro",
      next: "Avanti",
      finish: "Fine",
      yes: "Sì",
      no: "No",
      or: "o",
      and: "e",
      settings: "Impostazioni",
    },

    // Home/Landing Page
    home: {
      title: "NoteMind AI",
      beta: "Beta",
      startFree: "Inizia Gratis",
      login: "Login",
      signUp: "Inizia Ora",
      accessAccount: "Accedi",
      haveAccount: "Ho già un Account",
      hero: {
        title: "Il Tuo Assistente AI",
        subtitle: "per lo Studio",
        description: "Carica documenti, fai domande intelligenti e ottieni risposte precise. Trasforma i tuoi appunti in conversazioni interattive con l'AI di Google Gemini.",
      },
      features: {
        title: "Tutto ciò di cui hai bisogno",
        uploadDocs: {
          title: "Carica Documenti",
          description: "Supporto per PDF, DOCX, TXT, JSON, Markdown e codice. Interfaccia drag & drop intuitiva.",
        },
        multiChat: {
          title: "Chat Multi-Documento",
          description: "Fai domande su più documenti contemporaneamente. L'AI trova le risposte con citazioni precise.",
        },
        summaries: {
          title: "Riassunti Automatici",
          description: "Genera riassunti completi con un click. Estrai argomenti chiave e concetti principali.",
        },
        quiz: {
          title: "Quiz Personalizzati",
          description: "Genera quiz intelligenti dai tuoi documenti. Studia in modo più efficace e verifica la comprensione.",
        },
        search: {
          title: "Ricerca Semantica",
          description: "Trova informazioni con ricerca intelligente. L'AI comprende il contesto, non solo le parole chiave.",
        },
        organization: {
          title: "Organizzazione Smart",
          description: "Gestisci documenti con cartelle. Organizza il tuo workspace in modo efficiente.",
        },
      },
      howItWorks: {
        title: "Come Funziona",
        step1: {
          title: "Carica",
          description: "Trascina i tuoi documenti o caricali con un click. Elaborazione veloce e sicura.",
        },
        step2: {
          title: "Chatta",
          description: "Fai domande naturali sui tuoi documenti. L'AI risponde con precisione e citazioni.",
        },
        step3: {
          title: "Impara",
          description: "Ottieni riassunti, quiz e insights. Studia in modo più efficiente e veloce.",
        },
      },
      stats: {
        formats: "Formati Supportati",
        questions: "Domande",
        poweredBy: "Powered by Gemini",
        openSource: "Source",
      },
      cta: {
        title: "Pronto a Iniziare?",
        description: "Unisciti a chi sta già trasformando il proprio modo di studiare con l'intelligenza artificiale.",
        startFree: "Inizia Gratuitamente 🚀",
      },
      github: {
        title: "❤️ Supporta il Progetto",
        description: "Ama NoteMind AI? Dai una stella su GitHub e aiutaci a migliorare! Il tuo supporto ci motiva a sviluppare nuove features e migliorare costantemente.",
        giveStar: "⭐ Dai una Stella",
        contribute: "🔀 Contribuisci",
        openSource: "Open Source",
        openSourceDesc: "Completamente open source e gratuito",
        active: "Attivo",
        activeDesc: "Sviluppo continuo e aggiornamenti regolari",
        community: "Comunità",
        communityDesc: "Unisciti alla comunità di sviluppatori",
      },
      footer: {
        madeWith: "Made with ❤️ using Next.js, FastAPI, and Google Gemini",
        copyright: "© 2025 NoteMind AI • Beta Version • Open Source",
      },
      tagline: "✨ Gratis • Open Source • Nessuna carta di credito richiesta • Powered by Google Gemini",
    },

    // Dashboard
    dashboard: {
      title: "NoteMind AI",
      welcome: "Welcome back!",
      yourWorkspace: "Your AI-powered workspace",
      quickActions: "🚀 Quick Actions",
      recentActivity: "⚡ Recent Activity",
      whatCanDo: "💡 What You Can Do",
      recentDocuments: "📚 Recent Documents",
      viewAll: "View All →",
      startChat: "Start Chat",
      browseDocs: "Browse Docs",
      upload: "Upload",
      quickChat: "Quick Chat",
      stats: {
        totalDocs: "Total Documents",
        conversations: "Conversations",
        ready: "Ready",
        storage: "Storage",
        allReady: "All ready",
        processing: "processing",
        recentMessages: "recent messages",
        avgSize: "KB avg",
        thisMonth: "this month",
      },
      actions: {
        browse: {
          title: "Browse Documents",
          description: "Manage all your documents",
          action: "Browse",
        },
        chat: {
          title: "Multi-Document Chat",
          description: "Chat with multiple documents",
          action: "Start Chat",
        },
        quiz: {
          title: "Student Quiz",
          description: "Test your knowledge with AI quizzes",
          action: "Start Quiz",
        },
        analytics: {
          title: "Analytics",
          description: "View insights and stats",
          action: "View",
        },
      },
      features: {
        aiAnalysis: {
          title: "AI Analysis",
          description: "Instant summaries and insights",
        },
        smartChat: {
          title: "Smart Chat",
          description: "Context-aware answers",
        },
        organization: {
          title: "Organization",
          description: "Folders and drag & drop",
        },
        search: {
          title: "Search",
          description: "Find anything instantly",
        },
      },
      activity: {
        noActivity: "No activity yet",
        startUploading: "Start by uploading a document!",
        documentsUploaded: "documents uploaded",
        messagesSent: "messages sent",
        documentsReady: "documents ready",
        totalConversations: "total conversations",
        last30Days: "Last 30 days",
        availableNow: "Available now",
        allTime: "All time",
      },
      emptyState: {
        title: "Ready to get started?",
        description: "Upload your first document and experience the power of AI-driven insights",
        uploadDoc: "Upload Document",
        exploreFeatures: "Explore Features",
      },
      shortcuts: {
        title: "⌨️ Scorciatoie",
        openChat: "Apri Chat",
        openQuiz: "Apri Quiz",
        upload: "Upload",
        documents: "Documenti",
      },
    },

    // Documents Page
    documents: {
      title: "My Documents",
      files: "file",
      filesPlural: "files",
      hi: "Hi",
      treeView: "🌲 Tree View",
      gridView: "📊 Grid View",
      mergeDocuments: "🔗 Merge {count} Documents",
      clearSelection: "Clear Selection",
      uploadDocument: "+ Upload Document",
      cancel: "Cancel",
      searchPlaceholder: "🔍 Search documents...",
      filters: {
        allStatus: "All Status",
        ready: "Ready",
        processing: "Processing",
        error: "Error",
      },
      uploadHint: "💡 Carica una foto di un quaderno: verrà estratto il testo automaticamente tramite OCR",
      loadingDocuments: "Loading documents...",
      emptyState: {
        noMatching: "No matching documents",
        noDocs: "No documents yet",
        tryDifferent: "Try a different search term",
        uploadFirst: "Upload your first document to get started",
        uploadButton: "Upload Document",
      },
      merge: {
        title: "Merge Documents",
        description: "You are merging {count} documents into one.",
        filename: "Merged Filename (optional)",
        placeholder: "merged_document.md",
        hint: "Leave empty for auto-generated name",
        merging: "Merging...",
        merge: "Merge",
        selectAtLeast2: "Please select at least 2 documents to merge",
        success: "Documents merged successfully!",
        failed: "Failed to merge documents",
      },
      folder: {
        new: "New Folder",
        edit: "Edit Folder",
        name: "Folder Name",
        namePlaceholder: "Enter folder name",
        icon: "Icon",
        deleteConfirm: "Delete this folder? Documents inside will be moved to root.",
      },
      contextMenu: {
        open: "Apri",
        select: "Seleziona",
        deselect: "Deseleziona",
        copyName: "Copia nome",
        download: "Scarica",
        copyId: "Copia ID",
        delete: "Elimina",
      },
      deleteConfirm: "Are you sure you want to delete this document?",
    },

    // Document Page
    document: {
      tabs: {
        chat: "Chat",
        summary: "Summary",
        content: "Content",
        schema: "Schema",
      },
      chat: {
        title: "Chat with Document",
        placeholder: "Ask a question about this document...",
        send: "Send",
        newChat: "New Chat",
        empty: "No messages yet. Start a conversation!",
      },
      summary: {
        title: "Document Summary",
        generate: "Generate Summary",
        regenerate: "Regenerate Summary",
        loading: "Generating summary...",
        empty: "No summary yet. Generate one to get started!",
      },
      content: {
        title: "Document Content",
        load: "Load Content",
        loading: "Loading content...",
        empty: "No content available",
      },
      schema: {
        title: "Document Schema",
        generate: "Generate Schema",
        regenerate: "Regenerate Schema",
        loading: "Generating schema...",
        empty: "No schema yet. Generate one to visualize the document structure!",
        settings: "Settings",
        diagramType: "Diagram Type",
        detailLevel: "Detail Level",
      },
    },

    // Quiz
    quiz: {
      title: "Crea il Tuo Quiz",
      description: "Seleziona i documenti e configura il quiz per testare la tua conoscenza",
      step1: "1. Seleziona i Documenti",
      step2: "2. Configura il Quiz",
      numberOfQuestions: "Numero di Domande",
      questionType: "Tipo di Domande",
      types: {
        multipleChoice: {
          title: "Risposta Multipla",
          description: "Domande con opzioni A, B, C, D",
        },
        openEnded: {
          title: "Risposta Aperta",
          description: "Domande che richiedono spiegazioni",
        },
        mixed: {
          title: "Misto",
          description: "Combinazione di entrambi i tipi",
        },
      },
      difficulty: "Livello di Difficoltà",
      levels: {
        easy: {
          title: "Facile",
          description: "Concetti base e comprensione semplice",
        },
        medium: {
          title: "Medio",
          description: "Richiede comprensione e analisi",
        },
        hard: {
          title: "Difficile",
          description: "Domande avanzate e approfondite",
        },
      },
      readyToStart: "Pronto per Iniziare?",
      documents: "document",
      documentsPlural: "documenti",
      questions: "domande",
      generate: "Genera Quiz",
      generating: "Creazione...",
      selectAtLeastOne: "Seleziona almeno un documento",
    },

    // Settings
    settings: {
      title: "Impostazioni",
      language: {
        title: "Lingua dell'assistente IA",
        description: "Scegli la lingua preferita per le risposte dell'assistente e i quiz.",
        current: "Attuale",
        saved: "✓ Lingua salvata",
        error: "✗ Errore salvataggio",
      },
      shortcuts: {
        title: "Scorciatoie da tastiera",
        description: "Definisci le scorciatoie. Le combinazioni sono attive in tutta l'app, ma vengono mostrate solo qui.",
        openChat: "Apri Multi-Chat",
        openDocuments: "Apri Documenti",
        openQuiz: "Apri Quiz",
        upload: "Carica/Upload",
        toggleSidebar: "Mostra/Nascondi Sidebar",
        reset: "Reset scorciatoie",
      },
      interface: {
        title: "Preferenze interfaccia",
        showShortcuts: "Mostra suggerimenti scorciatoie in dashboard",
        showShortcutsDesc: "Consigliato: disattivo, per tenere pulita la dashboard.",
      },
      footer: "Le impostazioni vengono salvate sul dispositivo (localStorage).",
    },

    // Status
    status: {
      ready: "Ready",
      processing: "Processing",
      error: "Error",
      readyToChat: "Ready to chat",
    },
  },

  en: {
    // Common
    common: {
      login: "Login",
      logout: "Logout",
      register: "Sign Up",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      finish: "Finish",
      yes: "Yes",
      no: "No",
      or: "or",
      and: "and",
      settings: "Settings",
    },

    // Home/Landing Page
    home: {
      title: "NoteMind AI",
      beta: "Beta",
      startFree: "Get Started Free",
      login: "Login",
      signUp: "Get Started",
      accessAccount: "Sign In",
      haveAccount: "I Already Have an Account",
      hero: {
        title: "Your AI Assistant",
        subtitle: "for Studying",
        description: "Upload documents, ask smart questions, and get precise answers. Transform your notes into interactive conversations with Google Gemini AI.",
      },
      features: {
        title: "Everything You Need",
        uploadDocs: {
          title: "Upload Documents",
          description: "Support for PDF, DOCX, TXT, JSON, Markdown, and code. Intuitive drag & drop interface.",
        },
        multiChat: {
          title: "Multi-Document Chat",
          description: "Ask questions across multiple documents. AI finds answers with precise citations.",
        },
        summaries: {
          title: "Automatic Summaries",
          description: "Generate comprehensive summaries with one click. Extract key topics and main concepts.",
        },
        quiz: {
          title: "Personalized Quizzes",
          description: "Generate smart quizzes from your documents. Study more effectively and verify understanding.",
        },
        search: {
          title: "Semantic Search",
          description: "Find information with intelligent search. AI understands context, not just keywords.",
        },
        organization: {
          title: "Smart Organization",
          description: "Manage documents with folders. Organize your workspace efficiently.",
        },
      },
      howItWorks: {
        title: "How It Works",
        step1: {
          title: "Upload",
          description: "Drag your documents or upload with a click. Fast and secure processing.",
        },
        step2: {
          title: "Chat",
          description: "Ask natural questions about your documents. AI responds with precision and citations.",
        },
        step3: {
          title: "Learn",
          description: "Get summaries, quizzes, and insights. Study more efficiently and faster.",
        },
      },
      stats: {
        formats: "Supported Formats",
        questions: "Questions",
        poweredBy: "Powered by Gemini",
        openSource: "Source",
      },
      cta: {
        title: "Ready to Get Started?",
        description: "Join those already transforming the way they study with artificial intelligence.",
        startFree: "Get Started Free 🚀",
      },
      github: {
        title: "❤️ Support the Project",
        description: "Love NoteMind AI? Give us a star on GitHub and help us improve! Your support motivates us to develop new features and constantly improve.",
        giveStar: "⭐ Give a Star",
        contribute: "🔀 Contribute",
        openSource: "Open Source",
        openSourceDesc: "Completely open source and free",
        active: "Active",
        activeDesc: "Continuous development and regular updates",
        community: "Community",
        communityDesc: "Join the developer community",
      },
      footer: {
        madeWith: "Made with ❤️ using Next.js, FastAPI, and Google Gemini",
        copyright: "© 2025 NoteMind AI • Beta Version • Open Source",
      },
      tagline: "✨ Free • Open Source • No credit card required • Powered by Google Gemini",
    },

    // Dashboard
    dashboard: {
      title: "NoteMind AI",
      welcome: "Welcome back!",
      yourWorkspace: "Your AI-powered workspace",
      quickActions: "🚀 Quick Actions",
      recentActivity: "⚡ Recent Activity",
      whatCanDo: "💡 What You Can Do",
      recentDocuments: "📚 Recent Documents",
      viewAll: "View All →",
      startChat: "Start Chat",
      browseDocs: "Browse Docs",
      upload: "Upload",
      quickChat: "Quick Chat",
      stats: {
        totalDocs: "Total Documents",
        conversations: "Conversations",
        ready: "Ready",
        storage: "Storage",
        allReady: "All ready",
        processing: "processing",
        recentMessages: "recent messages",
        avgSize: "KB avg",
        thisMonth: "this month",
      },
      actions: {
        browse: {
          title: "Browse Documents",
          description: "Manage all your documents",
          action: "Browse",
        },
        chat: {
          title: "Multi-Document Chat",
          description: "Chat with multiple documents",
          action: "Start Chat",
        },
        quiz: {
          title: "Student Quiz",
          description: "Test your knowledge with AI quizzes",
          action: "Start Quiz",
        },
        analytics: {
          title: "Analytics",
          description: "View insights and stats",
          action: "View",
        },
      },
      features: {
        aiAnalysis: {
          title: "AI Analysis",
          description: "Instant summaries and insights",
        },
        smartChat: {
          title: "Smart Chat",
          description: "Context-aware answers",
        },
        organization: {
          title: "Organization",
          description: "Folders and drag & drop",
        },
        search: {
          title: "Search",
          description: "Find anything instantly",
        },
      },
      activity: {
        noActivity: "No activity yet",
        startUploading: "Start by uploading a document!",
        documentsUploaded: "documents uploaded",
        messagesSent: "messages sent",
        documentsReady: "documents ready",
        totalConversations: "total conversations",
        last30Days: "Last 30 days",
        availableNow: "Available now",
        allTime: "All time",
      },
      emptyState: {
        title: "Ready to get started?",
        description: "Upload your first document and experience the power of AI-driven insights",
        uploadDoc: "Upload Document",
        exploreFeatures: "Explore Features",
      },
      shortcuts: {
        title: "⌨️ Shortcuts",
        openChat: "Open Chat",
        openQuiz: "Open Quiz",
        upload: "Upload",
        documents: "Documents",
      },
    },

    // Documents Page
    documents: {
      title: "My Documents",
      files: "file",
      filesPlural: "files",
      hi: "Hi",
      treeView: "🌲 Tree View",
      gridView: "📊 Grid View",
      mergeDocuments: "🔗 Merge {count} Documents",
      clearSelection: "Clear Selection",
      uploadDocument: "+ Upload Document",
      cancel: "Cancel",
      searchPlaceholder: "🔍 Search documents...",
      filters: {
        allStatus: "All Status",
        ready: "Ready",
        processing: "Processing",
        error: "Error",
      },
      uploadHint: "💡 Upload a photo of a notebook: text will be automatically extracted via OCR",
      loadingDocuments: "Loading documents...",
      emptyState: {
        noMatching: "No matching documents",
        noDocs: "No documents yet",
        tryDifferent: "Try a different search term",
        uploadFirst: "Upload your first document to get started",
        uploadButton: "Upload Document",
      },
      merge: {
        title: "Merge Documents",
        description: "You are merging {count} documents into one.",
        filename: "Merged Filename (optional)",
        placeholder: "merged_document.md",
        hint: "Leave empty for auto-generated name",
        merging: "Merging...",
        merge: "Merge",
        selectAtLeast2: "Please select at least 2 documents to merge",
        success: "Documents merged successfully!",
        failed: "Failed to merge documents",
      },
      folder: {
        new: "New Folder",
        edit: "Edit Folder",
        name: "Folder Name",
        namePlaceholder: "Enter folder name",
        icon: "Icon",
        deleteConfirm: "Delete this folder? Documents inside will be moved to root.",
      },
      contextMenu: {
        open: "Open",
        select: "Select",
        deselect: "Deselect",
        copyName: "Copy name",
        download: "Download",
        copyId: "Copy ID",
        delete: "Delete",
      },
      deleteConfirm: "Are you sure you want to delete this document?",
    },

    // Document Page
    document: {
      tabs: {
        chat: "Chat",
        summary: "Summary",
        content: "Content",
        schema: "Schema",
      },
      chat: {
        title: "Chat with Document",
        placeholder: "Ask a question about this document...",
        send: "Send",
        newChat: "New Chat",
        empty: "No messages yet. Start a conversation!",
      },
      summary: {
        title: "Document Summary",
        generate: "Generate Summary",
        regenerate: "Regenerate Summary",
        loading: "Generating summary...",
        empty: "No summary yet. Generate one to get started!",
      },
      content: {
        title: "Document Content",
        load: "Load Content",
        loading: "Loading content...",
        empty: "No content available",
      },
      schema: {
        title: "Document Schema",
        generate: "Generate Schema",
        regenerate: "Regenerate Schema",
        loading: "Generating schema...",
        empty: "No schema yet. Generate one to visualize the document structure!",
        settings: "Settings",
        diagramType: "Diagram Type",
        detailLevel: "Detail Level",
      },
    },

    // Quiz
    quiz: {
      title: "Create Your Quiz",
      description: "Select documents and configure the quiz to test your knowledge",
      step1: "1. Select Documents",
      step2: "2. Configure Quiz",
      numberOfQuestions: "Number of Questions",
      questionType: "Question Type",
      types: {
        multipleChoice: {
          title: "Multiple Choice",
          description: "Questions with options A, B, C, D",
        },
        openEnded: {
          title: "Open Ended",
          description: "Questions requiring explanations",
        },
        mixed: {
          title: "Mixed",
          description: "Combination of both types",
        },
      },
      difficulty: "Difficulty Level",
      levels: {
        easy: {
          title: "Easy",
          description: "Basic concepts and simple understanding",
        },
        medium: {
          title: "Medium",
          description: "Requires understanding and analysis",
        },
        hard: {
          title: "Hard",
          description: "Advanced and in-depth questions",
        },
      },
      readyToStart: "Ready to Start?",
      documents: "document",
      documentsPlural: "documents",
      questions: "questions",
      generate: "Generate Quiz",
      generating: "Creating...",
      selectAtLeastOne: "Select at least one document",
    },

    // Settings
    settings: {
      title: "Settings",
      language: {
        title: "AI Assistant Language",
        description: "Choose your preferred language for assistant responses and quizzes.",
        current: "Current",
        saved: "✓ Language saved",
        error: "✗ Saving error",
      },
      shortcuts: {
        title: "Keyboard Shortcuts",
        description: "Define shortcuts. Combinations are active throughout the app, but only shown here.",
        openChat: "Open Multi-Chat",
        openDocuments: "Open Documents",
        openQuiz: "Open Quiz",
        upload: "Upload",
        toggleSidebar: "Show/Hide Sidebar",
        reset: "Reset shortcuts",
      },
      interface: {
        title: "Interface Preferences",
        showShortcuts: "Show shortcut hints in dashboard",
        showShortcutsDesc: "Recommended: disabled, to keep dashboard clean.",
      },
      footer: "Settings are saved on the device (localStorage).",
    },

    // Status
    status: {
      ready: "Ready",
      processing: "Processing",
      error: "Error",
      readyToChat: "Ready to chat",
    },
  },
};

export default translations;
