import React, { useState, useEffect } from 'react';
import { Mail, Lock, GraduationCap, ArrowRight } from 'lucide-react';
import Input from '../../components/Input';
import Button from '../../components/Button';

const REMEMBER_KEY = 'acadex_remembered_email';

const LoginForm = ({ onSubmit, loading }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) { setEmail(saved); setRemember(true); }
  }, []);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (remember) localStorage.setItem(REMEMBER_KEY, email);
    else localStorage.removeItem(REMEMBER_KEY);
    onSubmit({ email, password });
  };

  // Allow Enter to progress through fields
  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('password')?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Form header */}
      <div className="flex flex-col gap-1">
        <div className="lg:hidden flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-lg font-extrabold font-heading text-white">Acadex</span>
        </div>
        <h2 className="text-xl font-extrabold font-heading text-white">Welcome back</h2>
        <p className="text-sm text-slate-400">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="you@acadex.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={Mail}
          error={errors.email}
          onKeyDown={handleEmailKeyDown}
          autoFocus
          required
        />

        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={Lock}
          error={errors.password}
          required
        />

        <div className="flex items-center justify-between text-xs mt-0.5">
          <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 text-brand accent-brand cursor-pointer"
            />
            <span className="group-hover:text-slate-300 transition-colors">Remember me</span>
          </label>
          <span className="text-slate-600 italic text-[11px]">Contact admin to reset</span>
        </div>

        <Button type="submit" loading={loading} className="w-full mt-1 gap-2 py-2.5">
          {!loading && <ArrowRight size={15} />}
          Sign In
        </Button>
      </form>

      <p className="text-center text-[11px] text-slate-600">
        Acadex Unified Education Management Platform
      </p>
    </div>
  );
};

export default LoginForm;
