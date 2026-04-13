export type SiteLanguage = "en" | "es" | "fr" | "hi";
export type PreferredLanguageCode = string;

export const defaultLanguage: SiteLanguage = "en";
export const siteLanguages: SiteLanguage[] = ["en", "es", "fr", "hi"];
export const siteLanguageCookieName = "aether-site-language";

export function isSiteLanguage(value: string): value is SiteLanguage {
  return siteLanguages.includes(value as SiteLanguage);
}

export const languageOptions: Array<{ code: SiteLanguage; label: string; nativeLabel: string }> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Espanol" },
  { code: "fr", label: "French", nativeLabel: "Francais" },
  { code: "hi", label: "Hindi", nativeLabel: "Hindi" },
];

export const globalLanguageOptions: Array<{
  code: PreferredLanguageCode;
  label: string;
  nativeLabel: string;
}> = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "Hindi" },
  { code: "fr", label: "French", nativeLabel: "Francais" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "ja", label: "Japanese", nativeLabel: "Nihongo" },
  { code: "ko", label: "Korean", nativeLabel: "Hanguk-eo" },
];

export function isKnownPreferredLanguage(value: string): value is PreferredLanguageCode {
  return globalLanguageOptions.some((option) => option.code === value);
}

export function resolveUiLanguage(
  value: string | null | undefined,
  fallback: SiteLanguage = defaultLanguage,
): SiteLanguage {
  const nextValue = value ?? "";
  return isSiteLanguage(nextValue) ? nextValue : fallback;
}

export type LandingCopy = {
  nav: {
    platform: string;
    workflow: string;
    blog: string;
    plans: string;
    faq: string;
    signIn: string;
    explorePlans: string;
  };
  hero: {
    badge: string;
    title: string;
    body: string;
    primaryCta: string;
    workflowCta: string;
    platformCta: string;
  };
  heroSignals: Array<{ title: string; body: string }>;
  trustBar: string[];
  platform: {
    eyebrow: string;
    title: string;
    body: string;
    modules: Array<{ eyebrow: string; title: string; body: string }>;
  };
  workflow: {
    eyebrow: string;
    title: string;
    body: string;
    checklist: string[];
    steps: Array<{ step: string; title: string; body: string }>;
  };
  blog: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };
  plans: {
    free: {
      eyebrow: string;
      title: string;
      body: string;
      features: string[];
      cta: string;
    };
    paid: {
      eyebrow: string;
      title: string;
      body: string;
      features: string[];
      cta: string;
    };
  };
  faq: {
    eyebrow: string;
    title: string;
    body: string;
    items: Array<{ question: string; answer: string }>;
  };
  cta: {
    eyebrow: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    fields: {
      name: string;
      email: string;
      company: string;
      goal: string;
      details: string;
    };
    placeholders: {
      name: string;
      email: string;
      company: string;
      goal: string;
      details: string;
    };
    submit: string;
    success: string;
    error: string;
    helper: string;
  };
};

export type AuthCopy = {
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  selectedWorkspace: string;
  activeChoice: string;
  freeWorkspace: string;
  paidWorkspace: string;
  freeWorkspaceBody: string;
  paidWorkspaceBody: string;
  welcomeEyebrow: string;
  welcomeTitle: string;
  googleButton: string;
  emailDivider: string;
  emailLabel: string;
  phoneLabel: string;
  smsNotice: string;
  otpLabel: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  otpPlaceholder: string;
  sendOtpButton: string;
  resendOtpButton: string;
  verifyOtpButton: string;
  sendLinkButton: string;
  chooseWorkspace: string;
  selectableBeforeSignin: string;
  selectedLabel: string;
  chooseLabel: string;
  backHome: string;
  status: {
    initial: string;
    needPhone: string;
    invalidPhone: string;
    needEmail: string;
    sendingLink: string;
    linkSent: string;
    linkFailed: string;
    reconnectBrowser: string;
    signingInEmail: string;
    linkExpired: string;
    connectingGoogle: string;
    googleFailed: string;
    verifyPhoneToContinue: string;
    sendingOtp: string;
    otpSent: string;
    otpFailed: string;
    needOtp: string;
    verifyingOtp: string;
    otpVerifyFailed: string;
    creatingWorkspace: (plan: string) => string;
    workspaceReady: string;
    workspaceSelected: (plan: string) => string;
    workspaceSaveFailed: string;
    completePhoneVerificationFirst: string;
    signInFinishFailed: string;
    welcomeBack: string;
  };
};

export type ShellCopy = {
  nav: {
    dashboard: string;
    analytics: string;
    aiAssistant: string;
    plagiarismCheck: string;
    generateBlog: string;
    websiteAudit: string;
    history: string;
    billing: string;
    settings: string;
  };
  loading: string;
  premiumWorkspace: string;
  starterWorkspace: string;
  paidWorkspace: string;
  searchPlaceholder: string;
  alerts: string;
  billingSettings: string;
  upgradeToPro: string;
  quickSearch: string;
  newAction: string;
  aiAssistant: string;
  footer: string;
};

export type BlogWorkspaceCopy = {
  title: string;
  body: string;
  keywordLabel: string;
  toneLabel: string;
  lengthLabel: string;
  languageLabel: string;
  generateButton: string;
  lengths: string[];
  languageHelper: string;
  previewEyebrow: string;
  previewMeta: string;
  titlePreview: string;
  paragraphs: string[];
  sectionTitle: string;
  sectionBody: string;
  bullets: string[];
  companyBlogLink: string;
  companyBlogBody: string;
};

export type BlogIndexCopy = {
  eyebrow: string;
  title: string;
  body: string;
  viewArticle: string;
  backHome: string;
};

export type PublicBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  hero: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

