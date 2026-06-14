import React, { useState, useEffect } from 'react';
import Select from '../../components/Select';
import Input from '../../components/Input';
import DifficultyBadge from '../../components/DifficultyBadge';
import questionService from '../../services/questionService';
import apiClient from '../../services/apiClient';

const QuestionPicker = ({ selected = [], onChange }) => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/subjects').then((r) => {
      const list = r.data.subjects || r.data.data || r.data || [];
      setSubjects(list.filter((s) => s.isActive !== false));
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filterSubject) params.subjectId = filterSubject;
    if (filterDifficulty) params.difficulty = filterDifficulty;
    if (search.trim()) params.search = search.trim();
    questionService.getQuestions(params).then((data) => {
      const list = data.data || data.questions || data || [];
      setQuestions(Array.isArray(list) ? list : []);
      setLoading(false);
    });
  }, [filterSubject, filterDifficulty, search]);

  const toggle = (qId) => {
    if (selected.includes(qId)) {
      onChange(selected.filter((id) => id !== qId));
    } else {
      onChange([...selected, qId]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-3">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="min-w-[160px]">
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} className="min-w-[140px]">
          <option value="">All Difficulties</option>
          {['EASY', 'MEDIUM', 'HARD'].map((d) => (
            <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
          ))}
        </Select>
      </div>

      <p className="text-xs text-slate-400">{selected.length} question(s) selected</p>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-bg-deep/60 animate-pulse" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No questions found.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {questions.map((q) => {
            const isSelected = selected.includes(q.id);
            return (
              <label
                key={q.id}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                  isSelected
                    ? 'bg-brand/10 border-brand/40'
                    : 'bg-bg-deep/40 border-slate-700/40 hover:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(q.id)}
                  className="mt-0.5 accent-brand shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate" title={q.questionText}>{q.questionText}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-400">{q.subject?.name}</span>
                    <DifficultyBadge difficulty={q.difficulty} />
                    <span className="text-[11px] text-slate-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionPicker;
