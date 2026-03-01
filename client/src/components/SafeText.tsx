import { useMemo } from 'react';

// Client-side word mapping for league-safe terminology
const WORD_MAP: Record<string, string> = {
  'bet': 'challenge',
  'bets': 'challenges', 
  'betted': 'challenged',
  'betting': 'challenging',
  'gamble': 'play',
  'gambling': 'competitive play',
  'odds': 'skill rating',
  'wager': 'challenge',
  'wagers': 'challenges',
  'wagered': 'challenged',
  'wagering': 'challenging',
  'escrow': 'hold',
  'pot': 'pool',
  'pots': 'pools',
  'jackpot': 'prize pool',
  'stake': 'entry fee',
  'stakes': 'entry fees',
  'ante': 'entry fee',
  'bankroll': 'balance',
  'house edge': 'platform fee',
  'bookmaker': 'operator',
  'bookie': 'operator',
  'punter': 'player',
  'punters': 'players',
  'lucky': 'skilled',
  'unlucky': 'less skilled',
  'gambler': 'competitor',
  'gamblers': 'competitors',
  'casino': 'venue',
  'sportsbook': 'league platform',
};

function sanitizeText(input: string): string {
  if (typeof input !== 'string') return String(input ?? '');
  const pattern = new RegExp(`\\b(${Object.keys(WORD_MAP).join('|')})\\b`, 'gi');
  return input.replace(pattern, (match) => {
    const lowerMatch = match.toLowerCase();
    const replacement = WORD_MAP[lowerMatch];

    if (!replacement) return match;

    // Preserve original casing
    if (match === match.toUpperCase()) {
      return replacement.toUpperCase();
    } else if (match[0] === match[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
    } else {
      return replacement.toLowerCase();
    }
  });
}

interface SafeTextProps {
  children: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * SafeText component automatically sanitizes text content to replace
 * gambling terms with league-safe alternatives
 */
export function SafeText({ children, className, as: Component = 'span' }: SafeTextProps) {
  const sanitizedText = useMemo(() => sanitizeText(children), [children]);

  return (
    <Component className={className} data-testid="safe-text">
      {sanitizedText}
    </Component>
  );
}

/**
 * Hook for sanitizing text in components
 */
export function useSafeText(text: string): string {
  return useMemo(() => sanitizeText(text), [text]);
}

/**
 * Utility function for sanitizing text outside of React components
 */
export function sanitizeForDisplay(text: string): string {
  return sanitizeText(text);
}

/**
 * SafeText wrapper for headings
 */
export function SafeHeading({ children, level = 1, className }: { 
  children: string; 
  level?: 1 | 2 | 3 | 4 | 5 | 6; 
  className?: string; 
}) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  return <SafeText as={Component} className={className}>{children}</SafeText>;
}

/**
 * SafeText wrapper for paragraphs
 */
export function SafeParagraph({ children, className }: { children: string; className?: string }) {
  return <SafeText as="p" className={className}>{children}</SafeText>;
}

/**
 * SafeText wrapper for buttons
 */
export function SafeButton({ 
  children, 
  className, 
  onClick,
  disabled,
  type = 'button',
  ...props 
}: { 
  children: string; 
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}) {
  const sanitizedText = useSafeText(children);
  return (
    <button 
      type={type}
      className={className} 
      onClick={onClick} 
      disabled={disabled}
      data-testid="safe-button"
      {...props}
    >
      {sanitizedText}
    </button>
  );
}

// Default export for backwards compatibility
export default function SafeTextDefault({ children }: { children: string }) {
  return <SafeText>{children}</SafeText>;
}

// Export the sanitize function for direct use
export { sanitizeText };