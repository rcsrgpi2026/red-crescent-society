"use client";

import { createContext, useContext } from "react";

const FormErrorContext = createContext<Record<string, string[]> | undefined>(
  undefined
);

export function FormErrorProvider({
  errors,
  children,
}: {
  errors?: Record<string, string[]>;
  children: React.ReactNode;
}) {
  return (
    <FormErrorContext.Provider value={errors}>
      {children}
    </FormErrorContext.Provider>
  );
}

export function FieldError({ name }: { name: string }) {
  const errors = useContext(FormErrorContext);
  if (!errors?.[name]) return null;
  return (
    <p className="mt-1 text-xs font-medium text-crescent">{errors[name][0]}</p>
  );
}
