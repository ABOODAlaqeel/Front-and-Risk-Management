import React from 'react';
import { useI18n } from '@/i18n';

export const Footer: React.FC = () => {
  const { strings } = useI18n();

  return (
    <footer className="py-4 px-6 border-t border-border bg-background/50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>{strings.footer.copyright}</p>
        <div className="flex items-center gap-4">
          <span>{strings.footer.version}</span>
          <span>•</span>
          <span>{strings.footer.lastUpdated}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
