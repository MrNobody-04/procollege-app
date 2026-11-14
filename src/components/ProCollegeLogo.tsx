import React from 'react';

interface ProCollegeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark-only' | 'light-text' | 'dark-text' | 'crimson-text' | 'proschool';
  brandName?: 'ProSchool' | 'ProCollege';
  showSlogan?: boolean;
}

export const ProCollegeLogo: React.FC<ProCollegeLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'dark-text',
  brandName = 'ProCollege',
  showSlogan = false
}) => {
  const sizeMap = {
    sm: { mark: 'w-7 h-7', text: 'text-base', slogan: 'text-[9px]' },
    md: { mark: 'w-9 h-9', text: 'text-xl', slogan: 'text-[10px]' },
    lg: { mark: 'w-12 h-12', text: 'text-2xl', slogan: 'text-xs' },
    xl: { mark: 'w-16 h-16', text: 'text-3xl', slogan: 'text-sm' },
  };

  const isLight = variant === 'light-text';
  const isCrimson = variant === 'crimson-text';
  const isProSchool = brandName === 'ProSchool' || variant === 'proschool';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Vector Emblem matching the ProCollege graduation cap & P monogram */}
      <div className={`relative ${sizeMap[size].mark} shrink-0 drop-shadow-sm`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id={isCrimson ? "proCollegeGradCrimson" : isProSchool ? "proSchoolGrad" : "proCollegeGrad"} x1="0%" y1="0%" x2="100%" y2="100%">
              {isCrimson ? (
                <>
                  <stop offset="0%" stopColor="#6e0706" />
                  <stop offset="35%" stopColor="#D41514" />
                  <stop offset="85%" stopColor="#f03837" />
                  <stop offset="100%" stopColor="#CDCBCA" />
                </>
              ) : isProSchool ? (
                <>
                  <stop offset="0%" stopColor="#4338CA" />
                  <stop offset="35%" stopColor="#4F46E5" />
                  <stop offset="85%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#818CF8" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1e3a8a" />
                  <stop offset="35%" stopColor="#2563eb" />
                  <stop offset="85%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </>
              )}
            </linearGradient>
            <linearGradient id={isCrimson ? "capGradCrimson" : isProSchool ? "capGradProSchool" : "capGrad"} x1="0%" y1="0%" x2="100%" y2="100%">
              {isCrimson ? (
                <>
                  <stop offset="0%" stopColor="#121214" />
                  <stop offset="100%" stopColor="#D41514" />
                </>
              ) : isProSchool ? (
                <>
                  <stop offset="0%" stopColor="#312E81" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#1e3a8a" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Graduation Cap (Mortarboard) */}
          <path
            d="M50 10 L88 24 L50 38 L12 24 Z"
            fill={isCrimson ? "url(#capGradCrimson)" : isProSchool ? "url(#capGradProSchool)" : "url(#capGrad)"}
            stroke={isCrimson ? "#D41514" : isProSchool ? "#4F46E5" : "#1e3a8a"}
            strokeWidth="1.5"
          />
          {/* Cap Skull Base */}
          <path
            d="M26 29 V37 C26 44 74 44 74 37 V29"
            fill="none"
            stroke={isCrimson ? "#D41514" : isProSchool ? "#4F46E5" : "#1e3a8a"}
            strokeWidth="2"
          />
          {/* Tassel */}
          <path
            d="M20 27 C16 33 15 42 16 48"
            stroke={isCrimson ? "#CDCBCA" : isProSchool ? "#818CF8" : "#2563eb"}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="50" r="2.5" fill={isCrimson ? "#CDCBCA" : isProSchool ? "#818CF8" : "#2563eb"} />

          {/* Stylized "P" Stem & Bowl */}
          <path
            d="M30 38 H64 C76 38 84 46 84 56 C84 66 76 74 64 74 H44 V88 C44 91 42 93 39 93 H35 C32 93 30 91 30 88 V38 Z"
            fill={isCrimson ? "url(#proCollegeGradCrimson)" : isProSchool ? "url(#proSchoolGrad)" : "url(#proCollegeGrad)"}
          />

          {/* Internal Academic Book Lines (3 curved waveforms) */}
          <path
            d="M44 47 Q56 46 68 50"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M44 56 Q56 55 68 59"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M44 65 Q56 64 66 67"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Bottom Dynamic Swoosh */}
          <path
            d="M12 74 C16 85 32 92 46 91 C32 95 18 89 12 74 Z"
            fill={isCrimson ? "#D41514" : "#06b6d4"}
          />
        </svg>
      </div>

      {/* Brand Text */}
      {variant !== 'mark-only' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center">
            {isCrimson ? (
              <span className={`font-black tracking-tight ${sizeMap[size].text} text-[#CDCBCA]`}>
                Pro<span className="text-[#D41514]">College</span>
              </span>
            ) : isProSchool ? (
              <span
                className={`font-black tracking-tight ${sizeMap[size].text} ${
                  isLight ? 'text-white' : 'text-[#1E1B4B]'
                }`}
              >
                Pro<span className="text-[#4F46E5]">School</span>
              </span>
            ) : (
              <span
                className={`font-black tracking-tight ${sizeMap[size].text} ${
                  isLight ? 'text-white' : 'text-[#0f172a]'
                }`}
              >
                Pro<span className="text-[#2563eb]">College</span>
              </span>
            )}
          </div>

          {showSlogan && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`font-semibold tracking-wider uppercase text-[8px] sm:text-[9px] ${
                  isCrimson ? 'text-[#CDCBCA]/70' : isLight ? 'text-zinc-400' : isProSchool ? 'text-[#6366F1]' : 'text-zinc-500'
                }`}
              >
                {isProSchool ? 'Learn · Collaborate · Excel' : 'Manage · Organize · Excel'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
