import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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

      const [engineerData, clientData] = await Promise.all([
        Promise.race([base44.entities.Engineer.filter({ email: user.email }), new Promise(resolve => setTimeout(() => resolve([]), 7000))]).catch(() => []),
        Promise.race([base44.entities.Client.filter({ email: user.email }), new Promise(resolve => setTimeout(() => resolve([]), 7000))]).catch(() => [])
      ]);

      let userContracts = [];
      if (engineerData.length > 0) {
        setUserType("engineer");
        userContracts = await Promise.race([
          base44.entities.Contract.filter({ engineer_id: engineerData[0].id }),
          new Promise(resolve => setTimeout(() => resolve([]), 7000))
        ]).catch(() => []);
      } else if (clientData.length > 0) {
        setUserType("client");
        userContracts = await Promise.race([
          base44.entities.Contract.filter({ client_id: clientData[0].id }),
          new Promise(resolve => setTimeout(() => resolve([]), 7000))
        ]).catch(() => []);
      } else {
        // A homeowner can have a valid authenticated account without a legacy
        // provider row. Contracts are empty until the first project/contract;
        // the page must still open normally.
        setUserType("client");
        userContracts = [];
      }

      setContracts(userContracts);

      const engineerIds = [...new Set(userContracts.map(c => c.engineer_id).filter(Boolean))];
      const clientIds = [...new Set(userContracts.map(c => c.client_id).filter(Boolean))];
      const projectIds = [...new Set(userContracts.map(c => c.project_id).filter(Boolean))];

      const [engineersData, clientsData, projectsData] = await Promise.all([
        Promise.all(engineerIds.map(id => Promise.race([base44.entities.Engineer.filter({ id }), new Promise(resolve => setTimeout(() => resolve([]), 5000))]).catch(() => []))),
        Promise.all(clientIds.map(id => Promise.race([base44.entities.Client.filter({ id }), new Promise(resolve => setTimeout(() => resolve([]), 5000))]).catch(() => []))),
        Promise.all(projectIds.map(id => Promise.race([base44.entities.Project.filter({ id }), new Promise(resolve => setTimeout(() => resolve([]), 5000))]).catch(() => [])))
      ]);

      const engineersMap = {};
      engineersData.forEach(data => { if (data[0]) engineersMap[data[0].id] = data[0]; });
      setEngineers(engineersMap);

      const clientsMap = {};
      clientsData.forEach(data => { if (data[0]) clientsMap[data[0].id] = data[0]; });
      setClients(clientsMap);

      const projectsMap = {};
      projectsData.forEach(data => { if (data[0]) projectsMap[data[0].id] = data[0]; });
      setProjects(projectsMap);
    } catch (error) {
      console.error("Error loading contracts:", error);
      setContracts([]);
      setUserType("client");
    } finally {
      setIsLoading(false);
    }
  };}