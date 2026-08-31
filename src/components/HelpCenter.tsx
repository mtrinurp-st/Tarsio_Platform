import { useState } from 'react';
import { translate } from '@/lib/i18n';
import type { Language } from '@/lib/types';
import { ChevronDown, Search, Mail } from 'lucide-react';

type FAQItem = { q: string; a: string; cat: string };
type Category = { id: string; label: string; items: FAQItem[] };

export function HelpCenter({ lang }: { lang: Language }) {
  const t = (k: string, p?: Record<string, string | number>) => translate(lang, k, p);
  const [query, setQuery] = useState('');
  const [openItem, setOpenItem] = useState<string | null>(null);

  const categories: Category[] = [
    {
      id: 'gettingStarted',
      label: t('help.cat.gettingStarted'),
      items: [
        { cat: 'gettingStarted', q: t('help.q1'), a: t('help.a1') },
        { cat: 'gettingStarted', q: t('help.q2'), a: t('help.a2') },
        { cat: 'gettingStarted', q: t('help.q3'), a: t('help.a3') },
        { cat: 'gettingStarted', q: t('help.q4'), a: t('help.a4') },
      ],
    },
    {
      id: 'account',
      label: t('help.cat.account'),
      items: [
        { cat: 'account', q: t('help.q5'), a: t('help.a5') },
        { cat: 'account', q: t('help.q6'), a: t('help.a6') },
      ],
    },
    {
      id: 'circle',
      label: t('help.cat.circle'),
      items: [
        { cat: 'circle', q: t('help.q7'), a: t('help.a7') },
        { cat: 'circle', q: t('help.q8'), a: t('help.a8') },
      ],
    },
    {
      id: 'privacy',
      label: t('help.cat.privacy'),
      items: [
        { cat: 'privacy', q: t('help.q9'), a: t('help.a9') },
        { cat: 'privacy', q: t('help.q10'), a: t('help.a10') },
        { cat: 'privacy', q: t('help.q11'), a: t('help.a11') },
      ],
    },
  ];

  const filtered = query.trim()
    ? categories
        .map((c) => ({
          ...c,
          items: c.items.filter(
            (item) =>
              item.q.toLowerCase().includes(query.toLowerCase()) ||
              item.a.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((c) => c.items.length > 0)
    : categories;

  return (
    <section className="help-view">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t('nav.help')}</span>
          <h2>{t('help.title')}</h2>
          <p className="section-subtitle">{t('help.subtitle')}</p>
        </div>
      </div>

      <div className="help-search-wrap">
        <Search size={18} className="help-search-icon" />
        <input
          type="text"
          className="help-search-input"
          placeholder={t('help.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="help-categories">
        {filtered.map((cat) => (
          <div className="help-category" key={cat.id}>
            <h3>{cat.label}</h3>
            <div className="help-items">
              {cat.items.map((item, i) => {
                const key = `${cat.id}-${i}`;
                const isOpen = openItem === key;
                return (
                  <button
                    className={`help-item ${isOpen ? 'open' : ''}`}
                    key={key}
                    onClick={() => setOpenItem(isOpen ? null : key)}
                  >
                    <div className="help-item-q">
                      <span>{item.q}</span>
                      <ChevronDown size={18} className={`help-chevron ${isOpen ? 'rotated' : ''}`} />
                    </div>
                    {isOpen && <p className="help-item-a">{item.a}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="help-contact">
        <Mail size={18} />
        <span>{t('help.contactUs')}</span>
        <a href="mailto:hello@tarsio.app">hello@tarsio.app</a>
      </div>
    </section>
  );
}
