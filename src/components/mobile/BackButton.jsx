import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function BackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/") return null;

  return (
    <button
      onClick={() => navigate(-1)}
      className="md:hidden flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 transition-colors select-none"
      aria-label="رجوع"
    >
      <ChevronRight className="w-5 h-5 text-[#6B5D4F]" />
    </button>
  );
}