import { useTranslations } from "next-intl";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, MessageCircle, Camera, Briefcase } from "lucide-react";

export function FooterVN() {
  const t = useTranslations("common.footer");

  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Help & Support */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-gray-900">{t("help_support")}</h3>
            <ul className="flex flex-col gap-4 text-gray-600">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-red-600" />
                <span className="text-sm">{t("address")}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-red-600" />
                <a href="tel:+0995327869843" className="text-sm hover:text-red-600 transition">
                  {t("phone")}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-red-600" />
                <a href="mailto:support@example.com" className="text-sm hover:text-red-600 transition">
                  {t("email")}
                </a>
              </li>
            </ul>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition">
                <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">
                <MessageCircle className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-pink-600 transition">
                <Camera className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-700 transition">
                <Briefcase className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-gray-900">{t("account")}</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/signin" className="text-sm text-gray-600 hover:text-red-600 transition">
                  {t("login_register")}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-gray-600 hover:text-red-600 transition">
                  {t("account")}
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm text-gray-600 hover:text-red-600 transition">
                  {t("account")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-semibold text-gray-900">{t("quick_link")}</h3>
            <ul className="flex flex-col gap-4">
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-red-600 transition">
                  {t("privacy_policy")}
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-sm text-gray-600 hover:text-red-600 transition">
                  {t("refund_policy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-red-600 transition">
                  {t("terms_of_use")}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Logo / Brand Info */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">D</span>
              </div>
              <span className="text-2xl font-bold font-display tracking-tight text-gray-900">
                DATN
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ecommerce Platform Built with Next.js & Hallmark UI Design.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
