import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Receipt, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import FeePaymentBadge from '../../components/FeePaymentBadge';
import InstallmentTimeline from '../../components/InstallmentTimeline';
import feeService from '../../services/feeService';
import apiClient from '../../services/apiClient';
import authService from '../../services/authService';
import studentService from '../../services/studentService';

const fmt = (v) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const AssignFeeModal = ({ studentId, courseId, onClose, onSuccess }) => {
  const [structures, setStructures] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [form, setForm] = useState({ feeStructureId: '', discountId: '', scholarshipId: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    Promise.all([
      feeService.getStructures({ isActive: true, ...(courseId && { courseId }) }),
      feeService.getDiscounts(),
      feeService.getScholarships()
    ]).then(([sr, dr, scr]) => {
      setStructures(sr.data || []);
      setDiscounts((dr.data || []).filter((d) => d.isActive));
      setScholarships((scr.data || []).filter((s) => s.isActive));
    });
  }, []);

  useEffect(() => {
    if (!form.feeStructureId) { setPreview(null); return; }
    const struct = structures.find((s) => s.id === form.feeStructureId);
    if (!struct) return;
    let net = parseFloat(struct.totalAmount);
    const disc = discounts.find((d) => d.id === form.discountId);
    const schol = scholarships.find((s) => s.id === form.scholarshipId);
    if (disc) net -= disc.type === 'PERCENTAGE' ? parseFloat(struct.totalAmount) * parseFloat(disc.value) / 100 : parseFloat(disc.value);
    if (schol) net -= schol.type === 'PERCENTAGE' ? parseFloat(struct.totalAmount) * parseFloat(schol.value) / 100 : parseFloat(schol.value);
    setPreview({ total: parseFloat(struct.totalAmount), net: Math.max(0, parseFloat(net.toFixed(2))) });
  }, [form, structures, discounts, scholarships]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.feeStructureId) { setErrors({ feeStructureId: 'Select a fee structure.' }); return; }
    setLoading(true);
    try {
      await feeService.assignFee({
        studentId,
        feeStructureId: form.feeStructureId,
        discountId: form.discountId || undefined,
        scholarshipId: form.scholarshipId || undefined
      });
      onSuccess('Fee assigned successfully.');
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to assign fee.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errors.submit && <p className="text-xs text-status-danger bg-status-danger/10 p-2 rounded-lg">{errors.submit}</p>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Fee Structure *</label>
        <select
          value={form.feeStructureId}
          onChange={(e) => setForm((f) => ({ ...f, feeStructureId: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
        >
          <option value="">Select fee structure</option>
          {structures.map((s) => <option key={s.id} value={s.id}>{s.name} — {fmt(s.totalAmount)}</option>)}
        </select>
        {errors.feeStructureId && <p className="text-xs text-status-danger">{errors.feeStructureId}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Discount (optional)</label>
        <select
          value={form.discountId}
          onChange={(e) => setForm((f) => ({ ...f, discountId: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
        >
          <option value="">None</option>
          {discounts.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.type === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`})</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Scholarship (optional)</label>
        <select
          value={form.scholarshipId}
          onChange={(e) => setForm((f) => ({ ...f, scholarshipId: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input"
        >
          <option value="">None</option>
          {scholarships.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.type === 'PERCENTAGE' ? `${s.value}%` : `₹${s.value}`})</option>)}
        </select>
      </div>

      {preview && (
        <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <p>Total: <span className="text-white font-semibold">{fmt(preview.total)}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Net Payable</p>
            <p className="text-lg font-extrabold text-brand-light">{fmt(preview.net)}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" loading={loading}>Assign Fee</Button>
      </div>
    </form>
  );
};

const StudentFeePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentUser = authService.getLocalUser() || {};
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  const fromDueFees = searchParams.get('fromDueFees') === 'true';

  const [studentSearch, setStudentSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3500);
  };

  // Auto-load for STUDENT role — load their own fees immediately
  useEffect(() => {
    if (currentUser.role !== 'STUDENT') return;
    setLoading(true);
    studentService.getMyStudent()
      .then((s) => { if (s?.id) loadStudentFees(s); })
      .catch(() => setLoading(false));
  }, []);

  // Auto-load student when navigated with ?studentId=
  useEffect(() => {
    if (currentUser.role === 'STUDENT') return; // handled above
    const sid = searchParams.get('studentId');
    if (!sid) return;
    setLoading(true);
    apiClient.get(`/students/${sid}`)
      .then((r) => {
        const s = r.data.data || r.data;
        if (s?.id) loadStudentFees(s);
      })
      .catch(() => setLoading(false));
  }, []);

  const searchStudents = async () => {
    if (!studentSearch.trim()) return;
    setSearching(true);
    try {
      const res = await apiClient.get('/students', { params: { search: studentSearch } });
      const list = res.data.students || res.data.data || res.data || [];
      setStudents(list.slice(0, 8));
    } catch {
      setStudents([]);
    } finally {
      setSearching(false);
    }
  };

  const loadStudentFees = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      const [feeRes, dueRes] = await Promise.all([
        feeService.getStudentFee(student.id),
        feeService.getStudentDueFees(student.id)
      ]);
      setStudentFees(feeRes.data || []);
      setOverdueItems(dueRes.data || []);
    } catch {
      setStudentFees([]);
      setOverdueItems([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPayments = (payments) =>
    payments.reduce((s, p) => s + parseFloat(p.amountPaid) + parseFloat(p.creditApplied || 0), 0);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-heading">Student Fees</h1>
          <p className="text-xs md:text-sm text-slate-400">View and manage fee assignments per student.</p>
        </div>

        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'success' ? 'bg-status-success/15 border-status-success/30 text-status-success' : 'bg-status-danger/15 border-status-danger/30 text-status-danger'}`}>
            {alert.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Student Search — hidden for STUDENT role (auto-loaded above) */}
        {currentUser.role !== 'STUDENT' && <div className="glass-card flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-300">Search Student</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or roll number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
            <Button variant="primary" onClick={searchStudents} loading={searching}>Search</Button>
          </div>

          {students.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { loadStudentFees(s); setStudents([]); }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-deep/40 border border-slate-700/40 hover:border-brand/50 hover:bg-brand/5 transition-all text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{s.user?.name}</p>
                    <p className="text-xs text-slate-400">{s.rollNumber} · {s.course?.name} · {s.batch?.name}</p>
                  </div>
                  <UserCheck size={16} className="text-slate-500" />
                </button>
              ))}
            </div>
          )}
        </div>}

        {/* Student Fee Details */}
        {selectedStudent && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-brand/10 border border-brand/30 flex-1 mr-4">
                <div>
                  <p className="text-base font-bold text-white">{selectedStudent.user?.name}</p>
                  <p className="text-xs text-slate-400">{selectedStudent.rollNumber} · {selectedStudent.course?.name} · {selectedStudent.batch?.name}</p>
                </div>
              </div>
              {isAdmin && (
                <Button variant="primary" onClick={() => setIsAssignOpen(true)} className="flex items-center gap-2 shrink-0">
                  <Plus size={15} /> Assign Fee
                </Button>
              )}
            </div>

            {/* Overdue installments view (from Due Fees) */}
            {fromDueFees && !loading && (
              <div className="glass-card flex flex-col gap-3">
                <p className="text-sm font-bold text-status-danger flex items-center gap-2">
                  <AlertCircle size={15} /> Overdue Installments
                </p>
                {overdueItems.length === 0 ? (
                  <p className="text-sm text-slate-500">No overdue installments found.</p>
                ) : (
                  overdueItems.map((item) => {
                    const paymentStatus = item.amountPaid >= item.amount - 0.001
                      ? { label: 'Paid', cls: 'text-status-success bg-status-success/15 border-status-success/30' }
                      : item.amountPaid > 0
                      ? { label: 'Partial', cls: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' }
                      : { label: 'Unpaid', cls: 'text-status-danger bg-status-danger/15 border-status-danger/30' };
                    return (
                      <div key={item.installmentId} className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-deep/40 border border-slate-700/40">
                        <div>
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.feeStructureName} · Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${paymentStatus.cls}`}>{paymentStatus.label}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-status-danger bg-status-danger/15 border-status-danger/30">Overdue</span>
                          <div className="text-right">
                            <p className="text-xs text-slate-400">Outstanding</p>
                            <p className="text-sm font-bold text-status-danger">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amountDue)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-slate-400 text-center py-6">Loading fee records...</p>
            ) : !fromDueFees && studentFees.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No fee records assigned.</p>
            ) : !fromDueFees && (
              studentFees.map((sf) => {
                const paid = totalPayments(sf.payments);
                const balance = Math.max(0, parseFloat(sf.netPayable) - paid);

                return (
                  <div key={sf.id} className="glass-card flex flex-col gap-4">
                    {/* Structure header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-white">{sf.feeStructure?.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {sf.discount && <span className="text-status-success">Discount: {sf.discount.name}</span>}
                          {sf.scholarship && <span className="text-brand-light">Scholarship: {sf.scholarship.name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Net Payable</p>
                          <p className="text-lg font-extrabold text-white">{fmt(sf.netPayable)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Paid</p>
                          <p className="text-lg font-extrabold text-status-success">{fmt(paid)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Balance</p>
                          <p className={`text-lg font-extrabold ${balance > 0 ? 'text-status-danger' : 'text-status-success'}`}>{fmt(balance)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Installment Timeline */}
                    {sf.feeStructure?.installments?.length > 0 && (
                      <div className="border-t border-slate-800 pt-4">
                        <p className="text-sm font-semibold text-slate-300 mb-3">Installment Schedule</p>
                        <InstallmentTimeline
                          installments={sf.feeStructure.installments}
                          payments={sf.payments}
                          netPayable={parseFloat(sf.netPayable)}
                          totalAmount={parseFloat(sf.feeStructure.totalAmount)}
                        />
                      </div>
                    )}

                    {/* Payment History */}
                    {sf.payments.length > 0 && (
                      <div className="border-t border-slate-800 pt-4">
                        <p className="text-sm font-semibold text-slate-300 mb-3">Payment History</p>
                        <div className="flex flex-col gap-2">
                          {sf.payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-deep/40 border border-slate-700/40">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-white">{fmt(p.amountPaid)}</p>
                                  <FeePaymentBadge status={p.status} />
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {p.paymentMethod?.replace('_', ' ')} · {new Date(p.paymentDate).toLocaleDateString()} · {p.collector?.name}
                                  {p.installment && ` · ${p.installment.label}`}
                                </p>
                              </div>
                              <button
                                onClick={() => navigate(`/fees/receipt/${p.id}`)}
                                className="p-1.5 rounded bg-bg-surfaceLight hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                                title="View Receipt"
                              >
                                <Receipt size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {selectedStudent && isAdmin && (
          <Modal
            isOpen={isAssignOpen}
            onClose={() => setIsAssignOpen(false)}
            title="Assign Fee Structure"
            maxWidth="max-w-md"
          >
            <AssignFeeModal
              studentId={selectedStudent.id}
              courseId={selectedStudent.courseId || selectedStudent.course?.id}
              onClose={() => setIsAssignOpen(false)}
              onSuccess={(msg) => {
                setIsAssignOpen(false);
                showAlert('success', msg);
                loadStudentFees(selectedStudent);
              }}
            />
          </Modal>
        )}
      </div>
    </>
  );
};

export default StudentFeePage;
