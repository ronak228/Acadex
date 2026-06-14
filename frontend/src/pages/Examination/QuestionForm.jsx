import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import apiClient from '../../services/apiClient';

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];

const empty = { questionText: '', subjectId: '', options: ['', '', '', ''], correctAnswer: '', marks: '1', difficulty: '' };

const QuestionForm = ({ onSubmit, initialData, onClose }) => {
  const [form, setForm] = useState(empty);
  const [subjects, setSubjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/subjects').then((r) => {
      const list = r.data.subjects || r.data.data || r.data || [];
      setSubjects(list.filter((s) => s.isActive !== false));
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        questionText: initialData.questionText || '',
        subjectId: initialData.subjectId || '',
        options: Array.isArray(initialData.options) && initialData.options.length === 4
          ? [...initialData.options]
          : ['', '', '', ''],
        correctAnswer: initialData.correctAnswer || '',
        marks: initialData.marks?.toString() || '1',
        difficulty: initialData.difficulty || ''
      });
    } else {
      setForm(empty);
    }
  }, [initialData]);

  const setOption = (idx, val) => {
    const opts = [...form.options];
    opts[idx] = val;
    const correctAnswer = form.correctAnswer === form.options[idx] ? val : form.correctAnswer;
    setForm({ ...form, options: opts, correctAnswer });
  };

  const validate = () => {
    const e = {};
    if (!form.questionText.trim() || form.questionText.trim().length < 10) e.questionText = 'Question must be at least 10 characters';
    if (!form.subjectId) e.subjectId = 'Subject is required';
    if (form.options.some((o) => !o.trim())) e.options = 'All 4 options are required';
    if (!form.correctAnswer) e.correctAnswer = 'Select the correct answer';
    if (!form.options.includes(form.correctAnswer)) e.correctAnswer = 'Correct answer must match one of the options';
    if (!form.marks || isNaN(Number(form.marks)) || Number(form.marks) < 1) e.marks = 'Marks must be at least 1';
    if (!form.difficulty) e.difficulty = 'Difficulty is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ ...form, marks: Number(form.marks) });
    } catch {
      // parent handles error display
    } finally {
      setLoading(false);
    }
  };

  const filledOptions = form.options.filter((o) => o.trim());

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Question *</label>
        <textarea
          rows={3}
          placeholder="Enter question text (min 10 characters)"
          value={form.questionText}
          onChange={(e) => setForm({ ...form, questionText: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none glass-input"
        />
        {errors.questionText && <p className="text-xs text-status-danger">{errors.questionText}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Subject *</label>
          <Select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </Select>
          {errors.subjectId && <p className="text-xs text-status-danger">{errors.subjectId}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Difficulty *</label>
          <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
            <option value="">Select difficulty</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
            ))}
          </Select>
          {errors.difficulty && <p className="text-xs text-status-danger">{errors.difficulty}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Options * <span className="text-xs text-slate-500">(exactly 4)</span></label>
        <div className="grid grid-cols-2 gap-3">
          {form.options.map((opt, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <Input
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => setOption(idx, e.target.value)}
              />
            </div>
          ))}
        </div>
        {errors.options && <p className="text-xs text-status-danger">{errors.options}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Correct Answer *</label>
          <Select value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}>
            <option value="">Select correct option</option>
            {filledOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </Select>
          {errors.correctAnswer && <p className="text-xs text-status-danger">{errors.correctAnswer}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Marks *</label>
          <Input
            type="number"
            min="1"
            value={form.marks}
            onChange={(e) => setForm({ ...form, marks: e.target.value })}
          />
          {errors.marks && <p className="text-xs text-status-danger">{errors.marks}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initialData ? 'Update Question' : 'Add Question'}
        </Button>
      </div>
    </form>
  );
};

export default QuestionForm;
