import React, { useState, useEffect, useRef, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { uploadScopedFile } from "@/lib/projectFileStorage";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Send, Paperclip, MoreVertical,
  Phone, Video, ChevronLeft, Download, Loader2, Mic, MicOff,
  Users, User, Building2, Filter, Plus, X, UserCircle, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/components/i18n/LanguageContext";