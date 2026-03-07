import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="w-full bg-slate-900 text-white p-4 flex justify-between items-center">
      
      <h1 className="text-xl font-bold">ShieldAI</h1>

      <nav className="flex gap-6">
        <Link to="/">Home</Link>
        <Link to="/resources">Resources</Link>
        <Link to="/laws">Laws</Link>
        <Link to="/videos">Videos</Link>
      </nav>

    </header>
  );
}

export default Header;