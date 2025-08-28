import { redirect } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";

export const requireAuth = () => {
  const { isAuthenticated } = useAuthStore.getState();
  
  if (!isAuthenticated) {
    throw redirect("/login");
  }
  
  return null;
};

export const requireGuest = () => {
  const { isAuthenticated } = useAuthStore.getState();
  
  if (isAuthenticated) {
    throw redirect("/");
  }
  
  return null;
};