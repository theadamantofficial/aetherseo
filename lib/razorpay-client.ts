export const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpayOrderResponse = {
  amount: number;
  currency: "INR" | "USD";
  keyId: string;
  mode: "test" | "prod";
  orderId: string;
  title: string;
};

export type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutOptions = {
  amount: number;
  currency: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  key: string;
  modal?: {
    ondismiss?: () => void;
  };
  name: string;
  notes?: Record<string, string>;
  order_id: string;
  prefill?: {
    contact?: string;
    email?: string;
    name?: string;
  };
  theme?: {
    color: string;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

let razorpayCheckoutPromise: Promise<void> | null = null;

export async function postAuthenticatedJson<T>(url: string, token: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload as T;
}

export async function ensureRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Razorpay checkout can only open in the browser.");
  }

  if (window.Razorpay) {
    return;
  }

  if (razorpayCheckoutPromise) {
    return razorpayCheckoutPromise;
  }

  razorpayCheckoutPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_CHECKOUT_SRC}"]`,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");

    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };

    const handleLoad = () => {
      cleanup();

      if (window.Razorpay) {
        resolve();
        return;
      }

      razorpayCheckoutPromise = null;
      reject(new Error("Razorpay checkout could not be loaded."));
    };

    const handleError = () => {
      cleanup();
      razorpayCheckoutPromise = null;
      reject(new Error("Razorpay checkout could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    script.src = RAZORPAY_CHECKOUT_SRC;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });

  return razorpayCheckoutPromise;
}
