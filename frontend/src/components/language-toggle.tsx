"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  const languages: { value: Locale; label: string; flag: string }[] = [
    { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { value: "en", label: "English", flag: "🇺🇸" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Languages className="h-4 w-4" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => setLocale(lang.value)}
            className="flex items-center gap-2"
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
            {locale === lang.value && (
              <span className="ml-auto w-1.5 h-1.5 bg-teal-500 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
