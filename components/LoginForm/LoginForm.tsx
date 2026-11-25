'use client';

import { useActionState, useId } from 'react';

import { login, type LoginState } from '@/app/[locale]/_actions/account';
import { Link } from '@/i18n/navigation';

type Props = {
  locale: string;
  heading: string;
  sub: string;
  email: string;
  emailHint: string;
  password: string;
  forgot: string;
  submit: string;
  noCourse: string;
  chooseCourse: string;
  /** Link to /privacy on the form (9.0_Legal.md → Handoff). */
  privacy: string;
  errors: { invalid: string; rate: string; blocked: string };
  /** Banner from `?reason=` (session ended elsewhere / account blocked). */
  notice?: string;
};

/**
 * Login_Form — one login for students and the admin (Decisions 19.10.2026); the server action
 * redirects by role. The card carries the neon frame `.dec_frame` (8.0 §5; `.dec_corners` retired).
 */
export function LoginForm(p: Props) {
  const id = useId();
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );
  const error = state?.error ? p.errors[state.error] : null;

  return (
    <div className='login'>
      <form className='card' action={action}>
        <input type='hidden' name='locale' value={p.locale} />
        <div>
          <h1 className='display display_md auth_title'>{p.heading}</h1>
          <p className='note'>{p.sub}</p>
        </div>
        {p.notice && !error && (
          <p className='form_msg' role='status'>
            {p.notice}
          </p>
        )}
        {error && (
          <p className='form_msg form_msg_error' role='alert'>
            {error}
          </p>
        )}
        <div className='field'>
          <label htmlFor={`${id}-email`}>{p.email}</label>
          <input
            id={`${id}-email`}
            type='email'
            name='email'
            autoComplete='email'
            inputMode='email'
            required
          />
          <p className='field_hint'>{p.emailHint}</p>
        </div>
        <div className='field'>
          <label htmlFor={`${id}-password`}>{p.password}</label>
          <input
            id={`${id}-password`}
            type='password'
            name='password'
            autoComplete='current-password'
            required
          />
        </div>
        <Link href='/forgot-password' className='note hv-link'>
          {p.forgot}
        </Link>
        <button
          type='submit'
          className='btn btn_block hv-btn-glow'
          disabled={pending}
        >
          {p.submit}
        </button>
        <p className='note'>
          {p.noCourse}{' '}
          <Link href='/courses' className='hv-link link_accent'>
            {p.chooseCourse}
          </Link>
        </p>
        <p className='note'>
          <Link href='/privacy' className='hv-link legal_link'>
            {p.privacy}
          </Link>
        </p>
      </form>
    </div>
  );
}
