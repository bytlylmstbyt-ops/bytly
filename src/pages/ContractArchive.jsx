import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { 
  FileText, Search, Download, Eye, 
  Calendar, User, Building2, CheckCircle, Clock,
  Archive, TrendingUp, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";



export default function ContractArchive() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [clients, setClients] = useState({});
  const [projects, setProjects] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchQuery, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await Promise.race([
        base44.auth.me(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة تحميل المستخدم")), 10000))
      ]);
      setCurrentUser(user);

      // Contracts in the new Supabase schema are linked directly to the
      // authenticated user IDs (client_user_id/provider_user_id). Do not
      // require a legacy Client/Engineer record just to open this page.
      const authUserId = user?.user_id || user?.id;
      let userContracts = [];

      if (authUserId) {
        const { data, error } = await Promise.race([
          supabase
            .from("project_contracts")
            .select("*")
            .or(`client_user_id.eq.${authUserId},provider_user_id.eq.${authUserId}`)
            .order("created_at", { ascending: false }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("انتهت مهلة قراءة العقود")), 10000))
        ]);
        if (error) throw error;
        userContracts = data || [];
      }

      // Keep legacy fallback only for migrated accounts that have no new
      // Supabase contracts. It is bounded so the page can never spin forever.
      if (userContracts.length === 0 && user?.email) {
        const [engineerData, clientData] = await Promise.all([
          Promise.race([base44.entities.Engineer.filter({ email: user.email }), new Promise(resolve => setTimeout(() => resolve([]), 5000))]).catch(() => []),
          Promise.race([base44.entities.Client.filter({ email: user.email }), new Promise(resolve => setTimeout(() => resolve([]), 5000))]).catch(() => [])
        ]);

        if (engineerData?.[0]) {
          setUserType("engineer");
          userContracts = await Promise.race([
            base44.entities.Contract.filter({ engineer_id: engineerData[0].id }),
            new Promise(resolve => setTimeout(() => resolve([]), 7000))
          ]).catch(() => []);
        } else if (clientData?.[0]) {
          setUserType("client");
          userContracts = await Promise.race([
            base44.entities.Contract.filter({ client_id: clientData[0].id }),
            new Promise(resolve => setTimeout(() => resolve([]), 7000))
          ]).catch(() => []);
        }
      }

      if (!userType) setUserType("client");
      setContracts(userContracts);

      // Resolve related records from the current Supabase schema.
      const projectIds = [...new Set(userContracts.map(c => c.project_id).filter(Boolean))];
      const [projectsData] = await Promise.all([
        Promise.all(projectIds.map(id =>
          Promise.race([
            supabase.from("projects").select("*").eq("id", id).maybeSingle().then(r => r.data ? [r.data] : []),
            new Promise(resolve => setTimeout(() => resolve([]), 5000))
          ]).catch(() => [])
        ))
      ]);

      const projectsMap = {};
      projectsData.flat().forEach(data => { if (data?.id) projectsMap[data.id] = data; });
      setProjects(projectsMap);

      // These maps are retained for legacy contract rendering.
      setEngineers({});
      setClients({});
    } catch (error) {
      console.error("Error loading contracts:", error);
      setContracts([]);
      setUserType("client");
      setEngineers({});
      setClients({});
      setProjects({});
    } finally {
      setIsLoading(false);
    }
  };}