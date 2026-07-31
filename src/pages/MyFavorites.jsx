import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, Star, Briefcase, Award, Loader2, Trash2, Eye
} from "lucide-react";
import { motion } from "framer-motion";

export default function MyFavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [engineers, setEngineers] = useState({});
  const [client, setClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      const clientData = await base44.entities.Client.filter({ email: user.email });
      
      if (clientData.length === 0) {
        alert("يجب أن تكون عميلاً لعرض المفضلة");
        return;
      }

      setClient(clientData[0]);
      
      const favoritesData = await base44.entities.Favorite.filter({
        client_id: clientData[0].id
      }, "-created_date");
      
      setFavorites(favoritesData);

      // Load engineers
      const engineerIds = [...new Set(favoritesData.map(f => f.engineer_id))];
      const engineersData = await Promise.all(
        engineerIds.map(id => base44.entities.Engineer.filter({ id }))
      );

      const engineersMap = {};
      engineersData.forEach(data => {
        if (data.length > 0) engineersMap[data[0].id] = data[0];
      });
      setEngineers(engineersMap);

    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      await base44.entities.Favorite.delete(favoriteId);
      await loadData();
    } catch (error) {
      alert("حدث خطأ في إزالة المفضلة");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#C9A66B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 py-8 px-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-3xl font-bold text-[#1a1a2e]">المهندسين المفضلين</h1>
          </div>
          <p className="text-slate-600">المهندسين الذين أضفتهم إلى قائمة المفضلة</p>
        </motion.div>

        {/* Favorites List */}
        {favorites.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite, index) => {
              const engineer = engineers[favorite.engineer_id];
              if (!engineer) return null;

              return (
                <motion.div
                  key={favorite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center mb-4">
                        <Avatar className="w-20 h-20 mb-3">
                          <AvatarImage src={engineer.profile_image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#1a1a2e] to-[#C9A66B] text-white text-2xl">
                            {engineer.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-bold text-lg text-[#1a1a2e] mb-1">
                          {engineer.full_name}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          {engineer.specialization}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {engineer.rating?.toFixed(1) || "0.0"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {engineer.completed_projects || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {engineer.years_experience || 0} سنة
                          </div>
                        </div>

                        {engineer.is_verified && (
                          <Badge className="bg-blue-100 text-blue-800 mb-3">
                            موثق
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link 
                          to={createPageUrl("EngineerProfile") + `?id=${engineer.id}`}
                          className="flex-1"
                        >
                          <Button variant="outline" className="w-full">
                            <Eye className="w-4 h-4 ml-2" />
                            عرض الملف
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFavorite(favorite.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">
                لا توجد مفضلة حتى الآن
              </h3>
              <p className="text-slate-500 mb-6">
                ابدأ بإضافة المهندسين المفضلين لديك
              </p>
              <Link to={createPageUrl("Engineers")}>
                <Button className="bg-gradient-to-r from-[#1a1a2e] to-[#C9A66B] text-white">
                  تصفح المهندسين
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}