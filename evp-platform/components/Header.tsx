import Globe from './Globe';
export default function Header({ name, role }: { name?: string; role?: string }) {
  return (
    <header className="hd">
      <div className="logo"><Globe /><div><b>Expert Vacation Planners</b><span>Command Center</span></div></div>
      <nav className="nav">
        <a href="/dashboard">Dashboard</a>
        <a href="/pipeline">Pipeline</a>
        <a href="/trips">Trips</a>
      </nav>
      <div className="sp" />
      <span className="who">{name} · {role}</span>
      <a href="/logout" className="btn sm">Sign out</a>
    </header>
  );
}
