import Link from 'next/link';

type PageHeaderProps = {
  title: string;
  description?: string;
  cta?: {
    label: string;
    href: string;
  };
};

export function PageHeader({ title, description, cta }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-surface px-6 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}












