/* DecryptedText: adaptado de React Bits (reactbits.dev) © David Haz, MIT License. */
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

interface DecryptedTextProps extends HTMLMotionProps<"span"> {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  parentClassName?: string;
  animateOn?: "view" | "hover";
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_+",
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "view",
  ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [hasAnimated, setHasAnimated] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(true);

  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo<string[]>(() => characters.split(""), [characters]);

  const shuffleText = useCallback(
    (originalText: string, currentRevealed: Set<number>) =>
      originalText
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (currentRevealed.has(i)) return originalText[i];
          return availableChars[Math.floor(Math.random() * availableChars.length)];
        })
        .join(""),
    [availableChars]
  );

  const triggerDecrypt = useCallback(() => {
    setRevealedIndices(new Set());
    setIsDecrypted(false);
    setIsAnimating(true);
  }, []);

  useEffect(() => {
    if (!isAnimating) return;

    let currentIteration = 0;

    const getNextIndex = (revealedSet: Set<number>): number => {
      const len = text.length;
      switch (revealDirection) {
        case "end":
          return len - 1 - revealedSet.size;
        case "center": {
          const middle = Math.floor(len / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const next = revealedSet.size % 2 === 0 ? middle + offset : middle - offset - 1;
          if (next >= 0 && next < len && !revealedSet.has(next)) return next;
          for (let i = 0; i < len; i++) if (!revealedSet.has(i)) return i;
          return 0;
        }
        default:
          return revealedSet.size;
      }
    };

    intervalRef.current = setInterval(() => {
      setRevealedIndices((prev) => {
        if (sequential) {
          if (prev.size < text.length) {
            const next = getNextIndex(prev);
            const nuevo = new Set(prev);
            nuevo.add(next);
            setDisplayText(shuffleText(text, nuevo));
            return nuevo;
          }
          clearInterval(intervalRef.current ?? undefined);
          setIsAnimating(false);
          setIsDecrypted(true);
          return prev;
        }
        setDisplayText(shuffleText(text, prev));
        currentIteration++;
        if (currentIteration >= maxIterations) {
          clearInterval(intervalRef.current ?? undefined);
          setIsAnimating(false);
          setDisplayText(text);
          setIsDecrypted(true);
        }
        return prev;
      });
    }, speed);

    return () => clearInterval(intervalRef.current ?? undefined);
  }, [isAnimating, text, speed, maxIterations, sequential, revealDirection, shuffleText]);

  useEffect(() => {
    if (animateOn !== "view") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            /* respeta reduced-motion: sin animación, el texto queda plano */
            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              setHasAnimated(true);
              return;
            }
            triggerDecrypt();
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [animateOn, hasAnimated, triggerDecrypt]);

  const hoverProps =
    animateOn === "hover"
      ? {
          onMouseEnter: () => {
            if (!isAnimating && !matchMedia("(prefers-reduced-motion: reduce)").matches)
              triggerDecrypt();
          },
        }
      : {};

  return (
    <motion.span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      {...hoverProps}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, index) => {
          const revelada = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          return (
            <span key={index} className={revelada ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
