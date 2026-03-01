"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
}

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(
    value ? new Date(`${value}T12:00:00`) : new Date(),
  );
  const popupRef = useRef<HTMLDivElement>(null);

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (value) setViewDate(new Date(`${value}T12:00:00`));
  }, [value]);

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const mm = String(currentMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${currentYear}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const displayValue = value
    ? value.split("-").reverse().join("/")
    : "Selecione uma data";

  return (
    <div className="relative w-full" ref={popupRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-bgGlassHover border text-textPrimary rounded-2xl px-4 py-3.5 text-sm flex justify-between items-center cursor-pointer transition-all ${isOpen ? "ring-2 ring-indigo-500/30 border-indigo-500/50" : "border-borderFocus hover:border-indigo-500/30"}`}
      >
        <span
          className={value ? "text-textPrimary font-medium" : "text-textFaint"}
        >
          {displayValue}
        </span>
        <CalendarIcon
          size={16}
          className={isOpen ? "text-indigo-400" : "text-textMuted"}
        />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-[110] mt-2 w-64 bg-bgPanel border border-borderFocus rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-bgSurfaceActive rounded-lg text-textMuted hover:text-textPrimary transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[13px] font-bold text-textPrimary uppercase tracking-widest">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-bgSurfaceActive rounded-lg text-textMuted hover:text-textPrimary transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] font-black text-textMuted"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const mm = String(currentMonth + 1).padStart(2, "0");
                const dd = String(day).padStart(2, "0");
                const thisDateStr = `${currentYear}-${mm}-${dd}`;
                const isSelected = value === thisDateStr;
                const isToday =
                  new Date().toISOString().split("T")[0] === thisDateStr;

                return (
                  <button
                    key={day}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectDay(day);
                    }}
                    className={`w-full aspect-square flex items-center justify-center text-[11px] font-bold rounded-lg transition-all
                      ${
                        isSelected
                          ? "bg-indigo-500 text-white shadow-md scale-105"
                          : isToday
                            ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/30"
                            : "text-textSecondary hover:bg-bgSurfaceActive hover:text-textPrimary"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
