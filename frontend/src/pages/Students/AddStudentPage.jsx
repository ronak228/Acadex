import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, GraduationCap, Phone, Mail,
  UserPlus, ChevronRight, ChevronLeft,
  Check, ShieldAlert, CheckCircle2
} from 'lucide-react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import studentService from '../../services/studentService';
import authService from '../../services/authService';
import { useEffect } from 'react';

/* ─── Step Indicator ─────────────────────────── */
const steps = [
  { id: 1, label: 'Personal',  icon: User },
  { id: 2, label: 'Academic',  icon: GraduationCap },
  { id: 3, label: 'Guardian',  icon: Phone },
  { id: 4, label: 'Account',   icon: Mail },
];

const StepIndicator = ({ current }) => (
  <div className="flex items-center gap-0 w-full max-w-2xl mx-auto mb-8">
    {steps.map((step, idx) => {
      const Icon = step.icon;
      const done    = current > step.id;
      const active  = current === step.id;
      const pending = current < step.id;

      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className={`
              w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 text-sm font-bold
              ${done   ? 'bg-brand border-brand text-white'        : ''}
              ${active ? 'bg-brand/20 border-brand-light text-brand-light scale-110' : ''}
              ${pending ? 'bg-transparent border-slate-700 text-slate-600' : ''}
            `}>
              {done ? <Check size={16} strokeWidth={3} /> : <Icon size={15} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${
              active ? 'text-brand-light' : done ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div className={`flex-1 h-px mb-6 transition-all duration-500 ${done ? 'bg-brand' : 'bg-slate-800'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* ─── Step Section wrapper ───────────────────── */
const StepSection = ({ title, subtitle, children }) => (
  <div className="glass-panel flex flex-col gap-5 animate-fadeIn">
    <div className="border-b border-slate-800/80 pb-3">
      <h3 className="text-base font-bold text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ─── Inline field error ─────────────────────── */
const FieldError = ({ error }) =>
  error ? <p className="text-xs text-status-danger font-medium -mt-1">{error}</p> : null;

/* ─── Main Page ──────────────────────────────── */
const AddStudentPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || { role: 'FACULTY' };

  useEffect(() => {
    if (currentUser.role === 'FACULTY') navigate('/students');
  }, [currentUser, navigate]);

  const [step, setStep]   = useState(1);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);

  const [formData, setFormData] = useState({
    name: '', dateOfBirth: '', gender: '', address: '', phone: '',
    courseId: '', batchId: '',
    parentName: '', parentPhone: '',
    email: '',
  });

  const [errors,        setErrors]        = useState({});
  const [loading,       setLoading]       = useState(false);
  const [submitError,   setSubmitError]   = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    studentService.getCourses().then(data =>
      setCourses(data.map(c => ({ value: c.id, label: c.name })))
    );
  }, []);

  useEffect(() => {
    if (formData.courseId) {
      studentService.getBatches(formData.courseId).then(data =>
        setBatches(data.map(b => ({ value: b.id, label: b.name })))
      );
    } else {
      setBatches([]);
    }
    setFormData(prev => ({ ...prev, batchId: '' }));
  }, [formData.courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  /* Per-step validation */
  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!formData.name.trim()) e.name = 'Full name is required';
      if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) e.gender = 'Gender is required';
      if (!formData.phone.trim()) e.phone = 'Phone number is required';
    }
    if (s === 2) {
      if (!formData.courseId) e.courseId = 'Course is required';
      if (!formData.batchId) e.batchId = 'Batch is required';
    }
    if (s === 3) {
      if (!formData.parentName.trim()) e.parentName = 'Guardian name is required';
      if (!formData.parentPhone.trim()) e.parentPhone = 'Guardian phone is required';
    }
    if (s === 4) {
      if (!formData.email.trim()) e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Valid email required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(s => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await studentService.createStudent(formData);
      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => navigate('/students'), 2200);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to register student. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">

        <PageHeader
          breadcrumb={[{ label: 'Students', href: '/students' }, { label: 'New Registration' }]}
          title="New Student Registration"
          subtitle="Complete each step to create the student profile and portal credentials."
        />

        {/* Stepper */}
        <StepIndicator current={step} />

        {/* Error Banner */}
        {submitError && (
          <div className="flex gap-2.5 p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/25 text-status-danger text-sm animate-fadeIn">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Success Banner */}
        {submitSuccess && (
          <div className="flex gap-2.5 p-3.5 rounded-xl bg-status-success/10 border border-status-success/25 text-status-success text-sm animate-fadeIn">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>Student enrolled successfully! Redirecting to registry...</span>
          </div>
        )}

        {/* ── Step 1: Personal ── */}
        {step === 1 && (
          <StepSection title="Personal Details" subtitle="Basic identity and contact information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Full Name" name="name" placeholder="e.g. Priya Sharma"
                value={formData.name} onChange={handleChange} error={errors.name} required />
              <Input label="Date of Birth" name="dateOfBirth" type="date"
                value={formData.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} required />
              <Select label="Gender" name="gender"
                options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]}
                value={formData.gender} onChange={handleChange} error={errors.gender}
                placeholder="Select Gender" required />
              <Input label="Phone Number" name="phone" placeholder="e.g. 9876543210"
                value={formData.phone} onChange={handleChange} error={errors.phone} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Residential Address</label>
              <textarea
                name="address" rows={3} placeholder="123 Main Street, City, State - PIN"
                value={formData.address} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg text-sm glass-input resize-none"
              />
            </div>
          </StepSection>
        )}

        {/* ── Step 2: Academic ── */}
        {step === 2 && (
          <StepSection title="Academic Program" subtitle="Assign the student to a course and batch">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Course" name="courseId" options={courses}
                value={formData.courseId} onChange={handleChange} error={errors.courseId}
                placeholder="Select Course" required />
              <Select label="Batch" name="batchId" options={batches}
                value={formData.batchId} onChange={handleChange} error={errors.batchId}
                placeholder={formData.courseId ? 'Select Batch' : 'Select a course first'}
                disabled={!formData.courseId} required />
            </div>
            {formData.courseId && !formData.batchId && (
              <p className="text-xs text-slate-500">Select the batch the student will join for this course.</p>
            )}
          </StepSection>
        )}

        {/* ── Step 3: Guardian ── */}
        {step === 3 && (
          <StepSection title="Parent / Guardian" subtitle="Emergency contact and guardian information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Guardian Full Name" name="parentName" placeholder="e.g. Rajesh Sharma"
                value={formData.parentName} onChange={handleChange} error={errors.parentName} required />
              <Input label="Guardian Phone" name="parentPhone" placeholder="e.g. 9876543211"
                value={formData.parentPhone} onChange={handleChange} error={errors.parentPhone} required />
            </div>
          </StepSection>
        )}

        {/* ── Step 4: Account ── */}
        {step === 4 && (
          <StepSection title="Portal Account" subtitle="The student will use this email to log in. A temporary password will be auto-generated.">
            <Input
              label="Student Email Address" name="email" type="email"
              placeholder="student@example.com"
              value={formData.email} onChange={handleChange} error={errors.email}
              icon={Mail}
              helperText={`Temporary password: STUD@<RollNumber> — student must change on first login.`}
              required
            />
          </StepSection>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-1">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              <ChevronLeft size={16} /> Previous
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate('/students')} disabled={loading}>
              Cancel
            </Button>
          )}

          {step < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="primary"
              loading={loading}
              disabled={submitSuccess}
              onClick={handleSubmit}
            >
              <UserPlus size={15} />
              Complete Enrollment
            </Button>
          )}
        </div>

        {/* Step summary text */}
        <p className="text-center text-xs text-slate-600">
          Step {step} of {steps.length} — {steps[step - 1].label}
        </p>

      </div>
    </>
  );
};

export default AddStudentPage;