export const landingCopy: Record<SiteLanguage, LandingCopy> = {
  en: {
    nav: {
      platform: "Platform",
      workflow: "Workflow",
      blog: "Blog",
      plans: "Plans",
      faq: "FAQ",
      signIn: "Sign In",
      explorePlans: "Explore Plans",
    },
    hero: {
      badge: "Search workflow operating system",
      title: "Make SEO feel like a product, not a pile of disconnected tasks",
      body: "Aether gives your startup one elegant workspace to plan content, run audits, track progress, and ship higher-confidence SEO work without juggling scattered tools.",
      primaryCta: "Start onboarding",
      workflowCta: "See workflow",
      platformCta: "Explore platform",
    },
    heroSignals: [
      { title: "Audit", body: "Run technical reviews and surface the fixes that matter first." },
      { title: "Generate", body: "Turn ideas into structured drafts and optimization tasks fast." },
      { title: "Measure", body: "Keep a clean record of changes, history, and workspace outcomes." },
    ],
    trustBar: [
      "Intent-first planning",
      "AI-assisted production",
      "Technical SEO visibility",
      "Persistent workspace history",
    ],
    platform: {
      eyebrow: "Platform",
      title: "Richer than a landing page promise, clearer than a generic SEO suite",
      body: "The product story stays specific: Aether helps teams move from planning to publishing without losing strategy, workflow, or visibility.",
      modules: [
        {
          eyebrow: "Intent Layer",
          title: "Shape strategy before the model starts writing",
          body: "Cluster opportunities by topic, intent, and stage so the AI output supports a real search strategy instead of isolated drafts.",
        },
        {
          eyebrow: "Content Engine",
          title: "Generate work your team can actually publish",
          body: "Draft articles, refine structure, and keep a consistent editorial direction inside one guided production loop.",
        },
        {
          eyebrow: "Audit Surface",
          title: "Spot technical risks without opening five separate tools",
          body: "Identify crawl issues, weak metadata, and page-level bottlenecks through a focused dashboard built for action.",
        },
        {
          eyebrow: "History Feed",
          title: "Track what changed and what shipped",
          body: "Store generated work, audits, and decisions in a shared timeline so nobody loses context between sessions.",
        },
      ],
    },
    workflow: {
      eyebrow: "Workflow",
      title: "A more deliberate experience from first click to execution",
      body: "The home page now explains how the product behaves after sign-in, not just what it claims.",
      checklist: [
        "User signs in with Google, Apple, or email link",
        "Phone is stored for later verification",
        "Plan choice determines the workspace they enter",
        "Dashboard loads only that user's workspace data",
      ],
      steps: [
        { step: "01", title: "Frame the goal", body: "Define the site, theme, and business priority so every run starts from a clear target." },
        { step: "02", title: "Generate the workplan", body: "Aether turns your inputs into content opportunities, audit tasks, and next actions." },
        { step: "03", title: "Refine and execute", body: "Use the workspace to produce drafts, scan pages, and move the right items forward." },
        { step: "04", title: "Keep the loop alive", body: "Save history, compare results, and keep improving instead of restarting from zero." },
      ],
    },
    blog: {
      eyebrow: "Company Blog",
      title: "Publish a stronger editorial layer for your own website",
      body: "The public blog is built for your brand site, not the end user's generated output. It follows the same design language while staying separate from the AI workspace.",
      cta: "Open blog hub",
    },
    plans: {
      free: {
        eyebrow: "Starter",
        title: "Free workspace",
        body: "Good for first-time setup, lighter usage, and validating the workflow before you need a more aggressive content and reporting cadence.",
        features: [
          "Email, Google, and Apple sign-in",
          "Saved workspace profile",
          "Starter dashboard experience",
          "Core audit and content flow",
        ],
        cta: "Choose Free",
      },
      paid: {
        eyebrow: "Pro",
        title: "Paid workspace",
        body: "For teams that want a more serious operating surface with deeper run volume, stronger tracking, and a richer day-to-day workflow.",
        features: [
          "Expanded dashboard surface",
          "Higher content and audit throughput",
          "Improved reporting rhythm",
          "Support for ongoing SEO operations",
        ],
        cta: "Choose Paid",
      },
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions users will ask before they trust the product",
      body: "Good landing pages remove ambiguity. These answers make the auth, data, and plan flow easier to understand at a glance.",
      items: [
        {
          question: "Is this built for founders or SEO teams?",
          answer: "Both. The flow stays simple enough for a startup founder, but the structure is strong enough for a small marketing or content team.",
        },
        {
          question: "What happens after sign in?",
          answer: "Users land in onboarding, choose the free or paid workspace once, and then their dashboard loads from their own workspace data.",
        },
        {
          question: "Can I start free and upgrade later?",
          answer: "Yes. The workspace is tied to the account. Plan selection can change later without losing the user profile or saved dashboard data.",
        },
      ],
    },
    cta: {
      eyebrow: "Ready to begin",
      title: "Bring more energy and more clarity into the first experience",
      body: "The landing page should feel alive, more specific, and more premium while still pushing users directly into the signup and plan flow.",
      primary: "Continue to Auth",
      secondary: "Revisit platform story",
    },
    contact: {
      eyebrow: "Contact",
      title: "Tell us how Aether should help your workflow",
      body: "If you want a sharper SEO operating system, better blog foundations, or a stronger multilingual setup, send the brief here.",
      fields: {
        name: "Full name",
        email: "Email address",
        company: "Company or website",
        goal: "Primary goal",
        details: "Project details",
      },
      placeholders: {
        name: "Rahul Patel",
        email: "rahul@company.com",
        company: "aetherai.com",
        goal: "Improve SEO workflow and multilingual publishing",
        details: "Tell us what should improve in the current content, design, or workflow setup.",
      },
      submit: "Send project details",
      success: "Your request was sent to Aether.",
      error: "The request could not be sent right now.",
      helper: "This message goes to the Aether team Discord webhook with your selected website language.",
    },
  },
  es: {
    nav: {
      platform: "Plataforma",
      workflow: "Flujo",
      blog: "Blog",
      plans: "Planes",
      faq: "FAQ",
      signIn: "Iniciar sesion",
      explorePlans: "Ver planes",
    },
    hero: {
      badge: "Sistema operativo para flujo SEO",
      title: "Haz que el SEO se sienta como un producto, no como tareas desconectadas",
      body: "Aether le da a tu startup un espacio elegante para planificar contenido, ejecutar auditorias, seguir el progreso y lanzar trabajo SEO con mas confianza.",
      primaryCta: "Comenzar",
      workflowCta: "Ver flujo",
      platformCta: "Explorar plataforma",
    },
    heroSignals: [
      { title: "Auditar", body: "Ejecuta revisiones tecnicas y muestra primero los cambios que importan." },
      { title: "Generar", body: "Convierte ideas en borradores estructurados y tareas de optimizacion." },
      { title: "Medir", body: "Mantiene un registro limpio de cambios, historial y resultados del espacio." },
    ],
    trustBar: [
      "Planificacion por intencion",
      "Produccion asistida por IA",
      "Visibilidad SEO tecnica",
      "Historial persistente",
    ],
    platform: {
      eyebrow: "Plataforma",
      title: "Mas rica que una promesa de landing, mas clara que una suite SEO generica",
      body: "La historia del producto se mantiene especifica: Aether ayuda a pasar de la estrategia a la publicacion sin perder contexto.",
      modules: [
        {
          eyebrow: "Capa de intencion",
          title: "Da forma a la estrategia antes de que la IA escriba",
          body: "Agrupa oportunidades por tema e intencion para que el resultado apoye una estrategia real de busqueda.",
        },
        {
          eyebrow: "Motor de contenido",
          title: "Genera trabajo que tu equipo si puede publicar",
          body: "Crea borradores, mejora estructura y mantiene una direccion editorial consistente dentro del flujo.",
        },
        {
          eyebrow: "Superficie de auditoria",
          title: "Detecta riesgos tecnicos sin abrir cinco herramientas",
          body: "Identifica problemas de rastreo, metadatos debiles y cuellos de botella de paginas desde un panel accionable.",
        },
        {
          eyebrow: "Feed historico",
          title: "Sigue lo que cambio y lo que se publico",
          body: "Guarda trabajo generado, auditorias y decisiones en una linea de tiempo compartida.",
        },
      ],
    },
    workflow: {
      eyebrow: "Flujo",
      title: "Una experiencia mas deliberada desde el primer clic hasta la ejecucion",
      body: "La pagina explica como funciona el producto despues del acceso, no solo lo que promete.",
      checklist: [
        "El usuario entra con Google, Apple o enlace por correo",
        "El telefono se guarda para verificacion posterior",
        "El plan define el espacio al que entra",
        "El dashboard carga solo datos del usuario autenticado",
      ],
      steps: [
        { step: "01", title: "Definir el objetivo", body: "Define sitio, tema y prioridad de negocio para comenzar con una meta clara." },
        { step: "02", title: "Generar el plan", body: "Aether convierte tus entradas en oportunidades de contenido y tareas SEO." },
        { step: "03", title: "Refinar y ejecutar", body: "Usa el espacio para producir borradores, escanear paginas y avanzar lo correcto." },
        { step: "04", title: "Mantener el ciclo", body: "Guarda historial, compara resultados y mejora sin reiniciar desde cero." },
      ],
    },
    blog: {
      eyebrow: "Blog corporativo",
      title: "Publica una capa editorial mas fuerte para tu propio sitio",
      body: "El blog publico esta pensado para tu marca, no para la salida generada por el usuario final.",
      cta: "Abrir blog",
    },
    plans: {
      free: {
        eyebrow: "Inicial",
        title: "Espacio gratis",
        body: "Ideal para configurar por primera vez y validar el flujo antes de necesitar mayor volumen.",
        features: [
          "Acceso con correo, Google y Apple",
          "Perfil guardado",
          "Dashboard inicial",
          "Flujo base de auditoria y contenido",
        ],
        cta: "Elegir gratis",
      },
      paid: {
        eyebrow: "Pro",
        title: "Espacio de pago",
        body: "Para equipos que quieren una superficie operativa mas seria, con mayor volumen y seguimiento.",
        features: [
          "Dashboard expandido",
          "Mayor capacidad de contenido y auditorias",
          "Mejor ritmo de reportes",
          "Soporte para operaciones SEO continuas",
        ],
        cta: "Elegir pago",
      },
    },
    faq: {
      eyebrow: "FAQ",
      title: "Preguntas que la gente hace antes de confiar en el producto",
      body: "Estas respuestas hacen que el flujo de acceso, datos y plan sea mas facil de entender.",
      items: [
        {
          question: "Esta pensado para founders o equipos SEO?",
          answer: "Para ambos. El flujo es simple para un founder y solido para un equipo pequeno de marketing o contenido.",
        },
        {
          question: "Que pasa despues de iniciar sesion?",
          answer: "El usuario elige plan una vez y luego el dashboard carga desde sus propios datos del workspace.",
        },
        {
          question: "Puedo empezar gratis y subir despues?",
          answer: "Si. El espacio sigue ligado a la cuenta incluso cuando cambias el plan.",
        },
      ],
    },
    cta: {
      eyebrow: "Listo para comenzar",
      title: "Mas energia y mas claridad en la primera experiencia",
      body: "La pagina debe sentirse viva, especifica y premium mientras empuja al usuario hacia el acceso y el plan.",
      primary: "Continuar al acceso",
      secondary: "Volver a plataforma",
    },
    contact: {
      eyebrow: "Contacto",
      title: "Cuentanos como Aether debe ayudar a tu flujo",
      body: "Si quieres un sistema SEO mas claro, una base de blog mas fuerte o una configuracion multilenguaje mejor, deja aqui el brief.",
      fields: {
        name: "Nombre completo",
        email: "Correo electronico",
        company: "Empresa o sitio web",
        goal: "Objetivo principal",
        details: "Detalles del proyecto",
      },
      placeholders: {
        name: "Rahul Patel",
        email: "rahul@company.com",
        company: "aetherai.com",
        goal: "Mejorar flujo SEO y publicacion multilenguaje",
        details: "Cuéntanos que debe mejorar en contenido, diseno o flujo.",
      },
      submit: "Enviar detalles",
      success: "Tu solicitud fue enviada a Aether.",
      error: "La solicitud no pudo enviarse ahora mismo.",
      helper: "Este mensaje va al webhook de Discord del equipo de Aether con el idioma seleccionado.",
    },
  },
  fr: {
    nav: {
      platform: "Plateforme",
      workflow: "Parcours",
      blog: "Blog",
      plans: "Offres",
      faq: "FAQ",
      signIn: "Connexion",
      explorePlans: "Voir les offres",
    },
    hero: {
      badge: "Systeme operatif pour le flux SEO",
      title: "Faites du SEO un produit clair, pas une pile de taches dispersees",
      body: "Aether donne a votre startup un espace elegant pour planifier le contenu, lancer des audits, suivre les progres et publier un travail SEO plus solide.",
      primaryCta: "Commencer",
      workflowCta: "Voir le parcours",
      platformCta: "Explorer la plateforme",
    },
    heroSignals: [
      { title: "Auditer", body: "Lancez des revues techniques et faites ressortir les corrections prioritaires." },
      { title: "Generer", body: "Transformez les idees en brouillons structures et taches d'optimisation." },
      { title: "Mesurer", body: "Gardez un historique propre des changements et des resultats." },
    ],
    trustBar: [
      "Planification par intention",
      "Production assistee par IA",
      "Visibilite SEO technique",
      "Historique persistant",
    ],
    platform: {
      eyebrow: "Plateforme",
      title: "Plus precise qu'une promesse marketing, plus claire qu'une suite SEO generique",
      body: "Aether aide les equipes a passer de la planification a la publication sans perdre la strategie ni le contexte.",
      modules: [
        {
          eyebrow: "Couche d'intention",
          title: "Structurer la strategie avant que le modele n'ecrive",
          body: "Classez les opportunites par sujet et intention pour que la sortie soutienne une vraie strategie de recherche.",
        },
        {
          eyebrow: "Moteur de contenu",
          title: "Generer un travail que l'equipe peut vraiment publier",
          body: "Creez des brouillons, affinez la structure et gardez une direction editoriale coherente.",
        },
        {
          eyebrow: "Surface d'audit",
          title: "Voir les risques techniques sans ouvrir plusieurs outils",
          body: "Reperez les problemes de crawl, de metadata et de performance depuis un tableau clair.",
        },
        {
          eyebrow: "Flux historique",
          title: "Suivre ce qui a change et ce qui a ete publie",
          body: "Conservez contenus, audits et decisions dans une chronologie partagee.",
        },
      ],
    },
    workflow: {
      eyebrow: "Parcours",
      title: "Une experience plus intentionnelle du premier clic a l'execution",
      body: "La page explique comment le produit agit apres connexion, pas seulement ce qu'il promet.",
      checklist: [
        "Connexion avec Google, Apple ou lien email",
        "Le telephone est garde pour une verification future",
        "Le choix d'offre determine l'espace de travail",
        "Le dashboard charge uniquement les donnees de l'utilisateur",
      ],
      steps: [
        { step: "01", title: "Definir l'objectif", body: "Cadrez le site, le theme et la priorite business avant toute execution." },
        { step: "02", title: "Generer le plan", body: "Aether transforme vos entrees en opportunites de contenu et taches SEO." },
        { step: "03", title: "Affiner et executer", body: "Produisez des brouillons, lancez des audits et faites avancer les bons items." },
        { step: "04", title: "Maintenir la boucle", body: "Conservez l'historique et continuez a ameliorer sans repartir de zero." },
      ],
    },
    blog: {
      eyebrow: "Blog de la marque",
      title: "Publiez une couche editoriale plus forte pour votre propre site",
      body: "Le blog public est destine a votre marque, pas a la sortie generee pour l'utilisateur final.",
      cta: "Ouvrir le blog",
    },
    plans: {
      free: {
        eyebrow: "Starter",
        title: "Espace gratuit",
        body: "Parfait pour une premiere configuration et une validation du flux avant une cadence plus soutenue.",
        features: [
          "Connexion email, Google et Apple",
          "Profil enregistre",
          "Dashboard starter",
          "Flux principal audit et contenu",
        ],
        cta: "Choisir gratuit",
      },
      paid: {
        eyebrow: "Pro",
        title: "Espace payant",
        body: "Pour les equipes qui veulent plus de volume, plus de suivi et une operation SEO plus solide.",
        features: [
          "Surface dashboard etendue",
          "Plus de capacite de contenu et d'audit",
          "Meilleur rythme de reporting",
          "Support des operations SEO continues",
        ],
        cta: "Choisir payant",
      },
    },
    faq: {
      eyebrow: "FAQ",
      title: "Les questions que les utilisateurs posent avant de faire confiance",
      body: "Ces reponses rendent le flux d'authentification, de donnees et d'offres plus clair.",
      items: [
        {
          question: "Est-ce pour les fondateurs ou les equipes SEO ?",
          answer: "Pour les deux. Le parcours reste simple pour un fondateur et assez solide pour une petite equipe marketing.",
        },
        {
          question: "Que se passe-t-il apres connexion ?",
          answer: "L'utilisateur choisit une offre une fois, puis le dashboard charge ses propres donnees du workspace.",
        },
        {
          question: "Peut-on commencer gratuitement et evoluer ensuite ?",
          answer: "Oui. L'espace reste lie au compte meme si l'offre change plus tard.",
        },
      ],
    },
    cta: {
      eyebrow: "Pret a commencer",
      title: "Plus d'energie et plus de clarte dans la premiere experience",
      body: "La page doit sembler vivante, plus premium et plus precise tout en guidant vers l'inscription.",
      primary: "Continuer vers l'auth",
      secondary: "Revoir la plateforme",
    },
    contact: {
      eyebrow: "Contact",
      title: "Dites-nous comment Aether doit aider votre workflow",
      body: "Si vous voulez un systeme SEO plus net, une base de blog plus forte ou une meilleure configuration multilingue, envoyez le brief ici.",
      fields: {
        name: "Nom complet",
        email: "Adresse email",
        company: "Entreprise ou site",
        goal: "Objectif principal",
        details: "Details du projet",
      },
      placeholders: {
        name: "Rahul Patel",
        email: "rahul@company.com",
        company: "aetherai.com",
        goal: "Ameliorer le workflow SEO et la publication multilingue",
        details: "Expliquez ce qui doit s'ameliorer dans le contenu, le design ou le workflow.",
      },
      submit: "Envoyer les details",
      success: "Votre demande a ete envoyee a Aether.",
      error: "La demande n'a pas pu etre envoyee pour le moment.",
      helper: "Ce message est envoye au webhook Discord de l'equipe Aether avec la langue selectionnee.",
    },
  },
  hi: {
    nav: {
      platform: "Platform",
      workflow: "Workflow",
      blog: "Blog",
      plans: "Plans",
      faq: "FAQ",
      signIn: "Sign In",
      explorePlans: "Plans dekho",
    },
    hero: {
      badge: "SEO workflow operating system",
      title: "SEO ko product jaisa banao, disconnected tasks ka pile nahin",
      body: "Aether aapki startup ko ek elegant workspace deta hai jahan content plan, audits, progress tracking aur confident SEO execution ek hi jagah hota hai.",
      primaryCta: "Start onboarding",
      workflowCta: "Workflow dekho",
      platformCta: "Platform dekho",
    },
    heroSignals: [
      { title: "Audit", body: "Technical review chalao aur sabse important fixes ko pehle dekho." },
      { title: "Generate", body: "Ideas ko structured drafts aur optimization tasks me badlo." },
      { title: "Measure", body: "Changes, history aur workspace outcome ka clean record rakho." },
    ],
    trustBar: [
      "Intent-first planning",
      "AI-assisted production",
      "Technical SEO visibility",
      "Persistent workspace history",
    ],
    platform: {
      eyebrow: "Platform",
      title: "Landing promise se zyada rich, generic SEO suite se zyada clear",
      body: "Aether strategy, production aur reporting ko ek hi system me rakhta hai taki team planning se publishing tak context na khoye.",
      modules: [
        {
          eyebrow: "Intent Layer",
          title: "Model likhne se pehle strategy shape karo",
          body: "Topic aur intent ke basis par opportunities ko organize karo taki output real search strategy ko support kare.",
        },
        {
          eyebrow: "Content Engine",
          title: "Aisa content banao jo team waqai publish kar sake",
          body: "Draft banao, structure refine karo aur editorial direction ko ek guided flow me rakho.",
        },
        {
          eyebrow: "Audit Surface",
          title: "Paanch tools khole bina technical risk pakdo",
          body: "Crawl issues, weak metadata aur page bottlenecks ko ek focused dashboard se identify karo.",
        },
        {
          eyebrow: "History Feed",
          title: "Kya change hua aur kya ship hua uska track rakho",
          body: "Generated work, audits aur decisions ko shared timeline me store karo.",
        },
      ],
    },
    workflow: {
      eyebrow: "Workflow",
      title: "First click se execution tak zyada intentional experience",
      body: "Page ye clear karti hai ki sign-in ke baad product kaise behave karta hai.",
      checklist: [
        "User Google, Apple ya email link se sign in karta hai",
        "Phone baad ki verification ke liye store hota hai",
        "Plan choice workspace decide karti hai",
        "Dashboard sirf us user ka workspace data load karta hai",
      ],
      steps: [
        { step: "01", title: "Goal define karo", body: "Site, theme aur business priority clear karo taki har run ka target clean ho." },
        { step: "02", title: "Workplan banao", body: "Aether inputs ko content opportunities aur SEO actions me convert karta hai." },
        { step: "03", title: "Refine aur execute karo", body: "Drafts banao, audits run karo aur sahi items ko aage badhao." },
        { step: "04", title: "Loop ko alive rakho", body: "History save karo, results compare karo aur zero se restart mat karo." },
      ],
    },
    blog: {
      eyebrow: "Company Blog",
      title: "Apni website ke liye strong editorial layer publish karo",
      body: "Public blog aapki brand website ke liye hai, end user ke AI output ke liye nahin.",
      cta: "Blog hub kholo",
    },
    plans: {
      free: {
        eyebrow: "Starter",
        title: "Free workspace",
        body: "Pehli setup aur lean usage ke liye best, jab tak aapko heavy reporting cadence ki zarurat na ho.",
        features: [
          "Email, Google aur Apple sign-in",
          "Saved workspace profile",
          "Starter dashboard",
          "Core audit aur content flow",
        ],
        cta: "Free chuno",
      },
      paid: {
        eyebrow: "Pro",
        title: "Paid workspace",
        body: "Un teams ke liye jo zyada volume, stronger tracking aur richer daily workflow chahte hain.",
        features: [
          "Expanded dashboard surface",
          "Higher content aur audit throughput",
          "Better reporting rhythm",
          "Ongoing SEO operations support",
        ],
        cta: "Paid chuno",
      },
    },
    faq: {
      eyebrow: "FAQ",
      title: "Wahi sawal jo log trust karne se pehle poochte hain",
      body: "Ye answers auth, data aur plan flow ko turant clear banate hain.",
      items: [
        {
          question: "Kya ye founders ke liye hai ya SEO team ke liye?",
          answer: "Dono ke liye. Flow founder-friendly hai, lekin small marketing ya content team ke liye bhi strong hai.",
        },
        {
          question: "Sign in ke baad kya hota hai?",
          answer: "User ek baar free ya paid choose karta hai, uske baad dashboard uske khud ke workspace data se load hota hai.",
        },
        {
          question: "Kya main free se start karke later upgrade kar sakta hun?",
          answer: "Haan. Workspace account se linked rehta hai, plan badalne par bhi data lose nahin hota.",
        },
      ],
    },
    cta: {
      eyebrow: "Ready to begin",
      title: "First experience me zyada energy aur zyada clarity lao",
      body: "Landing page ko alive, specific aur premium feel deni chahiye, saath hi user ko signup flow tak push karna chahiye.",
      primary: "Auth par jao",
      secondary: "Platform story dekho",
    },
    contact: {
      eyebrow: "Contact",
      title: "Batayein Aether aapke workflow ko kaise improve kare",
      body: "Agar aapko sharper SEO operating system, better blog foundation ya stronger multilingual setup chahiye, yahan brief bhejo.",
      fields: {
        name: "Full name",
        email: "Email address",
        company: "Company ya website",
        goal: "Primary goal",
        details: "Project details",
      },
      placeholders: {
        name: "Rahul Patel",
        email: "rahul@company.com",
        company: "aetherai.com",
        goal: "SEO workflow aur multilingual publishing improve karna",
        details: "Batayein content, design ya workflow setup me kya improve karna hai.",
      },
      submit: "Project details bhejo",
      success: "Aapki request Aether ko bhej di gayi.",
      error: "Request abhi send nahin ho payi.",
      helper: "Ye message Aether team ke Discord webhook par selected website language ke saath jata hai.",
    },
  },
};

