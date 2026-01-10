import { useI18n } from '@/i18n';

const Index = () => {
  const { strings } = useI18n();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">{strings.index.title}</h1>
        <p className="text-xl text-muted-foreground">{strings.index.subtitle}</p>
      </div>
    </div>
  );
};

export default Index;
