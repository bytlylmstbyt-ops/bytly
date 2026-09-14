import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Briefcase, User, FileText, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";

export default function QuickSearch({ userEmail }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const [projects, engineers, disputes] = await Promise.all([
        base44.entities.Project.list(),
        base44.entities.Engineer.list(),
        base44.entities.Dispute.list()
      ]);

      const searchLower = query.toLowerCase();

      const projectResults = projects
        .filter(p => 
          p.client_email === userEmail || p.assigned_engineer_email === userEmail
        )
        .filter(p =>
          p.title?.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower)
        )
        .slice(0, 3)
        .map(p => ({ ...p, type: 'project' }));

      const engineerResults = engineers
        .filter(e =>
          e.full_name?.toLowerCase().includes(searchLower) ||
          e.specialization?.toLowerCase().includes(searchLower) ||
          e.city?.toLowerCase().includes(searchLower)
        )
        .slice(0, 3)
        .map(e => ({ ...e, type: 'engineer' }));

      const disputeResults = disputes
        .filter(d =>
          d.raised_by === userEmail || d.raised_against === userEmail
        )
        .filter(d =>
          d.title?.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower)
        )
        .slice(0, 2)
        .map(d => ({ ...d, type: 'dispute' }));

      setResults([...projectResults, ...engineerResults, ...disputeResults]);
      setShowResults(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'project': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'engineer': return <User className="w-4 h-4 text-green-600" />;
      case 'dispute': return <ShieldAlert className="w-4 h-4 text-orange-600" />;
      default: return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getLink = (item) => {
    switch (item.type) {
      case 'project': return createPageUrl(`ProjectDetails?id=${item.id}`);
      case 'engineer': return createPageUrl(`EngineerProfile?id=${item.id}`);
      case 'dispute': return createPageUrl(`DisputeDetails?id=${item.id}`);
      default: return '#';
    }
  };

  const getLabel = (type) => {
    switch (type) {
      case 'project': return 'مشروع';
      case 'engineer': return 'مهندس';
      case 'dispute': return 'نزاع';
      default: return '';
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="بحث سريع..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pr-10 bg-white"
        />
        {isSearching && (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg border-[#C9A66B]/20">
          <CardContent className="p-2">
            <div className="space-y-1">
              {results.map((item, index) => (
                <Link
                  key={index}
                  to={getLink(item)}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">
                      {item.title || item.full_name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.description || item.specialization || item.dispute_type}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getLabel(item.type)}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-4 text-center text-sm text-slate-600">
            لا توجد نتائج
          </CardContent>
        </Card>
      )}
    </div>
  );
}