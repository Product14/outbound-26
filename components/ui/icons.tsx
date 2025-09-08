import { Phone, Calendar, DollarSign, Bot, User, Clock, Star, Play, Radio } from "lucide-react"

// Custom Live icon component - clean fluent design with precise animation
export const LiveIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className={className}
  >
    <style>
      {`
        .wave-inner {
          animation: liveWavePulse 2s ease-in-out infinite;
          transform-origin: 8px 8px;
        }
        .wave-middle {
          animation: liveWavePulse 2s ease-in-out infinite 0.4s;
          transform-origin: 8px 8px;
        }
        .wave-outer {
          animation: liveWavePulse 2s ease-in-out infinite 0.8s;
          transform-origin: 8px 8px;
        }
        @keyframes liveWavePulse {
          0%, 100% { 
            opacity: 0.3; 
            transform: scale(0.8); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.1); 
          }
        }
      `}
    </style>
    
    {/* Center dot - static (broadcast source) */}
    <circle 
      cx="8" 
      cy="8" 
      r="1.5" 
      fill="currentColor"
    />
    
    {/* Inner wave arcs - start the pulse */}
    <g className="wave-inner">
      <path 
        d="M 6 8 A 2 2 0 0 1 10 8" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round"
      />
      <path 
        d="M 6 8 A 2 2 0 0 0 10 8" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round"
      />
    </g>
    
    {/* Middle wave arcs - pulse 0.4s later */}
    <g className="wave-middle">
      <path 
        d="M 4.5 8 A 3.5 3.5 0 0 1 11.5 8" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round"
      />
      <path 
        d="M 4.5 8 A 3.5 3.5 0 0 0 11.5 8" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round"
      />
    </g>
    
    {/* Outer wave arcs - pulse 0.8s later */}
    <g className="wave-outer">
      <path 
        d="M 3 8 A 5 5 0 0 1 13 8" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round"
      />
      <path 
        d="M 3 8 A 5 5 0 0 0 13 8" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        fill="none" 
        strokeLinecap="round"
      />
    </g>
  </svg>
)

export { Phone, Calendar, DollarSign, Bot, User, Clock, Star, Play, Radio }
