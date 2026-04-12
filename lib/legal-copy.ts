import type { SiteLanguage } from "@/lib/site-language";

type LegalMetaItem = {
  label: string;
  value: string;
  href?: string;
};

type LegalDocumentSubsection = {
  title: string;
  body?: string;
  bullets?: string[];
};

type LegalDocumentSection = {
  title: string;
  body?: string;
  bullets?: string[];
  subsections?: LegalDocumentSubsection[];
};

type LegalDocumentCopy = {
  title: string;
  intro: string;
  meta?: LegalMetaItem[];
  sections: LegalDocumentSection[];
};

type FooterCopy = {
  product: string;
  parent: string;
  rights: string;
  privacy: string;
  terms: string;
};

const privacyDocument: LegalDocumentCopy = {
  title: "Privacy Policy",
  intro:
    "This Privacy Policy explains how AetherSEO collects, uses, discloses, and protects your information when you use the website and services.",
  meta: [
    {
      label: "Effective Date",
      value: "April 12, 2026",
    },
    {
      label: "Website",
      value: "https://www.aetherseo.com",
      href: "https://www.aetherseo.com",
    },
  ],
  sections: [
    {
      title: "1. Introduction",
      body:
        "Welcome to AetherSEO (\"we,\" \"our,\" or \"us\"). Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services. By accessing or using AetherSEO, you agree to this Privacy Policy.",
    },
    {
      title: "2. Information We Collect",
      subsections: [
        {
          title: "2.1 Personal Information",
          body: "We may collect:",
          bullets: [
            "Full name",
            "Email address",
            "Phone number, if provided",
            "Billing and payment information",
            "Account login credentials",
          ],
        },
        {
          title: "2.2 Non-Personal Information",
          bullets: [
            "IP address",
            "Browser type",
            "Device information",
            "Usage data, including pages visited, session duration, and clicks",
          ],
        },
        {
          title: "2.3 AI-Generated and Input Data",
          body: "Because AetherSEO is an AI-powered SEO platform, we may collect:",
          bullets: [
            "Keywords entered",
            "Website URLs analyzed",
            "Content generated or optimized",
          ],
        },
      ],
    },
    {
      title: "3. How We Use Your Information",
      body: "We use your data to:",
      bullets: [
        "Provide and improve our services",
        "Generate SEO insights and AI outputs",
        "Process payments and subscriptions",
        "Communicate updates, offers, and support",
        "Detect fraud and maintain platform security",
      ],
    },
    {
      title: "4. Data Sharing and Disclosure",
      body: "We do not sell your personal data. We may share data with:",
      bullets: [
        "Payment processors and billing partners",
        "Cloud service providers for hosting, infrastructure, and analytics",
        "Legal authorities when required by law",
      ],
    },
    {
      title: "5. Data Retention",
      body: "We retain your data for as long as your account remains active and as needed for legal or operational purposes. You can request deletion at any time.",
    },
    {
      title: "6. Cookies and Tracking Technologies",
      body: "We use cookies to:",
      bullets: [
        "Enhance user experience",
        "Analyze traffic",
        "Personalize content",
      ],
      subsections: [
        {
          title: "Cookie controls",
          body: "You can disable cookies through your browser settings.",
        },
      ],
    },
    {
      title: "7. Data Security",
      body: "We implement reasonable safeguards to protect your information, including:",
      bullets: [
        "SSL encryption",
        "Secure servers",
        "Access controls",
      ],
      subsections: [
        {
          title: "Security notice",
          body: "However, no system is completely secure, and we cannot guarantee absolute security.",
        },
      ],
    },
    {
      title: "8. Your Rights",
      body: "Depending on your region, you may have the right to:",
      bullets: [
        "Access your data",
        "Correct inaccurate data",
        "Delete your data",
        "Withdraw consent",
      ],
      subsections: [
        {
          title: "Rights requests",
          body: "To exercise these rights, contact us at yashverma@theadamant.com.",
        },
      ],
    },
    {
      title: "9. Third-Party Links",
      body:
        "Our website may contain links to third-party services. We are not responsible for the privacy practices of those third parties.",
    },
    {
      title: "10. Children's Privacy",
      body:
        "AetherSEO is not intended for users under 13 years old, or the applicable minimum age in your jurisdiction.",
    },
    {
      title: "11. Updates to This Policy",
      body:
        "We may update this Privacy Policy periodically. Any changes will be posted on this page.",
    },
    {
      title: "12. Contact Us",
      body: "For any questions about this Privacy Policy, contact:",
      bullets: ["Email: yashverma@theadamant.com"],
    },
    {
      title: "Refund Policy",
      subsections: [
        {
          title: "1. No Refund Policy",
          body:
            "At AetherSEO, all purchases are final and non-refundable. Due to the nature of digital and AI-based services, once access is granted, value is immediately delivered and resources such as compute, API usage, and AI processing are consumed instantly. We do not offer refunds for subscriptions, credits, or services.",
        },
        {
          title: "2. Exceptions",
          body: "Refunds may be considered only in rare verified cases, such as:",
          bullets: [
            "Duplicate payment",
            "Technical failure preventing access, once verified by our team",
          ],
        },
        {
          title: "3. Subscription Cancellation",
          bullets: [
            "Users can cancel at any time",
            "Access continues until the current billing cycle ends",
            "No partial refunds are issued for unused time",
          ],
        },
      ],
    },
  ],
};

