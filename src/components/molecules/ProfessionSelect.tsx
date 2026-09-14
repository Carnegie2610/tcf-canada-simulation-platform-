"use client";

import { useState } from "react";
import { PROFESSION_OPTIONS } from "@/lib/constants/professions";

const OTHER = "Autre";

interface ProfessionSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName: string;
  inputClassName: string;
}

export function ProfessionSelect({
  value,
  onChange,
  selectClassName,
  inputClassName,
}: ProfessionSelectProps) {
  const isKnownOption = (PROFESSION_OPTIONS as readonly string[]).includes(value);
  const [mode, setMode] = useState<"select" | "custom">(
    value !== "" && !isKnownOption ? "custom" : "select",
  );

  return (
    <div className="space-y-2">
      <select
        value={mode === "custom" ? OTHER : value}
        onChange={(e) => {
          const next = e.target.value;
          if (next === OTHER) {
            setMode("custom");
            onChange("");
          } else {
            setMode("select");
            onChange(next);
          }
        }}
        className={selectClassName}
      >
        <option value="">Profession (optionnel)</option>
        {PROFESSION_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={OTHER}>{OTHER}</option>
      </select>

      {mode === "custom" && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Précisez votre profession"
          className={inputClassName}
        />
      )}
    </div>
  );
}
