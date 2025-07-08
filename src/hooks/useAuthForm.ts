// src/hooks/useAuthForm.ts
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEncryption } from "@/lib/encryption-context";
import { useState } from "react";
import { loginSchema, signupSchema, type LoginFormValues, type SignupFormValues } from "@/lib/auth-schemas";

interface UseAuthFormProps {
  mode: "login" | "signup";
}

export function useAuthForm({ mode }: UseAuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setPassphrase } = useEncryption();
  
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveredPassphrase, setRecoveredPassphrase] = useState<string>("");
  const [recoveryKeyDialog, setRecoveryKeyDialog] = useState<{ 
    isOpen: boolean; 
    recoveryKey: string; 
  }>({ isOpen: false, recoveryKey: "" });

  const form = useForm<LoginFormValues | SignupFormValues>({
    resolver: zodResolver(mode === "signup" ? signupSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
      passphrase: "",
      ...(mode === "signup" && {
        pseudonym: "",
        confirmPassphrase: "",
      }),
      ...(mode === "login" && {
        recoveryKey: "",
      }),
    },
  });

  const toggleRecoveryMode = () => {
    setIsRecoveryMode(!isRecoveryMode);
    setRecoveredPassphrase("");
    form.reset();
  };

  return {
    form,
    router,
    toast,
    setPassphrase,
    isRecoveryMode,
    setIsRecoveryMode,
    recoveredPassphrase,
    setRecoveredPassphrase,
    recoveryKeyDialog,
    setRecoveryKeyDialog,
    toggleRecoveryMode,
  };
}
