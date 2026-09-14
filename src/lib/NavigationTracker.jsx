import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    useEffect(() => {
        if (!isAuthenticated) return;
        // Disabled during auth migration: do not initialize legacy Base44 analytics on navigation.
    }, [location.pathname, isAuthenticated]);
    return null;
}
