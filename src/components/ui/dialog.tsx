
import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)} 
      />
      <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 z-10">
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className = '' }: DialogTitleProps) {
  return (
    <h2 className={`text-xl font-semibold mb-4 ${className}`}>
      {children}
    </h2>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className = '' }: DialogDescriptionProps) {
  return (
    <p className={`text-gray-600 mb-6 ${className}`}>
      {children}
    </p>
  );
}

interface DialogCloseProps {
  children?: React.ReactNode;
  className?: string;
}

export function DialogClose({ children, className = '' }: DialogCloseProps) {
  return (
    <button className={`inline-flex ${className}`}>
      {children || <X className="h-4 w-4" />}
    </button>
  );
}