export const authCopy: Record<SiteLanguage, AuthCopy> = {
  en: {
    badge: "Auth and workspace setup",
    title: "Enter Aether and choose the workspace that fits your growth stage",
    body: "Sign in with Google or email link. For Google access, enter a phone number and verify it with a Firebase OTP before your workspace opens.",
    bullets: [
      "Google sign-in with required phone OTP verification",
      "Passwordless email-link access",
      "Selectable free or paid workspace before auth",
      "Dashboard data isolated per signed-in user",
    ],
    selectedWorkspace: "Selected workspace",
    activeChoice: "Active choice",
    freeWorkspace: "Free workspace",
    paidWorkspace: "Paid workspace",
    freeWorkspaceBody: "Start with the core workflow, a lighter dashboard surface, and a clean starter setup.",
    paidWorkspaceBody: "Unlock the richer workspace with broader usage, deeper reporting, and stronger operational flow.",
    welcomeEyebrow: "Welcome back",
    welcomeTitle: "Secure access",
    googleButton: "Continue with Google",
    emailDivider: "Email Link Access",
    emailLabel: "Email address",
    phoneLabel: "Phone number for required Google OTP verification",
    smsNotice: "SMS verification may apply standard carrier rates.",
    otpLabel: "Verification code",
    emailPlaceholder: "name@company.com",
    phonePlaceholder: "+1 555 000 0000",
    otpPlaceholder: "Enter the 6-digit OTP",
    sendOtpButton: "Send OTP code",
    resendOtpButton: "Resend OTP code",
    verifyOtpButton: "Verify OTP",
    sendLinkButton: "Send sign-in link",
    chooseWorkspace: "Choose workspace tier",
    selectableBeforeSignin: "Selectable before sign-in",
    selectedLabel: "Selected",
    chooseLabel: "Tap to choose",
    backHome: "Back to home",
    status: {
      initial: "Pick a workspace tier, add your phone number, then continue with Google or email link.",
      needPhone: "Enter your phone number before continuing with Google.",
      invalidPhone: "Enter a valid phone number in international format, for example +15550000000.",
      needEmail: "Enter your email address first.",
      sendingLink: "Sending your secure sign-in link...",
      linkSent: "Sign-in link sent. Check your inbox and open it in the same browser.",
      linkFailed: "Unable to send sign-in link right now. Try again.",
      reconnectBrowser: "Please request a new sign-in link from this browser.",
      signingInEmail: "Signing in with email link...",
      linkExpired: "This email link is invalid or expired. Send a fresh one.",
      connectingGoogle: "Connecting with Google...",
      googleFailed: "Google sign in failed. Try again.",
      verifyPhoneToContinue: "Google sign-in is almost done. Verify your phone number with the OTP to continue.",
      sendingOtp: "Sending your verification code...",
      otpSent: "Verification code sent. Enter the OTP from your phone.",
      otpFailed: "We could not send the phone verification code. Try again.",
      needOtp: "Enter the OTP from your phone.",
      verifyingOtp: "Verifying your OTP...",
      otpVerifyFailed: "We could not verify that OTP. Try again.",
      creatingWorkspace: (plan) => `Creating your ${plan} workspace...`,
      workspaceReady: "Workspace ready. Redirecting to your dashboard.",
      workspaceSelected: (plan) => `${plan} workspace selected. Continue with Google or email link.`,
      workspaceSaveFailed: "We could not save the selected workspace. Try again.",
      completePhoneVerificationFirst: "Verify your phone number first to finish Google sign-in.",
      signInFinishFailed: "We could not finish sign-in. Try again.",
      welcomeBack: "Welcome back. Redirecting to your dashboard.",
    },
  },
  es: {
    badge: "Acceso y configuracion",
    title: "Entra a Aether y elige el espacio que mejor se adapte a tu etapa",
    body: "Accede con Google o enlace por correo. Para Google debes introducir tu telefono y verificarlo con un OTP de Firebase antes de entrar.",
    bullets: [
      "Acceso con Google y OTP obligatorio en telefono",
      "Acceso por enlace de correo sin password",
      "Plan gratis o pago antes del acceso",
      "Datos separados por usuario autenticado",
    ],
    selectedWorkspace: "Espacio seleccionado",
    activeChoice: "Eleccion activa",
    freeWorkspace: "Espacio gratis",
    paidWorkspace: "Espacio de pago",
    freeWorkspaceBody: "Empieza con el flujo principal y una superficie de dashboard mas ligera.",
    paidWorkspaceBody: "Desbloquea un espacio mas rico con mayor uso y reportes mas profundos.",
    welcomeEyebrow: "Bienvenido",
    welcomeTitle: "Acceso seguro",
    googleButton: "Continuar con Google",
    emailDivider: "Acceso por enlace de correo",
    emailLabel: "Correo electronico",
    phoneLabel: "Telefono para verificacion OTP obligatoria con Google",
    smsNotice: "La verificacion por SMS puede aplicar tarifas normales del operador.",
    otpLabel: "Codigo de verificacion",
    emailPlaceholder: "nombre@empresa.com",
    phonePlaceholder: "+34 600 000 000",
    otpPlaceholder: "Introduce el OTP de 6 digitos",
    sendOtpButton: "Enviar codigo OTP",
    resendOtpButton: "Reenviar codigo OTP",
    verifyOtpButton: "Verificar OTP",
    sendLinkButton: "Enviar enlace de acceso",
    chooseWorkspace: "Elegir tipo de espacio",
    selectableBeforeSignin: "Se puede elegir antes de entrar",
    selectedLabel: "Seleccionado",
    chooseLabel: "Toca para elegir",
    backHome: "Volver al inicio",
    status: {
      initial: "Elige un plan, anade tu telefono y luego continua con Google o enlace por correo.",
      needPhone: "Primero introduce tu telefono para continuar con Google.",
      invalidPhone: "Introduce un telefono valido en formato internacional, por ejemplo +34600000000.",
      needEmail: "Primero introduce tu correo.",
      sendingLink: "Enviando tu enlace seguro...",
      linkSent: "Enlace enviado. Revisa tu correo y abrelo en el mismo navegador.",
      linkFailed: "No fue posible enviar el enlace ahora mismo.",
      reconnectBrowser: "Solicita un nuevo enlace desde este navegador.",
      signingInEmail: "Accediendo con enlace de correo...",
      linkExpired: "El enlace es invalido o ha expirado. Envia uno nuevo.",
      connectingGoogle: "Conectando con Google...",
      googleFailed: "El acceso con Google fallo. Intenta de nuevo.",
      verifyPhoneToContinue: "El acceso con Google casi esta listo. Verifica tu telefono con el OTP para continuar.",
      sendingOtp: "Enviando tu codigo de verificacion...",
      otpSent: "Codigo enviado. Introduce el OTP que recibiste en tu telefono.",
      otpFailed: "No fue posible enviar el codigo OTP. Intenta otra vez.",
      needOtp: "Introduce el OTP de tu telefono.",
      verifyingOtp: "Verificando tu OTP...",
      otpVerifyFailed: "No pudimos verificar ese OTP. Intenta otra vez.",
      creatingWorkspace: (plan) => `Creando tu espacio ${plan}...`,
      workspaceReady: "Espacio listo. Redirigiendo al dashboard.",
      workspaceSelected: (plan) => `Espacio ${plan} seleccionado. Continua con Google o enlace por correo.`,
      workspaceSaveFailed: "No fue posible guardar el espacio elegido.",
      completePhoneVerificationFirst: "Verifica tu telefono primero para terminar el acceso con Google.",
      signInFinishFailed: "No pudimos completar el acceso.",
      welcomeBack: "Bienvenido de nuevo. Redirigiendo al dashboard.",
    },
  },
  fr: {
    badge: "Auth et configuration",
    title: "Entrez dans Aether et choisissez l'espace adapte a votre stade de croissance",
    body: "Connectez-vous avec Google ou lien email. Pour Google, saisissez votre telephone et verifiez-le avec un OTP Firebase avant d'ouvrir l'espace.",
    bullets: [
      "Connexion Google avec verification OTP obligatoire",
      "Connexion sans mot de passe par lien email",
      "Choix gratuit ou payant avant auth",
      "Donnees isolees par utilisateur connecte",
    ],
    selectedWorkspace: "Espace selectionne",
    activeChoice: "Choix actif",
    freeWorkspace: "Espace gratuit",
    paidWorkspace: "Espace payant",
    freeWorkspaceBody: "Commencez avec le flux principal et une surface plus legere.",
    paidWorkspaceBody: "Debloquez un espace plus riche avec plus d'usage et de reporting.",
    welcomeEyebrow: "Bon retour",
    welcomeTitle: "Acces securise",
    googleButton: "Continuer avec Google",
    emailDivider: "Acces par lien email",
    emailLabel: "Adresse email",
    phoneLabel: "Telephone pour verification OTP obligatoire avec Google",
    smsNotice: "La verification par SMS peut entrainer les frais standards de votre operateur.",
    otpLabel: "Code de verification",
    emailPlaceholder: "nom@entreprise.com",
    phonePlaceholder: "+33 6 00 00 00 00",
    otpPlaceholder: "Entrez le code OTP a 6 chiffres",
    sendOtpButton: "Envoyer le code OTP",
    resendOtpButton: "Renvoyer le code OTP",
    verifyOtpButton: "Verifier OTP",
    sendLinkButton: "Envoyer le lien de connexion",
    chooseWorkspace: "Choisir l'offre",
    selectableBeforeSignin: "Choix possible avant la connexion",
    selectedLabel: "Selectionne",
    chooseLabel: "Cliquer pour choisir",
    backHome: "Retour a l'accueil",
    status: {
      initial: "Choisissez une offre, ajoutez votre telephone, puis continuez avec Google ou lien email.",
      needPhone: "Entrez votre numero de telephone avant de continuer avec Google.",
      invalidPhone: "Entrez un numero valide au format international, par exemple +33600000000.",
      needEmail: "Entrez votre email d'abord.",
      sendingLink: "Envoi de votre lien securise...",
      linkSent: "Lien envoye. Ouvrez-le dans le meme navigateur.",
      linkFailed: "Impossible d'envoyer le lien pour le moment.",
      reconnectBrowser: "Veuillez demander un nouveau lien depuis ce navigateur.",
      signingInEmail: "Connexion avec lien email...",
      linkExpired: "Le lien est invalide ou expire.",
      connectingGoogle: "Connexion a Google...",
      googleFailed: "La connexion Google a echoue.",
      verifyPhoneToContinue: "La connexion Google est presque terminee. Verifiez votre telephone avec le code OTP pour continuer.",
      sendingOtp: "Envoi de votre code de verification...",
      otpSent: "Code envoye. Saisissez le code OTP recu sur votre telephone.",
      otpFailed: "Impossible d'envoyer le code OTP pour le moment.",
      needOtp: "Entrez le code OTP recu sur votre telephone.",
      verifyingOtp: "Verification de votre OTP...",
      otpVerifyFailed: "Impossible de verifier ce code OTP. Reessayez.",
      creatingWorkspace: (plan) => `Creation de votre espace ${plan}...`,
      workspaceReady: "Espace pret. Redirection vers le dashboard.",
      workspaceSelected: (plan) => `Espace ${plan} selectionne. Continuez avec Google ou lien email.`,
      workspaceSaveFailed: "Impossible d'enregistrer l'espace choisi.",
      completePhoneVerificationFirst: "Verifiez votre telephone d'abord pour terminer la connexion Google.",
      signInFinishFailed: "Nous n'avons pas pu terminer la connexion.",
      welcomeBack: "Bon retour. Redirection vers votre dashboard.",
    },
  },
  hi: {
    badge: "Auth aur workspace setup",
    title: "Aether me enter karo aur apne growth stage ke hisab se workspace chuno",
    body: "Google ya email link se sign in karo. Google access ke liye phone number enter karke Firebase OTP se verify karna zaroori hai.",
    bullets: [
      "Google sign-in ke saath mandatory phone OTP verification",
      "Passwordless email-link access",
      "Auth se pehle free ya paid choose karo",
      "Dashboard data har user ke liye alag hai",
    ],
    selectedWorkspace: "Selected workspace",
    activeChoice: "Active choice",
    freeWorkspace: "Free workspace",
    paidWorkspace: "Paid workspace",
    freeWorkspaceBody: "Core workflow, lighter dashboard aur clean starter setup se start karo.",
    paidWorkspaceBody: "Broader usage, deeper reporting aur stronger flow ke saath richer workspace unlock karo.",
    welcomeEyebrow: "Welcome back",
    welcomeTitle: "Secure access",
    googleButton: "Google ke saath continue karo",
    emailDivider: "Email link access",
    emailLabel: "Email address",
    phoneLabel: "Google OTP verification ke liye phone number",
    smsNotice: "SMS verification par standard carrier charges lag sakte hain.",
    otpLabel: "Verification code",
    emailPlaceholder: "name@company.com",
    phonePlaceholder: "+91 98765 43210",
    otpPlaceholder: "6-digit OTP enter karo",
    sendOtpButton: "OTP code bhejo",
    resendOtpButton: "OTP code dobara bhejo",
    verifyOtpButton: "OTP verify karo",
    sendLinkButton: "Sign-in link bhejo",
    chooseWorkspace: "Workspace tier choose karo",
    selectableBeforeSignin: "Sign-in se pehle choose ho sakta hai",
    selectedLabel: "Selected",
    chooseLabel: "Choose karne ke liye tap karo",
    backHome: "Back to home",
    status: {
      initial: "Workspace tier choose karo, phone number add karo, phir Google ya email link se continue karo.",
      needPhone: "Google se continue karne se pehle phone number enter karo.",
      invalidPhone: "Valid international format me phone number enter karo, jaise +919876543210.",
      needEmail: "Pehle apna email enter karo.",
      sendingLink: "Secure sign-in link bheja ja raha hai...",
      linkSent: "Link bhej diya gaya. Inbox check karo aur same browser me open karo.",
      linkFailed: "Abhi sign-in link send nahin ho paya.",
      reconnectBrowser: "Isi browser se naya sign-in link request karo.",
      signingInEmail: "Email link se sign in ho raha hai...",
      linkExpired: "Ye email link invalid ya expired hai.",
      connectingGoogle: "Google se connect ho raha hai...",
      googleFailed: "Google sign in fail ho gaya.",
      verifyPhoneToContinue: "Google sign-in lagbhag ready hai. Continue karne ke liye phone OTP verify karo.",
      sendingOtp: "Aapka verification code bheja ja raha hai...",
      otpSent: "Verification code bhej diya gaya. Phone par aaya OTP enter karo.",
      otpFailed: "Phone verification code abhi send nahin ho paya. Dobara try karo.",
      needOtp: "Phone par aaya OTP enter karo.",
      verifyingOtp: "OTP verify ho raha hai...",
      otpVerifyFailed: "Ye OTP verify nahin ho paya. Dobara try karo.",
      creatingWorkspace: (plan) => `Aapka ${plan} workspace create ho raha hai...`,
      workspaceReady: "Workspace ready hai. Dashboard par redirect ho raha hai.",
      workspaceSelected: (plan) => `${plan} workspace select ho gaya. Ab Google ya email link se continue karo.`,
      workspaceSaveFailed: "Selected workspace save nahin ho paya.",
      completePhoneVerificationFirst: "Google sign-in finish karne ke liye pehle phone verify karo.",
      signInFinishFailed: "Sign-in complete nahin ho paya.",
      welcomeBack: "Welcome back. Dashboard par redirect ho raha hai.",
    },
  },
};

