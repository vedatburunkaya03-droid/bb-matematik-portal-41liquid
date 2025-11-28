import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={`glass rounded-2xl p-6 shadow-lg shadow-white/5 transition-all duration-300 hover:shadow-white/10 ${
        onClick ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function GlassModal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="glass rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl shadow-white/20">
        {children}
      </div>
    </div>
  );
}

export function GlassButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) {
  const variantClasses = {
    primary: 'btn-glass',
    secondary: 'btn-glass bg-white/5',
    danger: 'btn-glass border-red-400/40 hover:border-red-400/60 hover:bg-red-500/10',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
