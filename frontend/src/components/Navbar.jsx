import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bell, Menu, Settings, ShieldAlert, LogOut, ChevronDown,
  KeyRound, CheckCircle2, Mail, Search, X, User,
  GraduationCap, Users, ClipboardList, DollarSign,
  BookOpen, AlertCircle
} from 'lucide-react';
import authService from '../services/authService';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';

/* ─── Brand Name ──────────────────────────────── */
const BrandMark = () => (
  <Link to="/dashboard" className="flex items-center gap-2 group">
    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center shadow-lg shadow-brand/20 shrink-0">
      <GraduationCap size={15} className="text-white" />
    </div>
    <span className="text-lg font-extrabold font-heading bg-gradient-to-r from-brand-light to-white bg-clip-text text-transparent hidden sm:inline-block">
      Acadex
    </span>
  </Link>
);

/* ─── Global Search ───────────────────────────── */
const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const isMac = navigator.platform.toUpperCase().includes('MAC') || navigator.userAgent.includes('Mac');

  // Open with Ctrl+K / ⌘K
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const quickLinks = [
    { label: 'Students', href: '/students', icon: Users },
    { label: 'Inquiries', href: '/inquiries', icon: ClipboardList },
    { label: 'Fee Collection', href: '/fees/collect', icon: DollarSign },
    { label: 'Exams', href: '/exams', icon: BookOpen },
    { label: 'Due Fees', href: '/fees/due', icon: AlertCircle },
  ];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/60 bg-slate-800/40 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all text-sm group"
      >
        <Search size={14} />
        <span className="text-xs">Search...</span>
        <kbd className="ml-6 text-[10px] text-slate-600 bg-slate-900 border border-slate-700 rounded px-1 py-0.5">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
      </button>

      {/* Mobile search icon */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
      >
        <Search size={18} />
      </button>

      {/* Command palette overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 shadow-2xl animate-scaleIn z-10 overflow-hidden p-0" style={{ background: 'rgb(15, 23, 42)' }}>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search students, fees, exams..."
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              )}
              <kbd className="text-[10px] text-slate-600 bg-slate-900/80 border border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* Quick links */}
            <div className="p-2">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">
                Quick Navigation
              </p>
              {quickLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                  >
                    <Icon size={15} className="text-slate-500" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ─── Notification Panel ──────────────────────── */
const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const notifications = [];
  const unread = 0;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-danger opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-status-danger" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl border border-slate-700/60 shadow-2xl py-0 overflow-hidden animate-slideDown z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Notifications</span>
            {unread > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand/20 text-brand-light font-semibold border border-brand/30">
                {unread} new
              </span>
            )}
          </div>

          <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
            <Bell size={22} className="text-slate-700" />
            <p className="text-xs text-slate-500">No notifications</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Profile Menu ────────────────────────────── */
const ProfileMenu = ({ user, onOpen }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-brand-dark border border-brand/40 flex items-center justify-center text-white font-bold text-xs">
          {initials}
        </div>
        <ChevronDown size={13} className={`text-slate-400 hidden sm:block transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700/60 shadow-2xl py-0 overflow-hidden animate-slideDown z-50" style={{ background: 'rgb(15, 23, 42)', backgroundColor: 'rgb(15, 23, 42)' }}>
          <div className="px-4 py-3 border-b border-slate-800">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/20 text-brand-light border border-brand/30 uppercase">
              {user.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="p-1">
            <button
              onClick={() => { setOpen(false); onOpen('profile'); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors text-left"
            >
              <User size={14} className="text-slate-500" />
              My Profile
            </button>
            <button
              onClick={() => { setOpen(false); onOpen('security'); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors text-left"
            >
              <Settings size={14} className="text-slate-500" />
              Quick Settings
            </button>
          </div>

          <div className="p-1 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-status-danger/10 hover:text-status-danger transition-colors text-left font-medium"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Account Settings Modal ─────────────────── */
const AccountSettingsModal = ({ isOpen, onClose, initialTab = 'profile', user, onProfileUpdated }) => {
  const [tab, setTab] = useState(initialTab);

  // Profile tab state
  const [name, setName]   = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profileError, setProfileError]     = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secError, setSecError]     = useState('');
  const [secSuccess, setSecSuccess] = useState('');
  const [secLoading, setSecLoading] = useState(false);

  // Sync tab when opened from different entry points
  useEffect(() => { if (isOpen) setTab(initialTab); }, [isOpen, initialTab]);

  const handleClose = () => {
    setProfileError(''); setProfileSuccess('');
    setSecError(''); setSecSuccess('');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    onClose();
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileError(''); setProfileSuccess('');
    if (!name.trim()) { setProfileError('Name is required.'); return; }
    setProfileLoading(true);
    try {
      await authService.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setProfileSuccess('Profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setSecError(''); setSecSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) { setSecError('All fields are required.'); return; }
    if (newPassword.length < 8) { setSecError('New password must be at least 8 characters.'); return; }
    if (newPassword === currentPassword) { setSecError('New password must differ from current.'); return; }
    if (newPassword !== confirmPassword) { setSecError('Passwords do not match.'); return; }
    setSecLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setSecSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setSecError(err.response?.data?.message || 'Failed to update password. Check your current password.');
    } finally {
      setSecLoading(false);
    }
  };

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  const tabBtn = (id, label, Icon) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        tab === id
          ? 'bg-brand/20 text-brand-light border border-brand/30'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
      }`}
    >
      <Icon size={12} />
      {label}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Account Settings"
      description="Manage your profile and security"
      size="md"
    >
      <div className="flex flex-col gap-4 mt-1">
        {/* Avatar + name card */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-deep/50 border border-slate-800/60">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold border border-brand/40 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{user.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Mail size={11} className="text-slate-500 shrink-0" />
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <span className="ml-auto shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/20 text-brand-light border border-brand/30 uppercase">
            {user.role?.replace('_', ' ')}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabBtn('profile', 'Profile', User)}
          {tabBtn('security', 'Security', KeyRound)}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <form onSubmit={handleProfileSave} className="flex flex-col gap-3.5">
            <Input
              label="Full Name"
              name="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Input
              label="Phone"
              name="phone"
              type="text"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={user.email}
              disabled
              helperText="Email cannot be changed"
            />
            {profileError && (
              <div className="flex gap-2 p-3 rounded-lg bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs">
                <ShieldAlert size={13} className="shrink-0 mt-0.5" /><span>{profileError}</span>
              </div>
            )}
            {profileSuccess && (
              <div className="flex gap-2 p-3 rounded-lg bg-status-success/10 border border-status-success/20 text-status-success text-xs">
                <CheckCircle2 size={13} className="shrink-0 mt-0.5" /><span>{profileSuccess}</span>
              </div>
            )}
            <Button type="submit" loading={profileLoading} className="w-full">
              Save Profile
            </Button>
          </form>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <form onSubmit={handlePasswordSave} className="flex flex-col gap-3.5">
            <Input label="Current Password" name="currentPassword" type="password" placeholder="••••••••"
              value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            <Input label="New Password" name="newPassword" type="password" placeholder="••••••••"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} helperText="Minimum 8 characters" />
            <Input label="Confirm New Password" name="confirmPassword" type="password" placeholder="••••••••"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            {secError && (
              <div className="flex gap-2 p-3 rounded-lg bg-status-danger/10 border border-status-danger/20 text-status-danger text-xs">
                <ShieldAlert size={13} className="shrink-0 mt-0.5" /><span>{secError}</span>
              </div>
            )}
            {secSuccess && (
              <div className="flex gap-2 p-3 rounded-lg bg-status-success/10 border border-status-success/20 text-status-success text-xs">
                <CheckCircle2 size={13} className="shrink-0 mt-0.5" /><span>{secSuccess}</span>
              </div>
            )}
            <Button type="submit" loading={secLoading} className="w-full">
              Update Password
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
};

/* ─── Navbar ──────────────────────────────────── */
const Navbar = ({ onToggleSidebar }) => {
  const [localUser, setLocalUser] = useState(
    () => authService.getLocalUser() || { name: 'User', email: 'user@acadex.com', role: 'STUDENT' }
  );
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');

  const handleOpen = (tab) => {
    setSettingsTab(tab);
    setShowSettings(true);
  };

  const handleProfileUpdated = () => {
    const fresh = authService.getLocalUser();
    if (fresh) setLocalUser(fresh);
  };

  return (
    <>
      <nav className="fixed top-0 z-50 w-full h-14 bg-bg-surface/85 border-b border-slate-700/40 backdrop-blur-md">
        <div className="h-full px-4 md:px-5 flex items-center justify-between gap-4">

          {/* Left: Hamburger + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={19} />
            </button>
            <BrandMark />
          </div>

          {/* Center: Search */}
          <div className="flex-1 flex justify-center max-w-sm">
            <GlobalSearch />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <ProfileMenu user={localUser} onOpen={handleOpen} />
          </div>
        </div>
      </nav>

      <AccountSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialTab={settingsTab}
        user={localUser}
        onProfileUpdated={handleProfileUpdated}
      />
    </>
  );
};

export default Navbar;
