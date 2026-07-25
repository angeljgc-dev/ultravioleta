/* GlitchText — adaptado de React Bits (reactbits.dev) © David Haz, MIT License.
   Fondo de pseudoelementos ajustado al basalto violeta de la marca. */
import type { FC, CSSProperties } from "react";

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  className?: string;
}

interface CustomCSSProperties extends CSSProperties {
  "--after-duration": string;
  "--before-duration": string;
  "--after-shadow": string;
  "--before-shadow": string;
}

const GlitchText: FC<GlitchTextProps> = ({
  children,
  speed = 0.5,
  enableShadows = true,
  className = "",
}) => {
  const inlineStyles: CustomCSSProperties = {
    "--after-duration": `${speed * 3}s`,
    "--before-duration": `${speed * 2}s`,
    "--after-shadow": enableShadows ? "-5px 0 #FF2EA6" : "none",
    "--before-shadow": enableShadows ? "5px 0 #2EE6FF" : "none",
  };

  return (
    <div
      style={inlineStyles}
      data-text={children}
      className={`relative mx-auto select-none font-black text-tinta motion-reduce:after:hidden motion-reduce:before:hidden after:content-[attr(data-text)] after:absolute after:top-0 after:left-[6px] after:text-tinta after:bg-fondo after:overflow-hidden after:[clip-path:inset(0_0_0_0)] after:[text-shadow:var(--after-shadow)] after:animate-glitch-after before:content-[attr(data-text)] before:absolute before:top-0 before:left-[-6px] before:text-tinta before:bg-fondo before:overflow-hidden before:[clip-path:inset(0_0_0_0)] before:[text-shadow:var(--before-shadow)] before:animate-glitch-before ${className}`}
    >
      {children}
    </div>
  );
};

export default GlitchText;
