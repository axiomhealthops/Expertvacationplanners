import { loginPassword, sendMagic } from './actions';
import Globe from '../../components/Globe';
export default function Login({ searchParams }: { searchParams: { error?: string; sent?: string } }) {
  return (
    <main className="auth">
      <div className="card">
        <div className="brand"><Globe /><div><b>Expert Vacation Planners</b><span>Command Center</span></div></div>
        {searchParams?.error ? <p className="err">{searchParams.error}</p> : null}
        {searchParams?.sent ? <p className="ok">Magic link sent — check your email.</p> : null}
        <form>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" /></label>
          <button className="btn" formAction={loginPassword}>Sign in</button>
          <button className="btn ghost" formAction={sendMagic}>Email me a magic link</button>
        </form>
      </div>
    </main>
  );
}
