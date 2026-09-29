import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { getPersistedLogo } from '../utils/logoStorage';

interface TeamLogoProps {
  id?: string | number;
  logo?: string;
  name?: string;
  className?: string;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({
  id,
  logo,
  name,
  className = 'w-7 h-7',
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error when logo or id changes
  useEffect(() => {
    setHasError(false);
  }, [logo, id]);

  // Resolve logo from prop or persistent store
  const effectiveLogo =
    typeof logo === 'string' && logo.trim() !== ''
      ? logo
      : getPersistedLogo(id, name);

  if (effectiveLogo && typeof effectiveLogo === 'string' && effectiveLogo.trim() !== '' && !hasError) {
    return (
      <img
        src={effectiveLogo}
        alt={name || 'Team Logo'}
        className={`${className} rounded-full object-cover bg-white ring-1 ring-black/5 shrink-0`}
        referrerPolicy="no-referrer"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-[#f3f4f6] border border-[#e5e7eb] text-gray-500 flex items-center justify-center font-bold shrink-0 select-none shadow-2xs`}
      title={name}
    >
      <Shield className="w-[52%] h-[52%] text-gray-400 stroke-[2]" />
    </div>
  );
};