export const privacyCopy: Record<SiteLanguage, LegalDocumentCopy> = {
  en: privacyDocument,
  es: privacyDocument,
  fr: privacyDocument,
  hi: privacyDocument,
};

const termsDocument: LegalDocumentCopy = {
  title: "Terms and Conditions",
  intro:
    "These Terms and Conditions explain the rules that govern access to and use of AetherSEO and its AI-powered SEO services.",
  meta: [
    {
      label: "Effective Date",
      value: "April 12, 2026",
    },
    {
      label: "Website",
      value: "https://www.aetherseo.com",
      href: "https://www.aetherseo.com",
    },
  ],
  sections: [
    {
      title: "1. Acceptance of Terms",
      body:
        "By accessing or using AetherSEO (\"we,\" \"our,\" or \"us\"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.",
    },
    {
      title: "2. Description of Services",
      body: "AetherSEO provides:",
      bullets: [
        "AI-powered SEO tools",
        "Keyword research and optimization",
        "Content generation and analysis",
        "Website performance insights",
      ],
      subsections: [
        {
          title: "Service changes",
          body: "We reserve the right to modify, suspend, or discontinue any part of the service at any time.",
        },
      ],
    },
    {
      title: "3. User Accounts",
      body: "To use certain features, you must:",
      bullets: [
        "Create an account",
        "Provide accurate and complete information",
        "Maintain the confidentiality of your login credentials",
      ],
      subsections: [
        {
          title: "Account responsibility",
          body: "You are responsible for all activities under your account.",
        },
      ],
    },
    {
      title: "4. Acceptable Use",
      body: "You agree not to:",
      bullets: [
        "Use the platform for illegal purposes",
        "Generate harmful, abusive, or misleading content",
        "Reverse engineer or exploit the system",
        "Attempt unauthorized access to servers or data",
        "Use bots or scripts to abuse AI resources",
      ],
      subsections: [
        {
          title: "Enforcement",
          body: "We reserve the right to suspend or terminate accounts that violate these rules.",
        },
      ],
    },
    {
      title: "5. Payments and Billing",
      bullets: [
        "All services are provided on a paid subscription or credit basis",
        "Prices may change at any time with notice",
        "Payments must be made in advance",
      ],
      subsections: [
        {
          title: "Non-payment",
          body: "Failure to pay may result in suspension of services.",
        },
      ],
    },
    {
      title: "6. Refund Policy",
      body:
        "All payments made to AetherSEO are non-refundable. Due to the nature of digital AI services, value is delivered instantly upon usage and computational resources are consumed immediately.",
      subsections: [
        {
          title: "Exceptions",
          body: "Refunds may be considered only where applicable, such as:",
          bullets: [
            "Duplicate transactions",
            "Verified technical issues preventing access",
          ],
        },
      ],
    },
    {
      title: "7. Subscription and Cancellation",
      bullets: [
        "Users may cancel subscriptions at any time",
        "Cancellation takes effect at the end of the billing cycle",
        "No partial refunds are issued for unused periods",
      ],
    },
    {
      title: "8. Intellectual Property",
      body:
        "All content, software, and technology on AetherSEO are owned by us or licensed to us.",
      subsections: [
        {
          title: "You may",
          bullets: [
            "Use outputs generated for your business or personal use",
          ],
        },
        {
          title: "You may not",
          bullets: [
            "Resell, redistribute, or copy our platform or algorithms",
            "Claim ownership of our proprietary systems",
          ],
        },
      ],
    },
    {
      title: "9. AI-Generated Content Disclaimer",
      body:
        "AetherSEO uses artificial intelligence to generate content. We do not guarantee:",
      bullets: [
        "Accuracy",
        "SEO ranking outcomes",
        "Compliance with search engine policies",
      ],
      subsections: [
        {
          title: "User responsibility",
          body: "You are responsible for reviewing and using generated content.",
        },
      ],
    },
    {
      title: "10. Limitation of Liability",
      body: "To the fullest extent permitted by law, AetherSEO shall not be liable for:",
      bullets: [
        "Any indirect or consequential damages",
        "Loss of revenue, data, or business opportunities",
        "SEO ranking losses or penalties",
      ],
      subsections: [
        {
          title: "Risk notice",
          body: "Use of the service is at your own risk.",
        },
      ],
    },
    {
      title: "11. Indemnification",
      body: "You agree to indemnify and hold harmless AetherSEO from any claims arising from:",
      bullets: [
        "Your use of the service",
        "Violation of these terms",
        "Content generated or published by you",
      ],
    },
    {
      title: "12. Termination",
      body: "We may suspend or terminate your account if:",
      bullets: [
        "You violate these Terms",
        "You misuse the platform",
        "We are required to do so by law",
      ],
      subsections: [
        {
          title: "Effect of termination",
          body: "Upon termination, access to services may be revoked immediately.",
        },
      ],
    },
    {
      title: "13. Third-Party Services",
      body:
        "Our platform may integrate with third-party tools or APIs. We are not responsible for:",
      bullets: [
        "Their availability",
        "Their data handling practices",
        "Any losses caused by third-party services",
      ],
    },
    {
      title: "14. Governing Law",
      body: "These Terms are governed by the laws of India.",
      subsections: [
        {
          title: "Jurisdiction",
          body: "Any disputes shall be subject to jurisdiction in Gurugram or Delhi, India.",
        },
      ],
    },
    {
      title: "15. Changes to Terms",
      body:
        "We may update these Terms at any time. Continued use of the platform after updates means you accept the revised Terms.",
    },
    {
      title: "16. Contact Information",
      body: "For any questions regarding these Terms, contact:",
      bullets: ["Email: yashverma@theadamant.com"],
    },
  ],
};

export const termsCopy: Record<SiteLanguage, LegalDocumentCopy> = {
  en: termsDocument,
  es: termsDocument,
  fr: termsDocument,
  hi: termsDocument,
};

export const footerCopy: Record<SiteLanguage, FooterCopy> = {
  en: {
    product: "Aether SEO",
    parent: "TheAdamant",
    rights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },
  es: {
    product: "Aether SEO",
    parent: "TheAdamant",
    rights: "Todos los derechos reservados.",
    privacy: "Politica de privacidad",
    terms: "Terminos del servicio",
  },
  fr: {
    product: "Aether SEO",
    parent: "TheAdamant",
    rights: "Tous droits reserves.",
    privacy: "Politique de confidentialite",
    terms: "Conditions d'utilisation",
  },
  hi: {
    product: "Aether SEO",
    parent: "TheAdamant",
    rights: "All rights reserved.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
  },
};
