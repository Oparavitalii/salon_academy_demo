'use client';

import { useActionState, useId } from 'react';

import {
  changePassword,
  requestPasswordReset,
  resetPassword,
  saveProfile,
  type ForgotState,
  type PasswordState,
} from '@/app/[locale]/_actions/account';
import { Link } from '@/i18n/navigation';

export type PasswordLabels = {
  current?: string;
  password: string;
  repeat: string;
  submit: string;
  done?: string;
  errors: {
    tooShort: string;
    mismatch: string;
    wrongCurrent: string;
    expired: string;
    blocked?: string;
  };
  /** Shown next to «expired»: link back to /forgot-password. */
  again?: string;
};

/**
 * Password_Form / Password_New — one form for three cases:
 * `settings` (current + new + repeat), `forced` (after a temporary password), `reset` (token).
 */
export function PasswordForm({
  mode,
  locale,
  token,
  labels,
}: {
  mode: 'settings' | 'forced' | 'reset';
  locale: string;
  token?: string;
  labels: PasswordLabels;
}) {
  const id = useId();
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    mode === 'reset' ? resetPassword : changePassword,
    null,
  );
  const err = state?.error
    ? (labels.errors[state.error] ?? labels.errors.expired)
    : null;

  return (
    <form className='app_form' action={action}>
      <input type='hidden' name='locale' value={locale} />
      <input type='hidden' name='mode' value={mode} />
      {token && <input type='hidden' name='token' value={token} />}
      {mode === 'settings' && labels.current && (
        <div className='field'>
          <label htmlFor={`${id}-cur`}>{labels.current}</label>
          <input
            id={`${id}-cur`}
            type='password'
            name='current'
            autoComplete='current-password'
            required
          />
        </div>
      )}
      <div className='field'>
        <label htmlFor={`${id}-new`}>{labels.password}</label>
        <input
          id={`${id}-new`}
          type='password'
          name='password'
          autoComplete='new-password'
          minLength={8}
          required
        />
      </div>
      <div className='field'>
        <label htmlFor={`${id}-rep`}>{labels.repeat}</label>
        <input
          id={`${id}-rep`}
          type='password'
          name='repeat'
          autoComplete='new-password'
          minLength={8}
          required
        />
      </div>
      {err && (
        <p className='form_msg form_msg_error' role='alert'>
          {err}{' '}
          {state?.error === 'expired' && labels.again && (
            <Link href='/forgot-password' className='hv-link'>
              {labels.again}
            </Link>
          )}
        </p>
      )}
      {state?.ok && labels.done && (
        <p className='form_msg' role='status'>
          {labels.done}
        </p>
      )}
      <button type='submit' className='btn hv-btn-glow' disabled={pending}>
        {labels.submit}
      </button>
    </form>
  );
}

export function ForgotForm({
  locale,
  labels,
}: {
  locale: string;
  labels: { email: string; submit: string; sent: string };
}) {
  const id = useId();
  const [state, action, pending] = useActionState<ForgotState, FormData>(
    requestPasswordReset,
    null,
  );
  return (
    <form className='app_form' action={action}>
      <input type='hidden' name='locale' value={locale} />
      <div className='field'>
        <label htmlFor={`${id}-email`}>{labels.email}</label>
        <input
          id={`${id}-email`}
          type='email'
          name='email'
          autoComplete='email'
          inputMode='email'
          required
        />
      </div>
      {state?.sent && (
        <p className='form_msg' role='status'>
          {labels.sent}
        </p>
      )}
      <button type='submit' className='btn hv-btn-glow' disabled={pending}>
        {labels.submit}
      </button>
    </form>
  );
}

/** Profile_Form (09_Cab_Settings): name for the certificate, phone; e-mail read-only. */
export function ProfileForm({
  name,
  phone,
  email,
  labels,
}: {
  name: string;
  phone: string;
  email: string;
  labels: {
    name: string;
    phone: string;
    email: string;
    emailHint: string;
    save: string;
    saved: string;
  };
}) {
  const id = useId();
  const [state, action, pending] = useActionState<
    { ok?: boolean } | null,
    FormData
  >(saveProfile, null);
  return (
    <form className='app_form' action={action}>
      <div className='field'>
        <label htmlFor={`${id}-name`}>{labels.name}</label>
        <input
          id={`${id}-name`}
          name='name'
          defaultValue={name}
          autoComplete='name'
          maxLength={120}
        />
      </div>
      <div className='field'>
        <label htmlFor={`${id}-email`}>{labels.email}</label>
        <input id={`${id}-email`} value={email} readOnly />
        <p className='field_hint'>{labels.emailHint}</p>
      </div>
      <div className='field'>
        <label htmlFor={`${id}-phone`}>{labels.phone}</label>
        <input
          id={`${id}-phone`}
          name='phone'
          type='tel'
          defaultValue={phone}
          autoComplete='tel'
          maxLength={40}
        />
      </div>
      {state?.ok && (
        <p className='form_msg' role='status'>
          {labels.saved}
        </p>
      )}
      <button type='submit' className='btn hv-btn-glow' disabled={pending}>
        {labels.save}
      </button>
    </form>
  );
}
