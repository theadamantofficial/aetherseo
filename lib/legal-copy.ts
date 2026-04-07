import type { SiteLanguage } from "@/lib/site-language";

type LegalDocumentCopy = {
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
};

type FooterCopy = {
  product: string;
  parent: string;
  rights: string;
  privacy: string;
  terms: string;
};

export const privacyCopy: Record<SiteLanguage, LegalDocumentCopy> = {
  en: {
    title: "Privacy Policy",
    intro:
      "Aether is still in rollout. This summary explains how prototype accounts, blog requests, and operational data are currently handled until the full production policy is published.",
    sections: [
      {
        title: "Account data",
        body:
          "We store the information you submit during onboarding, including name, email, chosen plan, and optional phone number, so the workspace can be provisioned and restored.",
      },
      {
        title: "Operational content",
        body:
          "Workspace activity, generated drafts, and blog request metadata may be retained to power dashboard history, improve internal operations, and support follow-up requests.",
      },
      {
        title: "Third-party services",
        body:
          "Authentication, storage, analytics, and notification flows may rely on third-party services such as Firebase and Discord. Final processor disclosures will be listed in the production policy.",
      },
    ],
  },
  es: {
    title: "Politica de privacidad",
    intro:
      "Aether sigue en lanzamiento. Este resumen explica como se manejan hoy las cuentas de prueba, las solicitudes de blog y los datos operativos hasta publicar la politica final.",
    sections: [
      {
        title: "Datos de cuenta",
        body:
          "Guardamos la informacion enviada durante el onboarding, incluyendo nombre, email, plan elegido y telefono opcional, para activar y restaurar el workspace.",
      },
      {
        title: "Contenido operativo",
        body:
          "La actividad del workspace, los borradores generados y los metadatos de solicitudes de blog pueden conservarse para el historial del dashboard y para mejorar operaciones internas.",
      },
      {
        title: "Servicios de terceros",
        body:
          "La autenticacion, el almacenamiento, la analitica y las notificaciones pueden depender de servicios externos como Firebase y Discord. La politica final incluira la lista completa.",
      },
    ],
  },
  fr: {
    title: "Politique de confidentialite",
    intro:
      "Aether est encore en phase de lancement. Ce resume explique comment les comptes prototype, les demandes de blog et les donnees operationnelles sont geres avant la politique finale.",
    sections: [
      {
        title: "Donnees de compte",
        body:
          "Nous conservons les informations transmises pendant l'onboarding, dont le nom, l'email, l'offre choisie et le numero de telephone facultatif, pour provisionner et restaurer l'espace.",
      },
      {
        title: "Contenu operationnel",
        body:
          "L'activite du workspace, les brouillons generes et les metadonnees de demande de blog peuvent etre conserves pour l'historique du dashboard et l'amelioration interne.",
      },
      {
        title: "Services tiers",
        body:
          "L'authentification, le stockage, l'analytics et les notifications peuvent s'appuyer sur des services tiers comme Firebase et Discord. La politique finale les listera en detail.",
      },
    ],
  },
  hi: {
    title: "Privacy Policy",
    intro:
      "Aether abhi rollout phase me hai. Yeh summary batati hai ki prototype accounts, blog requests aur operational data ko abhi kaise handle kiya ja raha hai jab tak full production policy publish nahi hoti.",
    sections: [
      {
        title: "Account data",
        body:
          "Onboarding ke dauran diya gaya naam, email, selected plan aur optional phone number workspace provision aur restore karne ke liye store kiya ja sakta hai.",
      },
      {
        title: "Operational content",
        body:
          "Workspace activity, generated drafts aur blog request metadata dashboard history aur internal operations improve karne ke liye retain kiye ja sakte hain.",
      },
      {
        title: "Third-party services",
        body:
          "Authentication, storage, analytics aur notifications Firebase aur Discord jaise third-party services par depend kar sakte hain. Final policy me complete processor list hogi.",
      },
    ],
  },
};

