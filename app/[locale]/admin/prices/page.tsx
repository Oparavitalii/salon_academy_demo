import { asc } from 'drizzle-orm';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { AdminShell, adminMetadata } from '@/components/AdminShell/AdminShell';
import type { Locale } from '@/i18n/routing';
import { requireUser } from '@/lib/auth/session';
import { serviceGroups } from '@/lib/content/salon';
import { db } from '@/lib/db/client';
import { services } from '@/lib/db/schema';

import { updateServiceGroup } from '../_actions';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ msg?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return adminMetadata(params, 'prices.title');
}

/**
 * `/admin/prices` «Прайс салону» (owner 31.10.2026 regroup): the salon prices only — the course
 * prices moved to «Курси». One folded card per group (seeded from Booksy 19.10.2026; strings as on
 * /salon — «1 100 zł», «від 400 / 450 zł», «2 год») and one «Зберегти групу» instead of a button
 * per row. Saving revalidates /salon, no deploy. Was `/admin/services` (308 → here).
 */
export default async function AdminPrices({ params, searchParams }: Props) {
  const { locale } = await params;
  const { msg } = await searchParams;
  await requireUser(locale, 'admin');
  const ta = await getTranslations({ locale, namespace: 'admin' });
  const rows = await db.select().from(services).orderBy(asc(services.position));

  return (
    <AdminShell
      locale={locale}
      active='/admin/prices'
      title={ta('prices.title')}
      msg={msg}
    >
      <p className='note'>{ta('prices.services.note')}</p>
      {serviceGroups.map((g) => {
        // Only rows the site still shows: an old DB row (D-22: slavic, four-hands) edits nothing.
        const gr = rows.filter(
          (r) => r.groupId === g.id && g.services.some((s) => s.id === r.id),
        );
        if (!gr.length) return null;
        const name = g.name[locale] ?? g.name.uk;
        return (
          <details
            key={g.id}
            id={`group-${g.id}`}
            className='card app_section svc_group'
          >
            <summary>
              <h2>
                {name} <span className='tag'>{gr.length}</span>
              </h2>
              <span className='choose_caret' aria-hidden='true' />
            </summary>
            <form action={updateServiceGroup}>
              <input type='hidden' name='locale' value={locale} />
              <div
                className='table_wrap'
                role='region'
                aria-label={name}
                tabIndex={0}
              >
                <table className='data_table data_stack'>
                  <thead>
                    <tr>
                      <th>{ta('prices.services.thService')}</th>
                      <th>{ta('prices.services.thFields')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gr.map((r) => (
                      <tr key={r.id}>
                        <td className='cell_title'>{r.name}</td>
                        <td className='cell_block'>
                          <input type='hidden' name='service' value={r.id} />
                          <div className='inline_form edit_form edit_form_service'>
                            <label className='mini_field'>
                              <span className='mini_label'>
                                {ta('prices.services.masterPlaceholder')}
                              </span>
                              <input
                                name={`master:${r.id}`}
                                defaultValue={r.masterPrice ?? ''}
                                aria-label={ta('prices.services.masterAria', {
                                  name: r.name,
                                })}
                                placeholder={ta(
                                  'prices.services.masterPlaceholder',
                                )}
                              />
                            </label>
                            <label className='mini_field'>
                              <span className='mini_label'>
                                {ta('prices.services.topPlaceholder')}
                              </span>
                              <input
                                name={`top:${r.id}`}
                                defaultValue={r.topPrice ?? ''}
                                aria-label={ta('prices.services.topAria', {
                                  name: r.name,
                                })}
                                placeholder={ta(
                                  'prices.services.topPlaceholder',
                                )}
                              />
                            </label>
                            <label className='mini_field'>
                              <span className='mini_label'>
                                {ta('prices.services.durationPlaceholder')}
                              </span>
                              <input
                                name={`duration:${r.id}`}
                                defaultValue={r.duration ?? ''}
                                aria-label={ta('prices.services.durationAria', {
                                  name: r.name,
                                })}
                                placeholder={ta(
                                  'prices.services.durationPlaceholder',
                                )}
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='svc_save'>
                <button type='submit' className='btn'>
                  {ta('prices.services.saveGroup')}
                </button>
              </div>
            </form>
          </details>
        );
      })}
    </AdminShell>
  );
}
