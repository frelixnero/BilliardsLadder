interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "neon";
}

export function LoadingSpinner({ size = "md", color = "primary" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const colorClasses = {
    primary: "border-primary",
    secondary: "border-secondary",
    neon: "border-neon-green"
  };

  return (
    <div
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full`}
      data-testid="loading-spinner"
      aria-label="Loading"
    />
  );
}
