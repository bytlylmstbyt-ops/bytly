import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

// Simple SVG icons for Microsoft, Facebook, Apple
const MicrosoftIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 21 21" fill="none">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);
const FacebookIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);
const AppleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitGuard = useRef(false);

  const returnUrl = appParams.fromUrl || "/";

  const handleGoogleLogin = () => {
    // Save return URL and redirect to Google OAuth
    // Note: loginWithProvider redirects immediately, so we don't await it
    sessionStorage.setItem('loginReturnUrl', returnUrl);
    base44.auth.loginWithProvider('google', createPageUrl('RegisterChoice'));
  };

  const validateEmail = (value) => {
    if (!value) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email address";
    return "";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitGuard.current) return;
    submitGuard.current = true;
    setError("");
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      submitGuard.current = false;
      setEmailError(emailValidation);
      return;
    }
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnUrl;
    } catch (err) {
      console.error('Login error:', err);
      const msg = err?.message || err?.data?.message || "";
      const status = err?.status || err?.response?.status;
      
      // Handle specific error types
      if (status === 400) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (status === 401 || status === 403) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (status === 404) {
        setError("المستخدم غير مسجل في التطبيق");
      } else if (err?.status === 0 || msg.includes("network") || msg.includes("fetch") || msg.includes("NotFoundError")) {
        setError("تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.");
      } else if (msg.includes("password") || msg.toLowerCase().includes("credential")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        setError(msg || "البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
    } finally {
      submitGuard.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="تسجيل الدخول"
      subtitle="مرحباً بعودتك"
      footer={
        <div className="flex flex-col gap-2 items-center">
          <p className="text-sm text-muted-foreground">
            ليس لديك حساب؟{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              سجّل الآن
            </Link>
          </p>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </div>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2" dir="rtl">
          <span className="text-destructive shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => {
        // Prevent default form submission behavior
        e.preventDefault();
        // Call the actual handler
        handleSubmit(e);
      }} className="space-y-4 md:space-y-5" dir="rtl">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">البريد الإلكتروني</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
              onBlur={handleEmailBlur}
              className={`pl-10 h-12 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              required
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              disabled={loading}
            />
          </div>
          {emailError && (
            <p id="email-error" className="text-xs text-destructive mt-1">{emailError}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium">كلمة المرور</Label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              enterKeyHint="done"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
              disabled={loading}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 font-medium text-base" 
          disabled={loading || !!emailError}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              جاري تسجيل الدخول...
            </>
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-muted"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">أو تابع باستخدام</span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon />
          تسجيل الدخول عبر Google
        </Button>
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => {
            sessionStorage.setItem('loginReturnUrl', returnUrl);
            base44.auth.loginWithProvider('microsoft', createPageUrl('RegisterChoice'));
          }}
        >
          <MicrosoftIcon />
          تسجيل الدخول عبر Microsoft
        </Button>
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => {
            sessionStorage.setItem('loginReturnUrl', returnUrl);
            base44.auth.loginWithProvider('facebook', createPageUrl('RegisterChoice'));
          }}
        >
          <FacebookIcon />
          تسجيل الدخول عبر Facebook
        </Button>
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => {
            sessionStorage.setItem('loginReturnUrl', returnUrl);
            base44.auth.loginWithProvider('apple', createPageUrl('RegisterChoice'));
          }}
        >
          <AppleIcon />
          تسجيل الدخول عبر Apple
        </Button>
      </div>
    </AuthLayout>
  );
}