import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Calendar, Award, Users, BookOpen } from 'lucide-react';
import Button from '../../components/Button';
import ExamTypeBadge from '../../components/ExamTypeBadge';
import examService from '../../services/examService';

const InfoCard = ({ icon: Icon, label, value, accent }) => (
  <div className="glass-card flex items-center gap-4 py-4">
    <div className={`p-2.5 rounded-xl ${accent}`}>
      <Icon size={18} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-bold text-white">{value ?? '—'}</p>
    </div>
  </div>
);

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    examService.getExamById(id)
      .then((data) => {
        setExam(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-bg-surface animate-pulse" />)}
        </div>
      </>
    );
  }

  if (!exam) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-slate-400 text-lg">Exam not found.</p>
          <Button variant="outline" onClick={() => navigate('/exams')}>Back to Exams</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/exams')}
            className="p-2 rounded-lg bg-bg-surfaceLight hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-white truncate">{exam.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ExamTypeBadge type={exam.examType} />
              <span className="text-xs text-slate-500">{exam.course?.name}</span>
              {exam.batch && <span className="text-xs text-slate-500">• {exam.batch.name}</span>}
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/exams/${id}/results`)}
            className="flex items-center gap-2 shrink-0"
          >
            <ClipboardList size={16} /> Enter Results
          </Button>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoCard
            icon={Calendar}
            label="Exam Date"
            value={exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '—'}
            accent="bg-brand"
          />
          <InfoCard icon={Award} label="Total Marks" value={exam.totalMarks} accent="bg-sky-600" />
          <InfoCard icon={Award} label="Passing Marks" value={exam.passingMarks} accent="bg-status-success" />
          <InfoCard
            icon={Users}
            label="Batch"
            value={exam.batch?.name || 'All Batches'}
            accent="bg-purple-600"
          />
        </div>

        {/* Meta section */}
        <div className="glass-card grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Course', value: exam.course?.name },
            { label: 'Course Code', value: exam.course?.code },
            { label: 'Exam Type', value: exam.examType },
            { label: 'Created By', value: exam.creator?.name },
            { label: 'Creator Role', value: exam.creator?.role },
            { label: 'Batch', value: exam.batch?.name || 'All Batches' }
          ].map(({ label, value }) => (
            <div key={label} className="bg-bg-deep/40 rounded-lg px-4 py-3">
              <p className="text-xs text-slate-500 mb-0.5">{label}</p>
              <p className="text-white font-semibold">{value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Questions section */}
        {Array.isArray(exam.questions) && exam.questions.length > 0 && (
          <div className="glass-card flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-brand" />
              <h2 className="text-base font-bold text-white">Questions ({exam.questions.length})</h2>
            </div>
            <div className="flex flex-col gap-2">
              {exam.questions.map((eq, idx) => {
                const q = eq.question;
                return (
                  <div key={eq.id || q.id} className="flex items-start gap-3 bg-bg-deep/40 rounded-lg px-4 py-3">
                    <span className="text-xs text-slate-500 mt-0.5 w-5 shrink-0">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{q.questionText}</p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        {q.subject?.name && <span>{q.subject.name}</span>}
                        {q.difficulty && <span className="capitalize">{q.difficulty.toLowerCase()}</span>}
                        {q.marks != null && <span>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExamDetailPage;
