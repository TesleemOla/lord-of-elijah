'use client'

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative z-50 w-full max-w-lg glass-panel p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}
