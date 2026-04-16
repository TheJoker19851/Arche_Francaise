"use client";

import { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminContent from "./AdminContent";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AdminContent />;
}