export const shellCopy: Record<SiteLanguage, ShellCopy> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      analytics: "Analytics",
      aiAssistant: "AI Assistant",
      plagiarismCheck: "Plagiarism Check",
      generateBlog: "Generate Blog",
      websiteAudit: "Website Audit",
      history: "History",
      billing: "Billing",
      settings: "Settings",
    },
    loading: "Loading workspace...",
    premiumWorkspace: "Premium Workspace",
    starterWorkspace: "Starter Workspace",
    paidWorkspace: "Paid Workspace",
    searchPlaceholder: "Search analytics, posts, and workspace actions...",
    alerts: "Alerts",
    billingSettings: "Billing settings",
    upgradeToPro: "Upgrade to Pro",
    quickSearch: "Quick Search",
    newAction: "New Action",
    aiAssistant: "AI Assistant",
    footer: "Aether SEO. All rights reserved.",
  },
  es: {
    nav: {
      dashboard: "Dashboard",
      analytics: "Analitica",
      aiAssistant: "Asistente IA",
      plagiarismCheck: "Revision de plagio",
      generateBlog: "Generar blog",
      websiteAudit: "Auditoria web",
      history: "Historial",
      billing: "Facturacion",
      settings: "Configuracion",
    },
    loading: "Cargando espacio...",
    premiumWorkspace: "Espacio premium",
    starterWorkspace: "Espacio inicial",
    paidWorkspace: "Espacio de pago",
    searchPlaceholder: "Buscar analitica, posts y acciones...",
    alerts: "Alertas",
    billingSettings: "Ajustes de facturacion",
    upgradeToPro: "Subir a Pro",
    quickSearch: "Busqueda rapida",
    newAction: "Nueva accion",
    aiAssistant: "Asistente IA",
    footer: "Aether SEO. Todos los derechos reservados.",
  },
  fr: {
    nav: {
      dashboard: "Dashboard",
      analytics: "Analytique",
      aiAssistant: "Assistant IA",
      plagiarismCheck: "Controle de plagiat",
      generateBlog: "Generer un blog",
      websiteAudit: "Audit web",
      history: "Historique",
      billing: "Facturation",
      settings: "Parametres",
    },
    loading: "Chargement de l'espace...",
    premiumWorkspace: "Espace premium",
    starterWorkspace: "Espace starter",
    paidWorkspace: "Espace payant",
    searchPlaceholder: "Rechercher analytics, posts et actions...",
    alerts: "Alertes",
    billingSettings: "Parametres de facturation",
    upgradeToPro: "Passer en Pro",
    quickSearch: "Recherche rapide",
    newAction: "Nouvelle action",
    aiAssistant: "Assistant IA",
    footer: "Aether SEO. Tous droits reserves.",
  },
  hi: {
    nav: {
      dashboard: "Dashboard",
      analytics: "Analytics",
      aiAssistant: "AI assistant",
      plagiarismCheck: "Plagiarism check",
      generateBlog: "Blog generate karo",
      websiteAudit: "Website audit",
      history: "History",
      billing: "Billing",
      settings: "Settings",
    },
    loading: "Workspace load ho raha hai...",
    premiumWorkspace: "Premium workspace",
    starterWorkspace: "Starter workspace",
    paidWorkspace: "Paid workspace",
    searchPlaceholder: "Analytics, posts aur actions search karo...",
    alerts: "Alerts",
    billingSettings: "Billing settings",
    upgradeToPro: "Pro par jao",
    quickSearch: "Quick search",
    newAction: "New action",
    aiAssistant: "AI assistant",
    footer: "Aether SEO. Sabhi adhikar surakshit.",
  },
};

