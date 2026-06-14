import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, UserCheck, HelpCircle } from 'lucide-react';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Input from '../../components/Input';
import admissionService from '../../services/admissionService';
import studentService from '../../services/studentService';

const AdmissionReviewModal = ({ admission, userRole, onClose, onRefresh }) => {
  const canReview = userRole !== 'RECEPTIONIST';
  const [remarks, setRemarks] = useState(admission.remarks || '');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('MALE');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState(admission.email || '');
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courseName, setCourseName] = useState('Loading...');

  // Fetch batches for this applicant's course if approved
  useEffect(() => {
    const loadCourseAndBatches = async () => {
      // 1. Fetch course details to show name
      const courses = await studentService.getCourses();
      const course = courses.find(c => c.id === admission.courseId);
      setCourseName(course ? course.name : 'Unknown Course');

      // 2. Fetch batches
      if (admission.status === 'APPROVED') {
        const data = await studentService.getBatches(admission.courseId);
        setBatches(data.map(b => ({ value: b.id, label: b.name })));
      }
    };
    loadCourseAndBatches();
  }, [admission]);

  // Handle Review States: Approve or Reject
  const handleReviewStatus = async (nextStatus) => {
    setError(null);
    if (nextStatus === 'REJECTED' && !remarks.trim()) {
      setError('Remarks are required when rejecting an application.');
      return;
    }

    setLoading(true);
    try {
      const res = await admissionService.updateAdmissionStatus(admission.id, nextStatus, remarks);
      if (res.success) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update review status.');
    } finally {
      setLoading(false);
    }
  };

  // Convert Approved to Enrolled Student
  const handleEnroll = async (e) => {
    e.preventDefault();
    setError(null);
    if (!selectedBatch) {
      setError('Please select a batch to assign the student.');
      return;
    }
    if (!dateOfBirth || !gender || !parentName || !parentPhone || !email) {
      setError('Please fill out all student and guardian fields.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^\+?[\d\s\-().]{7,15}$/.test(parentPhone)) {
      setError('Please enter a valid guardian phone number.');
      return;
    }

    setLoading(true);
    try {
      const res = await admissionService.enrollAdmission(admission.id, {
        batchId: selectedBatch,
        dateOfBirth,
        gender,
        parentName,
        parentPhone,
        address,
        email
      });
      if (res.success) {
        onRefresh();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Unable to enroll applicant.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 text-sm">
      
      {/* 1. Applicant Parameters Summary Card */}
      <div className="p-4 rounded-xl bg-bg-deep/40 border border-slate-700/30 flex flex-col gap-2.5">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Application Parameters</h4>
        <div className="grid grid-cols-2 gap-3 text-slate-300">
          <div>
            <span className="text-[11px] text-slate-500 block">Applicant Name</span>
            <span className="font-semibold text-white">{admission.studentName}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Phone</span>
            <span>{admission.phone}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Email</span>
            <span className="truncate block">{admission.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Requested Course</span>
            <span className="truncate block font-semibold text-brand-light">{courseName}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Submission Date</span>
            <span>{new Date(admission.appliedAt).toLocaleDateString()}</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Review Status</span>
            <span className={`inline-block px-2 py-0.5 mt-0.5 text-[10px] font-bold rounded-full border ${
              admission.status === 'APPLIED' ? 'bg-brand/10 text-brand-light border-brand/20' :
              admission.status === 'UNDER_REVIEW' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
              admission.status === 'APPROVED' ? 'bg-status-success/10 text-status-success border-status-success/20' :
              admission.status === 'ENROLLED' ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700/30' :
              'bg-status-danger/10 text-status-danger border-status-danger/20'
            }`}>
              {admission.status}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex gap-2 p-2.5 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs font-medium">
          <ShieldAlert size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Review Decision Block (APPLIED, UNDER_REVIEW) — Admin/Super_Admin only */}
      {canReview && (admission.status === 'APPLIED' || admission.status === 'UNDER_REVIEW') && (
        <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="remarks" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Evaluation Remarks {remarks === '' && <span className="text-status-danger">(Required for Rejections)</span>}
            </label>
            <textarea
              id="remarks"
              rows={2}
              placeholder="Add academic background check reviews or interview scores notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 justify-end mt-1">
            {admission.status !== 'UNDER_REVIEW' && (
              <Button
                variant="outline"
                onClick={() => handleReviewStatus('UNDER_REVIEW')}
                disabled={loading}
                className="px-3"
              >
                Mark Under Review
              </Button>
            )}
            <Button
              variant="danger"
              onClick={() => handleReviewStatus('REJECTED')}
              disabled={loading}
              className="px-3"
            >
              Reject Application
            </Button>
            <Button
              variant="primary"
              onClick={() => handleReviewStatus('APPROVED')}
              disabled={loading}
              className="px-3 bg-gradient-to-r from-status-success to-emerald-400 border-none text-white hover:brightness-110 active:brightness-95"
            >
              Approve Application
            </Button>
          </div>
        </div>
      )}

      {/* 3. Enrollment Wizard (APPROVED) — Admin/Super_Admin only */}
      {canReview && admission.status === 'APPROVED' && (
        <form onSubmit={handleEnroll} className="flex flex-col gap-4 border-t border-slate-800 pt-4">
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-xs">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Application Approved</p>
              <p className="text-[11px] opacity-90 mt-0.5">Please review and complete the student parameters to generate academic system credentials and finalize enrollment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assign Academic Batch"
              name="enrollBatchId"
              options={batches}
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              placeholder="Choose Active Batch"
              required
            />
            
            <Input
              label="Student Account Email"
              name="enrollEmail"
              type="email"
              placeholder="student@eduerp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Date of Birth"
              name="enrollDOB"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />

            <Select
              label="Gender"
              name="enrollGender"
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' }
              ]}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="Select Gender"
              required
            />

            <Input
              label="Guardian Name"
              name="enrollParentName"
              placeholder="Robert Doe"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
            />

            <Input
              label="Guardian Phone"
              name="enrollParentPhone"
              placeholder="555-0102"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="enrollAddress" className="text-sm font-medium text-slate-300">
              Residential Address
            </label>
            <textarea
              id="enrollAddress"
              name="enrollAddress"
              rows={2}
              placeholder="123 Academic Way"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Close
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              className="flex items-center gap-2"
            >
              <UserCheck size={16} />
              <span>Enroll & Create Account</span>
            </Button>
          </div>
        </form>
      )}

      {/* Read-only notice for Receptionist on actionable applications */}
      {!canReview && (admission.status === 'APPLIED' || admission.status === 'UNDER_REVIEW' || admission.status === 'APPROVED') && (
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 text-xs">
            <HelpCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-300">Read-Only View</p>
              <p className="text-slate-400 mt-1">Approval and enrollment actions are restricted to administrators.</p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}

      {/* 4. Historical Locked States (REJECTED, ENROLLED) */}
      {(admission.status === 'REJECTED' || admission.status === 'ENROLLED') && (
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-4">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 text-xs">
            <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-300">Audited Application Log</p>
              <p className="text-slate-400 mt-1">
                <span className="font-semibold">Reviewer:</span> {admission.reviewer?.name || 'Active Administrator'}
              </p>
              {admission.remarks && (
                <p className="text-slate-400 mt-1">
                  <span className="font-semibold">Remarks:</span> "{admission.remarks}"
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdmissionReviewModal;
