import { useTranslations } from "next-intl";
import { Truck, RefreshCcw, ShieldCheck, Headset } from "lucide-react";

export function FeaturesVN() {
  const t = useTranslations("home.features");

  const features = [
    {
      icon: <Truck className="h-8 w-8 text-red-600" />,
      title: t("free_shipping"),
      desc: t("free_shipping_desc"),
    },
    {
      icon: <RefreshCcw className="h-8 w-8 text-red-600" />,
      title: t("returns"),
      desc: t("returns_desc"),
    },
    {
      icon: <ShieldCheck className="h-8 w-8 text-red-600" />,
      title: t("secure_payment"),
      desc: t("secure_payment_desc"),
    },
    {
      icon: <Headset className="h-8 w-8 text-red-600" />,
      title: t("support"),
      desc: t("support_desc"),
    },
  ];

  return (
    <section className="py-16 bg-gray-50 mt-12 mb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((item, index) => (
            <div key={index} className="flex items-center gap-5">
              <div className="shrink-0">{item.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
