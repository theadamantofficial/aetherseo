import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { siteLanguageCookieName } from "@/lib/site-language";
import { resolveSiteLanguage } from "@/lib/site-routing";

export default async function PrivacyPolicyPage() {
  const cookieStore = await cookies();
  const language = resolveSiteLanguage(cookieStore.get(siteLanguageCookieName)?.value);

  redirect(`/${language}/privacy-policy`);
}
