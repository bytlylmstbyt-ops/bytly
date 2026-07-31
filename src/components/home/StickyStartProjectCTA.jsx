import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * StickyStartProjectCTA — a floating "start your project" button that
 * appears once the user scrolls past the hero, giving them a persistent
 * primary action during long scrolls. Positioned to clear the mobile
 * BottomNav (left) and the BytlyAdvisor FAB (right).
 */
export default function StickyStartProjectCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed z-40 bottom-20 md:bottom-6 left-4 right-20 md:right-auto md:left-1/2 md:-translate-x-1/2 md:max-w-sm transition-opacity duration-300">
      <Link to={createPageUrl('CreateProject')} className="block">
        <Button className="w-full h-12 shadow-2xl shadow-black/20 bg-gradient-to-r from-[#6B5D4F] to-[#C9A66B] text-white rounded-full text-base font-semibold hover:opacity-90">
          <Plus className="w-5 h-5 ml-1" />
          ابدأ مشروعك الآن
        </Button>
      </Link>
    </div>
  );
}