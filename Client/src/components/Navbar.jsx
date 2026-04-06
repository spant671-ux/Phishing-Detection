import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const path = location.pathname;

  const linkClass = (target) =>
    path === target
      ? 'text-[#c06050] border-b border-[#c06050] pb-1'
      : 'text-[#9a8e80] hover:text-[#e8e0d4] transition-colors';

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-[#1a1a22]/90 backdrop-blur-md border-b border-[#c06050]/10">
      <Link to="/" className="flex items-center gap-3 no-underline">
        <span className="material-symbols-outlined text-[#c06050]" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
        <h1 style={{ fontFamily: "'IBM Plex Sans', sans-serif" }} className="tracking-wider uppercase text-base font-bold text-[#c06050]">PhishGuard</h1>
      </Link>
      <nav className="hidden md:flex items-center gap-8 font-medium text-sm" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Link className={linkClass('/')} to="/">Overview</Link>
        <Link className={linkClass('/reports')} to="/reports">Reports</Link>
        <Link className={linkClass('/settings')} to="/settings">Settings</Link>
      </nav>
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold uppercase text-[#6b6058] tracking-wider" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Secured User</p>
          <p className="text-xs text-[#e8e0d4]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>Alex Sentinel</p>
        </div>
        <div className="w-9 h-9 rounded-full border border-[#c06050]/20 p-0.5 overflow-hidden">
          <img alt="User Profile" className="w-full h-full object-cover rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS28WRIA2eYwv9u8HNFcOHD2KEkYxgUlbBYC7wGGMJDa2yVNDod3g7smVeJV_QNb55JGQ7SCp8koCmASMiVhtwwl4iUv_KyBcmEJ0C_9t3qzFUSTsC_CEGVXO4Agjhy6w69VJ9tzZbCbzvHh1C8YxTp9dpH1jDOkhEJbLSuIJDxNviaijDJ_i1_W3lGOZYbhnAyIe3cdxHAm4q8oQCqtjNL3D-V-4pdC4X0rXkOULSbsMNQVopP9OQUaJ_ddhgszVBS1z4HS00CKKu"/>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
