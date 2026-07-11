import React from "react";
import { Wallet, CreditCard, PieChart, TrendingDown } from "lucide-react";

export function FeesAnalyticsCards({ data }: { data: any }) {
  const cards = [
    {
      title: "Total Course Fee",
      value: `₹${data.totalFee.toLocaleString()}`,
      subtitle: "+18% GST included",
      icon: Wallet,
      color: "from-blue-600 to-indigo-700",
      iconBg: "bg-blue-500/20 text-blue-100",
    },
    {
      title: "Total Paid",
      value: `₹${data.paid.toLocaleString()}`,
      subtitle: "Full tracking available",
      icon: CreditCard,
      color: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-400/20 text-emerald-100",
    },
    {
      title: "Remaining Balance",
      value: `₹${data.remaining.toLocaleString()}`,
      subtitle: "Across pending installments",
      icon: PieChart,
      color: "from-amber-500 to-orange-600",
      iconBg: "bg-amber-400/20 text-amber-100",
    },
    {
      title: "Total Discount",
      value: `₹${(data.referralDiscount + data.couponDiscount).toLocaleString()}`,
      subtitle: "Saved on total fee",
      icon: TrendingDown,
      color: "from-purple-600 to-pink-600",
      iconBg: "bg-purple-400/20 text-purple-100",
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-6 shadow-soft hover:shadow-pop transition-all group`}
        >
          {/* Glass shine effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-white/20 transition-colors"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon size={20} />
              </div>
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">{card.value}</h3>
              <p className="text-white/60 text-xs flex items-center gap-1">
                {card.subtitle}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