export const blogWorkspaceCopy: Record<SiteLanguage, BlogWorkspaceCopy> = {
  en: {
    title: "Generate Blog",
    body: "Craft SEO-optimized articles with editorial precision and a selectable output language.",
    keywordLabel: "Focus Keyword",
    toneLabel: "Content Tone",
    lengthLabel: "Article Length",
    languageLabel: "Output Language",
    generateButton: "Generate Blog",
    lengths: ["Short", "Medium", "Long"],
    languageHelper: "The same language preference also affects internal blog viewing and the public company blog.",
    previewEyebrow: "Internal preview",
    previewMeta: "May 24, 2024 • 8 min read • Technology",
    titlePreview: "The Future of Content: How Generative AI is Reshaping Editorial Standards",
    paragraphs: [
      "In an era defined by rapid technological acceleration, creators use large language models to augment storytelling while preserving clarity and depth.",
    ],
    sectionTitle: "The Rise of Co-Intelligence",
    sectionBody: "AI supports synthesis, research, and first-draft generation, while human reviewers provide context, voice, and strategic editorial direction.",
    bullets: [
      "Focus on unique insights that generic datasets cannot provide.",
      "Generate multiple viewpoints, then synthesize into a coherent voice.",
      "Prioritize fact-checking and tonal consistency before publishing.",
    ],
    companyBlogLink: "Open company blog",
    companyBlogBody: "The public blog structure stays separate from generated user output and inherits the current language choice.",
  },
  es: {
    title: "Generar blog",
    body: "Crea articulos SEO con precision editorial y idioma de salida seleccionable.",
    keywordLabel: "Palabra clave",
    toneLabel: "Tono del contenido",
    lengthLabel: "Longitud del articulo",
    languageLabel: "Idioma de salida",
    generateButton: "Generar blog",
    lengths: ["Corto", "Medio", "Largo"],
    languageHelper: "La misma preferencia de idioma afecta la vista interna del blog y el blog publico.",
    previewEyebrow: "Vista interna",
    previewMeta: "24 mayo 2024 • 8 min • Tecnologia",
    titlePreview: "El futuro del contenido: como la IA generativa redefine los estandares editoriales",
    paragraphs: [
      "En una era marcada por la aceleracion tecnologica, los creadores usan modelos de lenguaje para ampliar la narracion sin perder claridad ni profundidad.",
    ],
    sectionTitle: "El auge de la co-inteligencia",
    sectionBody: "La IA ayuda en sintesis, investigacion y borradores, mientras los humanos aportan contexto, voz y direccion editorial.",
    bullets: [
      "Prioriza ideas unicas que los datos genericos no pueden ofrecer.",
      "Genera varios puntos de vista y luego sintetizalos en una sola voz.",
      "Valida los hechos y la coherencia tonal antes de publicar.",
    ],
    companyBlogLink: "Abrir blog corporativo",
    companyBlogBody: "La estructura del blog publico permanece separada de la salida generada para el usuario final.",
  },
  fr: {
    title: "Generer un blog",
    body: "Creez des articles SEO avec precision editoriale et langue de sortie selectionnable.",
    keywordLabel: "Mot-cle principal",
    toneLabel: "Ton du contenu",
    lengthLabel: "Longueur de l'article",
    languageLabel: "Langue de sortie",
    generateButton: "Generer le blog",
    lengths: ["Court", "Moyen", "Long"],
    languageHelper: "La meme preference de langue influence l'aperçu interne et le blog public.",
    previewEyebrow: "Apercu interne",
    previewMeta: "24 mai 2024 • 8 min • Technologie",
    titlePreview: "L'avenir du contenu : comment l'IA generative transforme les standards editoriaux",
    paragraphs: [
      "Dans une ere d'acceleration technologique, les createurs utilisent les modeles de langage pour enrichir la narration tout en gardant clarte et profondeur.",
    ],
    sectionTitle: "L'essor de la co-intelligence",
    sectionBody: "L'IA soutient la synthese, la recherche et le premier brouillon, tandis que l'humain apporte contexte et direction editoriale.",
    bullets: [
      "Mettez l'accent sur des idees que les donnees generiques ne peuvent pas fournir.",
      "Generez plusieurs points de vue puis fusionnez-les dans une voix coherente.",
      "Verifiez les faits et la coherence du ton avant publication.",
    ],
    companyBlogLink: "Ouvrir le blog de marque",
    companyBlogBody: "La structure du blog public reste separee du contenu genere pour l'utilisateur final.",
  },
  hi: {
    title: "Blog generate karo",
    body: "SEO-optimized articles banao editorial precision ke saath, aur output language bhi choose karo.",
    keywordLabel: "Focus keyword",
    toneLabel: "Content tone",
    lengthLabel: "Article length",
    languageLabel: "Output language",
    generateButton: "Blog generate karo",
    lengths: ["Short", "Medium", "Long"],
    languageHelper: "Yehi language preference internal blog preview aur company blog ko bhi affect karti hai.",
    previewEyebrow: "Internal preview",
    previewMeta: "24 May 2024 • 8 min read • Technology",
    titlePreview: "Content ka future: Generative AI editorial standards ko kaise reshape kar rahi hai",
    paragraphs: [
      "Tezi se badhti technology ke daur me creators large language models ka use storytelling ko support karne ke liye kar rahe hain bina clarity aur depth khoye.",
    ],
    sectionTitle: "Co-intelligence ka rise",
    sectionBody: "AI synthesis, research aur first draft generation me help karti hai, jabki human reviewers context aur voice dete hain.",
    bullets: [
      "Aise insights par focus karo jo generic datasets se nahin milte.",
      "Multiple viewpoints generate karo aur ek coherent voice me merge karo.",
      "Publish karne se pehle fact-check aur tonal consistency maintain karo.",
    ],
    companyBlogLink: "Company blog kholo",
    companyBlogBody: "Public blog structure end user ke generated output se alag rehti hai aur current language choice ko use karti hai.",
  },
};

