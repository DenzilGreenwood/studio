// src/components/auth/auth-form.tsx
"use client";

import { useForm, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Form } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { AuthFormProps, LoginFormValues, SignupFormValues, loginSchema, signupSchema } from "@/lib/auth-schemas";
import { AuthFormHeader } from "./AuthFormHeader";
import { RecoveryModeAlert } from "./RecoveryModeAlert";
import { PassphraseRecoveryDisplay } from "./PassphraseRecoveryDisplay";
import {
  EmailField,
  PasswordField,
  PassphraseField,
  RecoveryKeyField,
  SignupFields,
  RecoveryKeyDialog,
  AuthFormActions,
  useAuthFormLogic
} from "./authComponents";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false);
  const [recoveryKeyDialog, setRecoveryKeyDialog] = useState<{ isOpen: boolean; recoveryKey: string; }>({ isOpen: false, recoveryKey: "" });
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveredPassphrase, setRecoveredPassphrase] = useState<string>("");

  const toggleRecoveryMode = () => setIsRecoveryMode(!isRecoveryMode);

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

  const { onSubmit } = useAuthFormLogic({
    mode,
    form,
    isRecoveryMode,
    setRecoveredPassphrase,
    setRecoveryKeyDialog,
    router
  });

  const handleDialogClose = () => {
    setRecoveryKeyDialog({ isOpen: false, recoveryKey: "" });
    // After signup and seeing recovery key, redirect to profile
    if (mode === "signup") {
      router.push("/profile");
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
        <Card className="w-full max-w-md shadow-2xl">
          <AuthFormHeader mode={mode} />
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <RecoveryModeAlert isRecoveryMode={isRecoveryMode} />

                <EmailField control={form.control} />
                <PasswordField control={form.control} />

                <PassphraseField 
                  control={form.control}
                  showPassphrase={showPassphrase}
                  onToggleVisibility={() => setShowPassphrase(!showPassphrase)}
                  isRecoveryMode={isRecoveryMode}
                />

                <RecoveryKeyField 
                  control={form.control as Control<LoginFormValues>}
                  isRecoveryMode={isRecoveryMode}
                />

                {mode === "signup" && (
                  <SignupFields
                    control={form.control as Control<SignupFormValues>}
                    showConfirmPassphrase={showConfirmPassphrase}
                    onToggleConfirmVisibility={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                  />
                )}

                <PassphraseRecoveryDisplay recoveredPassphrase={recoveredPassphrase} />

                <AuthFormActions
                  mode={mode}
                  isSubmitting={form.formState.isSubmitting}
                  isRecoveryMode={isRecoveryMode}
                  onToggleRecoveryMode={toggleRecoveryMode}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <RecoveryKeyDialog
        isOpen={recoveryKeyDialog.isOpen}
        recoveryKey={recoveryKeyDialog.recoveryKey}
        onClose={handleDialogClose}
      />
    </>
  );
}

