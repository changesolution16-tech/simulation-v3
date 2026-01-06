type Language = 'en' | 'es';

export const formatDate = (date: Date | string, language: Language = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const locale = language === 'es' ? 'es-DO' : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

export const formatDateTime = (date: Date | string, language: Language = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const locale = language === 'es' ? 'es-DO' : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

export const formatNumber = (num: number, language: Language = 'en'): string => {
  const locale = language === 'es' ? 'es-DO' : 'en-US';

  return new Intl.NumberFormat(locale).format(num);
};

export const formatPercent = (num: number, language: Language = 'en'): string => {
  const locale = language === 'es' ? 'es-DO' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(num / 100);
};

export const formatRelativeTime = (date: Date | string, language: Language = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      if (language === 'es') {
        return diffInMinutes === 0 ? 'Justo ahora' : `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
      }
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    if (language === 'es') {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    }
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  if (diffInDays < 7) {
    if (language === 'es') {
      return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
    }
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    if (language === 'es') {
      return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
    }
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    if (language === 'es') {
      return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(diffInDays / 365);
  if (language === 'es') {
    return `Hace ${years} año${years !== 1 ? 's' : ''}`;
  }
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

export const getPluralSuffix = (count: number, language: Language = 'en'): string => {
  if (language === 'es') {
    return count === 1 ? '' : 's';
  }
  return count === 1 ? '' : 's';
};