export const blogIndexCopy: Record<SiteLanguage, BlogIndexCopy> = {
  en: {
    eyebrow: "Company Blog",
    title: "Editorial posts that strengthen the public site, not the user output stream",
    body: "This library is for your own website. It follows the same design language as the parent style, while keeping generated user content separate from branded editorial publishing.",
    viewArticle: "Read article",
    backHome: "Back to home",
  },
  es: {
    eyebrow: "Blog corporativo",
    title: "Articulos editoriales para fortalecer tu sitio publico, no la salida del usuario",
    body: "Esta biblioteca es para tu propio sitio web. Mantiene el mismo lenguaje visual mientras separa el contenido generado del contenido editorial de marca.",
    viewArticle: "Leer articulo",
    backHome: "Volver al inicio",
  },
  fr: {
    eyebrow: "Blog de marque",
    title: "Des articles editoriaux pour renforcer le site public, pas le flux genere pour l'utilisateur",
    body: "Cette bibliotheque est faite pour votre propre site. Elle conserve le meme langage de design tout en separant le contenu genere du contenu editorial de marque.",
    viewArticle: "Lire l'article",
    backHome: "Retour a l'accueil",
  },
  hi: {
    eyebrow: "Company blog",
    title: "Editorial posts jo public site ko strong banayein, user output stream ko nahin",
    body: "Ye library aapki khud ki website ke liye hai. Iska design parent style jaisa hai, lekin generated user content alag rehta hai.",
    viewArticle: "Article padho",
    backHome: "Home par wapas jao",
  },
};

