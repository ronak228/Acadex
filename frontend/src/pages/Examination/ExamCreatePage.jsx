import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import QuestionPicker from './QuestionPicker';
import examService from '../../services/examService';
import apiClient from '../../services/apiClient';

const EXAM_TYPES = ['INTERNAL', 'EXTERNAL', 'PRACTICAL'];
const STEPS = ['Exam Details', 'Question Bank (Reference)', 'Review & Submit'];

const emptyForm = {
  title: '', courseId: '', batchId: '', examType: '',
  examDate: '', totalMarks: '', passingMarks: ''
};

const ExamCreatePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    apiClient.get('/courses').then((r) => {
      const list = r.data.data || r.data.courses || r.data || [];
      setCourses(list.filter((c) => c.isActive !== false));
    });
  }, []);

  useEffect(() => {
    if (form.courseId) {
      apiClient.get('/batches', { params: { courseId: form.courseId } }).then((r) => {
        const list = r.data.data || r.data || [];
        setBatches(list.filter((b) => b.isActive !== false));
      });
    } else {
      setBatches([]);
    }
    setForm((f) => ({ ...f, batchId: '' }));
  }, [form.courseId]);

  const today = new Date().toISOString().split('T')[0];

  const validateStep0 = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.courseId) e.courseId = 'Course is required';
    if (!form.examType) e.examType = 'Exam type is required';
    if (!form.examDate) e.examDate = 'Exam date is required';
    if (form.examDate && form.examDate < today) e.examDate = 'Exam date cannot be in the past';
    if (!form.totalMarks || Number(form.totalMarks) < 1) e.totalMarks = 'Total marks must be at least 1';
    if (!form.passingMarks || Number(form.passingMarks) < 1) e.passingMarks = 'Passing marks must be at least 1';
    if (form.totalMarks && form.passingMarks && Number(form.passingMarks) >= Number(form.totalMarks)) {
      e.passingMarks = 'Passing marks must be less than total marks';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      ...form,
      totalMarks: Number(form.totalMarks),
      passingMarks: Number(form.passingMarks),
      questionIds: selectedQuestions.map((q) => q.id)
    };
    try {
      const res = await examService.createExam(payload);
      if (res.success) {
        setAlert({ message: res.message || 'Exam created successfully!', type: 'success' });
        setTimeout(() => navigate('/exams'), 1500);
      } else {
        setAlert({ message: res.message || 'Failed to create exam.', type: 'error' });
      }
    } catch (err) {
      setAlert({ message: err.response?.data?.message || 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const field = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <>
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Create Exam</h1>
          <p className="text-xs text-slate-400">Set up a new exam for your course or batch.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, idx) => (
            <React.Fragment key={idx}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                idx === step
                  ? 'bg-brand text-white'
                  : idx < step
                  ? 'bg-status-success/20 text-status-success'
                  : 'bg-bg-surfaceLight text-slate-500'
              }`}>
                {idx < step ? <CheckCircle size={12} /> : <span>{idx + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${idx < step ? 'bg-status-success/40' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${
            alert.type === 'success'
              ? 'bg-status-success/15 border-status-success/30 text-status-success'
              : 'bg-status-danger/15 border-status-danger/30 text-status-danger'
          }`}>
            {alert.type === 'success'
              ? <CheckCircle size={18} className="shrink-0 mt-0.5" />
              : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        <div className="glass-card">
          {/* Step 0: Exam Metadata */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-300">Exam Title *</label>
                <Input placeholder="e.g. Mid-Term Examination – June 2025" value={form.title} onChange={(e) => field('title', e.target.value)} />
                {errors.title && <p className="text-xs text-status-danger">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Course *</label>
                  <Select value={form.courseId} onChange={(e) => field('courseId', e.target.value)}>
                    <option value="">Select course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  {errors.courseId && <p className="text-xs text-status-danger">{errors.courseId}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Batch <span className="text-slate-500">(optional)</span></label>
                  <Select value={form.batchId} onChange={(e) => field('batchId', e.target.value)} disabled={!form.courseId}>
                    <option value="">All Batches</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Exam Type *</label>
                  <Select value={form.examType} onChange={(e) => field('examType', e.target.value)}>
                    <option value="">Select type</option>
                    {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
                  </Select>
                  {errors.examType && <p className="text-xs text-status-danger">{errors.examType}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Exam Date *</label>
                  <Input type="date" min={today} value={form.examDate} onChange={(e) => field('examDate', e.target.value)} />
                  {errors.examDate && <p className="text-xs text-status-danger">{errors.examDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Total Marks *</label>
                  <Input type="number" min="1" value={form.totalMarks} onChange={(e) => field('totalMarks', e.target.value)} />
                  {errors.totalMarks && <p className="text-xs text-status-danger">{errors.totalMarks}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-300">Passing Marks *</label>
                  <Input type="number" min="1" value={form.passingMarks} onChange={(e) => field('passingMarks', e.target.value)} />
                  {errors.passingMarks && <p className="text-xs text-status-danger">{errors.passingMarks}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Question Picker */}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-400">Browse the question bank for reference when designing your exam. Questions are managed separately in the Question Bank module.</p>
              <QuestionPicker selected={selectedQuestions} onChange={setSelectedQuestions} />
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-slate-300 mb-1">Review before submitting</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Title', form.title],
                  ['Course', courses.find((c) => c.id === form.courseId)?.name || '—'],
                  ['Batch', batches.find((b) => b.id === form.batchId)?.name || 'All Batches'],
                  ['Type', form.examType],
                  ['Date', form.examDate],
                  ['Total Marks', form.totalMarks],
                  ['Passing Marks', form.passingMarks]
                ].map(([label, val]) => (
                  <div key={label} className="bg-bg-deep/40 rounded-lg px-4 py-3">
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="text-white font-semibold">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-800">
            <div>
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/exams')}>Cancel</Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" onClick={handleNext} className="flex items-center gap-2">
                  Next <ChevronRight size={16} />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} loading={loading}>
                  Create Exam
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExamCreatePage;
