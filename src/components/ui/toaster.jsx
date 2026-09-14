import { useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const location = useLocation();
  const { toasts } = useToast();

  // Auth pages must stay free of the global toast DOM tree while the auth
  // migration is in progress. This avoids React/DOM reconciliation conflicts
  // such as: removeChild ... node is not a child of this node.
  if (["/login", "/register", "/forgot-password", "/reset-password"].includes(location.pathname)) {
    return null;
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
