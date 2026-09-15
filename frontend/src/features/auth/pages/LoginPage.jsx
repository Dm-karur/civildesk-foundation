import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Activity, Users, IndianRupee, Package, Building2 } from 'lucide-react';
import { Button, Input, Checkbox } from '../../../components/ui';
import { FormField } from '../../../components/composite/FormField';
import { toast } from '../../../components/composite/Toast';
import { useAuth } from '../context/AuthContext';
import loginImage from '../../../assets/loginpageimage.jpg';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState({});

  // Clear any existing session when the login page loads only if the user was authenticated on mount
  useEffect(() => {
    if (isAuthenticated) {
      logout().catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.identifier) newErrors.identifier = 'Username or email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await login(formData.identifier, formData.password, formData.remember);

      // Check if the server returned HTML (often happens when the proxy hits a default index.php or 404 page)
      if (typeof response === 'string' && response.includes('<html')) {
        throw new Error('API route not found on the server (returned HTML).');
      }

      // Check if the backend returns a 200 OK but with an error flag in the JSON
      if (response?.error || response?.success === false || response?.status === 'error' || response?.status === false) {
        throw new Error(response?.message || response?.error || 'Invalid credentials');
      }

      // If we expect a token or user object and didn't get one, assume failure
      if (response && !response.token && !response.access_token && !response.user && !response.data) {
        throw new Error(response?.message || 'Invalid credentials. No token received.');
      }

      toast.success('Successfully logged in');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'Please check your credentials and try again.';
      toast.error('Failed to log in', { description: errorMessage });
      setFormData(prev => ({ ...prev, password: '' }));
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="h-[100dvh] overflow-hidden flex w-full bg-[#F8F9FC] font-sans">
      {/* Left Panel - Hidden on smaller screens */}
      <div className="hidden lg:flex relative w-1/2 flex-col overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={loginImage}
            alt="Construction Site"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0D2216]/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D2216] via-[#0D2216]/60 to-[#0D2216]/20" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-center h-full px-12 xl:px-20 max-w-[650px] w-full">
          {/* Logo Branding */}
          <div className="flex items-center gap-4 mb-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-md shrink-0">
              <img src="/ks.png" alt="KS Construction" className="h-full w-full object-contain" />
            </div>
            <span className="text-[32px] font-bold tracking-tight text-white">KS Construction</span>
          </div>

          <h1 className="text-[36px] font-bold leading-[1.2] text-white mb-6">
            Construction Management<br />Made Simple
          </h1>
          <div className="w-12 h-[3px] bg-primary mb-8" />
          <p className="text-[16px] text-[#C8D1DC] leading-relaxed mb-16">
            Manage your projects, teams, materials and<br />
            costs efficiently. Real-time visibility.<br />
            Smarter decisions.
          </p>

          {/* Bottom Features */}
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col items-start gap-4 text-left">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center border border-primary/30 text-primary">
                <Activity className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-white/90">Project<br />Tracking</span>
            </div>

            <div className="flex flex-col items-start gap-4 text-left">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center border border-primary/30 text-primary">
                <Users className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-white/90">Labour<br />Management</span>
            </div>

            <div className="flex flex-col items-start gap-4 text-left">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center border border-primary/30 text-primary">
                <Package className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-white/90">Material<br />Management</span>
            </div>

            <div className="flex flex-col items-start gap-4 text-left">
              <div className="w-[48px] h-[48px] rounded-xl flex items-center justify-center border border-primary/30 text-primary">
                <IndianRupee className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium text-white/90">Cost<br />Control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-0 sm:p-8 md:p-12 lg:p-24 relative z-10 bg-[#F8F9FC] h-full overflow-y-auto">
        <div className="w-full max-w-[440px] px-4 sm:px-0 flex flex-col py-8">
          {/* Mobile Logo (only visible on mobile) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8 flex-shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm border border-border shrink-0">
              <img src="/ks.png" alt="KS Construction" className="h-full w-full object-contain" />
            </div>
            <span className="text-2xl font-bold text-[#172033] tracking-tight">KS Construction</span>
          </div>

          <div className="bg-surface rounded-2xl p-6 sm:p-8 md:p-10 shadow-sm border border-border w-full flex-shrink-0">
            <div className="text-center mb-8">
              <h2 className="text-[24px] sm:text-[28px] font-bold text-[#172033] mb-2">Welcome Back!</h2>
              <p className="text-[#535D6D] text-[14px] sm:text-[15px]">Sign in to your KS Construction account</p>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">

              <FormField label="Username or Email" error={errors.identifier} htmlFor="identifier">
                <Input
                  id="identifier"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  className="h-11"
                  autoComplete="username"
                  disabled={isLoading}
                  leftIcon={<Mail className="h-[18px] w-[18px]" />}
                />
              </FormField>

              <FormField label="Password" error={errors.password} htmlFor="password">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="h-11"
                  autoComplete="current-password"
                  disabled={isLoading}
                  leftIcon={<Lock className="h-[18px] w-[18px]" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pointer-events-auto text-text-placeholder hover:text-text-secondary focus:outline-none cursor-pointer"
                      disabled={isLoading}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  }
                />
              </FormField>

              <div className="flex items-center justify-between mt-1 mb-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  label="Remember me"
                  checked={formData.remember}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <a href="#" className="text-[14px] font-semibold text-primary hover:text-primary-dark transition-colors">
                  Forgot Password?
                </a>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-11 text-[15px] font-semibold"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-8 text-center flex items-center justify-center border-t border-border pt-8">
              <p className="text-[13px] text-[#7B8492]">
                &copy; {currentYear} KS Construction. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
