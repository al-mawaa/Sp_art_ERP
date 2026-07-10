import React from "react";
import { Gift, Share2, Copy, Users, MessageCircle, Mail, Twitter, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReferralAndRewardsWidget({ rewards, referrals, profile }: any) {
  const referralCode = profile?.referralCode || "SPART-8X9Y";
  const points = rewards?.points || 850;
  
  // Example mock progress for next gift
  const nextGift = "Art Supply Kit";
  const pointsNeeded = 1000;
  const progressPercent = Math.min((points / pointsNeeded) * 100, 100);

  const shareText = `🎨 Ready to unleash your creativity? Join me at SP Art Hub! 🖌️ Sign up today using my exclusive referral code ${referralCode} and let's start our artistic journey together! ✨`;
  const encodedShareText = encodeURIComponent(shareText);
  const shareUrl = encodeURIComponent("https://sparthub.com");

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied!");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Rewards Side */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="p-2 bg-white/10 rounded-lg">
            <Gift className="text-purple-200" />
          </div>
          <h3 className="font-bold text-lg">Rewards & Gifts</h3>
        </div>

        <div className="mb-6 relative z-10">
          <p className="text-purple-200 text-sm font-medium mb-1">Your Points</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{points}</span>
            <span className="text-purple-300 text-sm">pts</span>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm relative z-10">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-white">{nextGift}</span>
            <span className="text-purple-200">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-2 mb-2">
            <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="text-xs text-purple-300">{pointsNeeded - points} points to unlock</p>
        </div>
      </div>

      {/* Referral Side */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">Refer & Earn</h3>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase">Referrals</p>
            <p className="text-xl font-bold text-slate-800">3</p>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase">Earned</p>
            <p className="text-xl font-bold text-emerald-700">₹1,500</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1 flex items-center">
          <div className="px-4 py-2 font-mono font-bold text-slate-700 tracking-wider flex-1 text-center">
            {referralCode}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9 bg-white" onClick={copyCode}>
              <Copy size={16} className="text-slate-600" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer">
                  <Share2 size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white z-50">
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`https://wa.me/?text=${encodedShareText}`, '_blank')}>
                  <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
                  <span>WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`mailto:?subject=${encodeURIComponent("Join me at SP Art Hub! 🎨")}&body=${encodedShareText}`, '_blank')}>
                  <Mail className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Email</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedShareText}`, '_blank')}>
                  <Twitter className="mr-2 h-4 w-4 text-sky-500" />
                  <span>Twitter / X</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodedShareText}`, '_blank')}>
                  <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                  <span>Facebook</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 mt-3 font-medium">Earn ₹500 for every successful referral!</p>
      </div>
    </div>
  );
}