const publicBlogPostsByLanguage: Record<SiteLanguage, PublicBlogPost[]> = {
  en: [
    {
      slug: "startup-seo-operating-system",
      title: "Why startups need an SEO operating system, not isolated tasks",
      excerpt: "A stronger search presence comes from systems: clear intent, repeatable publishing, and tracked decisions.",
      category: "Strategy",
      date: "April 7, 2026",
      readTime: "6 min read",
      hero: "A startup grows faster when search work is treated as an operating layer instead of an afterthought.",
      sections: [
        {
          title: "SEO work breaks when nobody owns the system",
          paragraphs: [
            "Many teams treat SEO like a series of one-off tasks. A page gets updated, a post gets published, and then momentum disappears.",
            "The stronger pattern is to create one operating layer where strategy, execution, and reporting stay connected.",
          ],
        },
        {
          title: "The first improvement is clarity",
          paragraphs: [
            "Founders and marketing teams need a clear view of what is being generated, what is being audited, and what still needs attention.",
            "That clarity improves speed and also makes the output more consistent.",
          ],
        },
        {
          title: "A public blog should support the brand story",
          paragraphs: [
            "Your company blog should strengthen your positioning and topical authority, not mirror every internal AI output.",
            "That separation keeps the public-facing editorial layer sharper and more trustworthy.",
          ],
        },
      ],
    },
    {
      slug: "multilingual-blog-foundation",
      title: "How a multilingual blog foundation improves reach and credibility",
      excerpt: "Language preference changes more than labels. It shapes trust, readability, and how users experience your content.",
      category: "Content",
      date: "April 2, 2026",
      readTime: "5 min read",
      hero: "A multilingual experience should feel intentional across the landing page, auth flow, blog request, and public editorial pages.",
      sections: [
        {
          title: "Language needs one source of truth",
          paragraphs: [
            "If users can change language in one part of the product, the rest of the site should respond with the same preference.",
            "That means the blog request form, preview, and public article view all need the same shared setting.",
          ],
        },
        {
          title: "SEO benefits when structure is clear",
          paragraphs: [
            "Search quality improves when content is grouped semantically, metadata is strong, and article layouts are consistent.",
            "A better language foundation also reduces confusion for returning visitors and team members.",
          ],
        },
      ],
    },
    {
      slug: "seo-design-patterns-that-convert",
      title: "Design patterns that help SEO pages convert without feeling generic",
      excerpt: "Better hierarchy, stronger pacing, and cleaner calls to action make search traffic more likely to turn into action.",
      category: "Design",
      date: "March 27, 2026",
      readTime: "7 min read",
      hero: "Search traffic alone is not enough. The page also has to create confidence quickly.",
      sections: [
        {
          title: "Attention has to be guided",
          paragraphs: [
            "Users decide fast whether a page feels credible. Typography, spacing, and section rhythm shape that judgment.",
            "A better design system does not just look premium. It makes next steps easier to notice and trust.",
          ],
        },
        {
          title: "Editorial pages should still feel product-aware",
          paragraphs: [
            "A strong blog layout should connect back to the product narrative instead of drifting into disconnected thought leadership.",
            "That is how content supports both search visibility and product understanding.",
          ],
        },
      ],
    },
  ],
  es: [
    {
      slug: "startup-seo-operating-system",
      title: "Por que una startup necesita un sistema SEO y no tareas aisladas",
      excerpt: "Una presencia de busqueda mas fuerte nace de sistemas claros, no de acciones sueltas.",
      category: "Estrategia",
      date: "7 abril 2026",
      readTime: "6 min",
      hero: "Una startup crece mas rapido cuando el trabajo SEO se trata como una capa operativa.",
      sections: [
        {
          title: "El SEO se rompe cuando nadie posee el sistema",
          paragraphs: [
            "Muchos equipos tratan el SEO como tareas sueltas. Una pagina se actualiza, un post se publica y luego el impulso se pierde.",
            "El patron mas fuerte es crear una sola capa operativa donde estrategia, ejecucion y reportes sigan conectados.",
          ],
        },
        {
          title: "La primera mejora es la claridad",
          paragraphs: [
            "Founders y equipos de marketing necesitan ver con claridad que se genera, que se audita y que sigue pendiente.",
            "Esa claridad mejora la velocidad y hace el resultado mas consistente.",
          ],
        },
        {
          title: "El blog publico debe apoyar la historia de marca",
          paragraphs: [
            "Tu blog corporativo debe reforzar posicionamiento y autoridad tematica, no reflejar cada salida interna de IA.",
            "Esa separacion hace la capa editorial publica mas solida y confiable.",
          ],
        },
      ],
    },
    {
      slug: "multilingual-blog-foundation",
      title: "Como una base de blog multilenguaje mejora alcance y credibilidad",
      excerpt: "La preferencia de idioma cambia mas que etiquetas. Cambia confianza y legibilidad.",
      category: "Contenido",
      date: "2 abril 2026",
      readTime: "5 min",
      hero: "Una experiencia multilenguaje debe sentirse intencional en landing, auth, solicitud de blog y articulos publicos.",
      sections: [
        {
          title: "El idioma necesita una sola fuente de verdad",
          paragraphs: [
            "Si el usuario cambia el idioma en una parte del producto, el resto del sitio debe responder igual.",
            "Eso significa que la solicitud del blog, la vista previa y el articulo publico deben usar la misma preferencia.",
          ],
        },
        {
          title: "El SEO mejora cuando la estructura es clara",
          paragraphs: [
            "La calidad de busqueda mejora cuando el contenido esta bien agrupado, la metadata es fuerte y la estructura es consistente.",
            "Una base de idioma mas solida tambien reduce confusion para visitantes que regresan.",
          ],
        },
      ],
    },
    {
      slug: "seo-design-patterns-that-convert",
      title: "Patrones de diseno que ayudan a convertir paginas SEO sin sentirse genericas",
      excerpt: "Una mejor jerarquia y llamadas a la accion mas claras hacen que el trafico de busqueda actue.",
      category: "Diseno",
      date: "27 marzo 2026",
      readTime: "7 min",
      hero: "El trafico de busqueda no basta. La pagina tambien debe generar confianza rapido.",
      sections: [
        {
          title: "La atencion debe estar guiada",
          paragraphs: [
            "Los usuarios deciden rapido si una pagina parece creible. Tipografia, espaciado y ritmo de secciones definen esa impresion.",
            "Un mejor sistema visual no solo luce premium. Hace que el siguiente paso sea mas facil de detectar.",
          ],
        },
        {
          title: "Las paginas editoriales deben seguir conectadas al producto",
          paragraphs: [
            "Un blog fuerte debe reforzar la narrativa del producto y no convertirse en contenido desconectado.",
            "Asi el contenido ayuda tanto a la visibilidad de busqueda como a la comprension del producto.",
          ],
        },
      ],
    },
  ],
  fr: [
    {
      slug: "startup-seo-operating-system",
      title: "Pourquoi une startup a besoin d'un systeme SEO et non de taches isolees",
      excerpt: "Une presence de recherche plus forte vient de systemes clairs, pas d'actions dispersees.",
      category: "Strategie",
      date: "7 avril 2026",
      readTime: "6 min",
      hero: "Une startup avance plus vite lorsque le SEO est traite comme une couche operationnelle.",
      sections: [
        {
          title: "Le SEO casse quand personne ne porte le systeme",
          paragraphs: [
            "Beaucoup d'equipes traitent le SEO comme une serie de petites taches. Une page est modifiee, un article est publie, puis l'elan disparait.",
            "Le modele le plus solide est une couche unique ou strategie, execution et reporting restent connectes.",
          ],
        },
        {
          title: "La premiere amelioration est la clarte",
          paragraphs: [
            "Les fondateurs et les equipes marketing ont besoin de voir clairement ce qui est genere, audite, ou encore en attente.",
            "Cette clarte rend l'execution plus rapide et plus coherente.",
          ],
        },
        {
          title: "Le blog public doit soutenir le recit de marque",
          paragraphs: [
            "Votre blog doit renforcer votre positionnement et votre autorite thematique, pas reproduire chaque sortie IA interne.",
            "Cette separation rend la couche editoriale publique plus nette et plus credible.",
          ],
        },
      ],
    },
    {
      slug: "multilingual-blog-foundation",
      title: "Comment une base de blog multilingue renforce portee et credibilite",
      excerpt: "La preference de langue change plus que les libelles. Elle change la confiance et l'experience du contenu.",
      category: "Contenu",
      date: "2 avril 2026",
      readTime: "5 min",
      hero: "Une experience multilingue doit rester coherente sur la page d'accueil, l'auth, la demande de blog et les articles publics.",
      sections: [
        {
          title: "La langue a besoin d'une seule source de verite",
          paragraphs: [
            "Si l'utilisateur change la langue a un endroit, le reste du site doit suivre.",
            "Cela signifie que la demande de blog, l'apercu et la lecture publique doivent partager la meme preference.",
          ],
        },
        {
          title: "Le SEO gagne quand la structure reste claire",
          paragraphs: [
            "La qualite de recherche progresse quand le contenu est semantiquement bien structure, avec de bonnes metadonnees.",
            "Une meilleure base linguistique reduit aussi la confusion pour les visiteurs de retour.",
          ],
        },
      ],
    },
    {
      slug: "seo-design-patterns-that-convert",
      title: "Les patterns de design qui aident les pages SEO a mieux convertir",
      excerpt: "Une meilleure hierarchie et des appels a l'action plus clairs rendent le trafic plus utile.",
      category: "Design",
      date: "27 mars 2026",
      readTime: "7 min",
      hero: "Le trafic organique ne suffit pas. La page doit aussi inspirer confiance rapidement.",
      sections: [
        {
          title: "L'attention doit etre guidee",
          paragraphs: [
            "Les utilisateurs decident vite si une page semble credible. La typographie, l'espace et le rythme comptent.",
            "Un meilleur systeme visuel ne fait pas que sembler premium. Il rend la prochaine etape evidente.",
          ],
        },
        {
          title: "Les pages editoriales doivent rester liees au produit",
          paragraphs: [
            "Un blog fort doit renforcer le recit produit plutot que devenir un contenu d'opinion deconnecte.",
            "C'est ainsi que le contenu sert a la fois la visibilite et la comprehension du produit.",
          ],
        },
      ],
    },
  ],
  hi: [
    {
      slug: "startup-seo-operating-system",
      title: "Startup ko isolated tasks nahin, ek SEO operating system kyon chahiye",
      excerpt: "Strong search presence systems se aati hai: clear intent, repeatable publishing aur tracked decisions.",
      category: "Strategy",
      date: "7 April 2026",
      readTime: "6 min read",
      hero: "Jab search work ko afterthought ke bajay operating layer maana jata hai tab startup zyada fast grow karti hai.",
      sections: [
        {
          title: "SEO toot jata hai jab system ka owner koi nahin hota",
          paragraphs: [
            "Bahut si teams SEO ko one-off tasks ki tarah treat karti hain. Ek page update hota hai, ek post publish hota hai, phir momentum khatam ho jata hai.",
            "Stronger pattern ye hai ki strategy, execution aur reporting ek hi operating layer me connected rahein.",
          ],
        },
        {
          title: "Pehli improvement clarity hoti hai",
          paragraphs: [
            "Founders aur marketing teams ko clear view chahiye ki kya generate hua, kya audit hua aur kya abhi bhi pending hai.",
            "Ye clarity speed badhati hai aur output ko consistent banati hai.",
          ],
        },
        {
          title: "Public blog ko brand story support karni chahiye",
          paragraphs: [
            "Company blog ko aapke positioning aur topical authority ko strong karna chahiye, har internal AI output ko nahin dohrana chahiye.",
            "Is separation se public editorial layer zyada sharp aur trustworthy lagti hai.",
          ],
        },
      ],
    },
    {
      slug: "multilingual-blog-foundation",
      title: "Multilingual blog foundation reach aur credibility ko kaise improve karti hai",
      excerpt: "Language preference sirf labels nahin badalti. Ye trust, readability aur content experience ko shape karti hai.",
      category: "Content",
      date: "2 April 2026",
      readTime: "5 min read",
      hero: "Multilingual experience landing page, auth flow, blog request aur public articles me intentional feel honi chahiye.",
      sections: [
        {
          title: "Language ko ek hi source of truth chahiye",
          paragraphs: [
            "Agar user product ke ek part me language change karta hai to baaki site ko bhi wahi preference follow karni chahiye.",
            "Matlab blog request form, preview aur public article view sab same setting use karein.",
          ],
        },
        {
          title: "Structure clear ho to SEO ko fayda hota hai",
          paragraphs: [
            "Search quality tab improve hoti hai jab content semantic groups me ho, metadata strong ho aur article layout consistent ho.",
            "Strong language foundation returning visitors ke liye confusion bhi kam karti hai.",
          ],
        },
      ],
    },
    {
      slug: "seo-design-patterns-that-convert",
      title: "Design patterns jo SEO pages ko generic feel ke bina better convert karte hain",
      excerpt: "Better hierarchy, stronger pacing aur cleaner CTA search traffic ko action me badalte hain.",
      category: "Design",
      date: "27 March 2026",
      readTime: "7 min read",
      hero: "Search traffic akela enough nahin hota. Page ko jaldi confidence bhi build karna hota hai.",
      sections: [
        {
          title: "Attention ko guide karna padta hai",
          paragraphs: [
            "Users jaldi decide karte hain ki page credible feel hoti hai ya nahin. Typography, spacing aur section rhythm is judgement ko shape karte hain.",
            "Better design system sirf premium look nahin deta. Ye next step ko dekhna aur trust karna easy banata hai.",
          ],
        },
        {
          title: "Editorial pages ko product-aware rehna chahiye",
          paragraphs: [
            "Strong blog layout ko product narrative se connected rehna chahiye, random thought leadership me drift nahin karna chahiye.",
            "Tabhi content search visibility aur product understanding dono ko support karta hai.",
          ],
        },
      ],
    },
  ],
};

export function getPublicBlogPosts(language: SiteLanguage): PublicBlogPost[] {
  return publicBlogPostsByLanguage[language] || publicBlogPostsByLanguage.en;
}

export function getEnglishPublicBlogPosts(): PublicBlogPost[] {
  return publicBlogPostsByLanguage.en;
}

export function getPublicBlogPost(language: SiteLanguage, slug: string): PublicBlogPost | undefined {
  return getPublicBlogPosts(language).find((post) => post.slug === slug);
}

export function getEnglishPublicBlogPost(slug: string): PublicBlogPost | undefined {
  return publicBlogPostsByLanguage.en.find((post) => post.slug === slug);
}