export const termsCopy: Record<SiteLanguage, LegalDocumentCopy> = {
  en: {
    title: "Terms of Service",
    intro:
      "These terms summarize how access to the current Aether product preview works until the production legal package is finalized.",
    sections: [
      {
        title: "Preview access",
        body:
          "Current access is offered as a product preview. Features, limits, pricing, and availability may change while the platform is being finalized.",
      },
      {
        title: "Acceptable use",
        body:
          "You may not use the product to submit unlawful content, abuse automations, interfere with service integrity, or access another user's workspace or data.",
      },
      {
        title: "Commercial terms",
        body:
          "Paid access, billing rules, refunds, support commitments, and service levels will be governed by the production commercial terms once they are published.",
      },
    ],
  },
  es: {
    title: "Terminos del servicio",
    intro:
      "Estos terminos resumen como funciona el acceso al preview actual de Aether hasta que el paquete legal final quede publicado.",
    sections: [
      {
        title: "Acceso preview",
        body:
          "El acceso actual se ofrece como preview del producto. Funciones, limites, precio y disponibilidad pueden cambiar mientras la plataforma se termina.",
      },
      {
        title: "Uso aceptable",
        body:
          "No puedes usar el producto para enviar contenido ilegal, abusar de automatizaciones, afectar la integridad del servicio o entrar al workspace de otro usuario.",
      },
      {
        title: "Terminos comerciales",
        body:
          "El acceso paid, billing, reembolsos, soporte y niveles de servicio quedaran definidos por los terminos comerciales de produccion cuando se publiquen.",
      },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    intro:
      "Ces conditions resumment le fonctionnement de l'acces a l'aperçu actuel d'Aether jusqu'a la publication du dispositif juridique final.",
    sections: [
      {
        title: "Acces preview",
        body:
          "L'acces actuel est fourni comme apercu du produit. Les fonctionnalites, limites, prix et disponibilites peuvent evoluer pendant la finalisation de la plateforme.",
      },
      {
        title: "Usage acceptable",
        body:
          "Vous ne pouvez pas utiliser le produit pour soumettre un contenu illicite, abuser des automatisations, perturber le service ou acceder aux donnees d'un autre utilisateur.",
      },
      {
        title: "Conditions commerciales",
        body:
          "L'acces payant, la facturation, les remboursements, le support et les niveaux de service seront regis par les conditions commerciales de production lorsqu'elles seront publiees.",
      },
    ],
  },
  hi: {
    title: "Terms of Service",
    intro:
      "Yeh terms batate hain ki Aether product preview ka access abhi kaise kaam karta hai jab tak final production legal package publish nahi hota.",
    sections: [
      {
        title: "Preview access",
        body:
          "Current access ek product preview ke roop me diya ja raha hai. Features, limits, pricing aur availability platform final hone tak change ho sakte hain.",
      },
      {
        title: "Acceptable use",
        body:
          "Aap product ko illegal content, automation abuse, service integrity disrupt karne ya kisi aur user ke workspace/data tak pahunchne ke liye use nahi kar sakte.",
      },
      {
        title: "Commercial terms",
        body:
          "Paid access, billing, refund, support aur service-level commitments production terms publish hone ke baad govern honge.",
      },
    ],
  },
};

export const footerCopy: Record<SiteLanguage, FooterCopy> = {
  en: {
    product: "Aether AI",
    parent: "TheAdamant",
    rights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },
  es: {
    product: "Aether AI",
    parent: "TheAdamant",
    rights: "Todos los derechos reservados.",
    privacy: "Politica de privacidad",
    terms: "Terminos del servicio",
  },
  fr: {
    product: "Aether AI",
    parent: "TheAdamant",
    rights: "Tous droits reserves.",
    privacy: "Politique de confidentialite",
    terms: "Conditions d'utilisation",
  },
  hi: {
    product: "Aether AI",
    parent: "TheAdamant",
    rights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },
};
