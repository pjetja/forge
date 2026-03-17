'use client';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

interface Tab {
  key: string;
  label: string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
}

export function TabSwitcher({ tabs, activeTab }: TabSwitcherProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  function handleTabClick(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-6 border-b border-border mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => handleTabClick(tab.key)}
          className={
            tab.key === activeTab
              ? 'text-accent border-b-2 border-accent font-bold text-sm pb-2 cursor-pointer'
              : 'text-text-primary opacity-60 text-sm pb-2 hover:opacity-100 transition-opacity cursor-pointer'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
