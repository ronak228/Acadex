import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Award, CheckCircle, ShieldAlert, Heart, AlertCircle } from 'lucide-react';
import Table from '../../components/Table';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import AdmissionForm from './AdmissionForm';
import AdmissionReviewModal from './AdmissionReviewModal';
import admissionService from '../../services/admissionService';
import studentService from '../../services/studentService';
import authService from '../../services/authService';

const AdmissionPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || {};
  const userRole = currentUser.role || '';

  // Filters State
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, APPLIED, UNDER_REVIEW, APPROVED, REJECTED, ENROLLED
  const [search, setSearch] = useState('');

  // Data State
  const [admissions, setAdmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // UI Toast Alert
  const [alert, setAlert] = useState(null);

  const tabs = ['ALL', 'APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED'];

  // Load courses for name lookups
  useEffect(() => {
    const fetchCourses = async () => {
      const data = await studentService.getCourses();
      setCourses(data);
    };
    fetchCourses();
  }, []);

  const loadAdmissions = async () => {
    setLoading(true);
    const data = await admissionService.getAdmissions({
      status: activeTab,
      search
    });
    setAdmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAdmissions();
    setCurrentPage(1);
  }, [activeTab, search]);

  const handleFormSubmit = async (formData) => {
    try {
      const res = await admissionService.createAdmission(formData);
      if (res.success) {
        setAlert({ type: 'success', message: res.message });
        setIsFormOpen(false);
        loadAdmissions();
        setTimeout(() => setAlert(null), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setAlert({ type: 'error', message: msg });
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Define Table Headers
  const tableHeaders = [
    { key: 'studentName', label: 'Applicant Name', sortable: true },
    { key: 'phone', label: 'Phone' },
    { 
      key: 'courseId', 
      label: 'Requested Course',
      render: (row) => {
        const course = courses.find(c => c.id === row.courseId);
        return course ? course.name : 'Loading...';
      }
    },
    { 
      key: 'appliedAt', 
      label: 'Date Applied',
      render: (row) => new Date(row.appliedAt).toLocaleDateString()
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${
          row.status === 'APPLIED' ? 'bg-brand/10 text-brand-light border-brand/20' :
          row.status === 'UNDER_REVIEW' ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
          row.status === 'APPROVED' ? 'bg-status-success/10 text-status-success border-status-success/20' :
          row.status === 'ENROLLED' ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700/30' :
          'bg-status-danger/10 text-status-danger border-status-danger/20'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      key: 'reviewer',
      label: 'Audited By',
      render: (row) => row.reviewer?.name || 'Pending'
    }
  ];

  // Action Buttons Cell Render
  const tableActions = (row) => {
    return (
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            setSelectedAdmission(row);
            setIsReviewOpen(true);
          }}
          className="px-2.5 py-1 rounded bg-bg-surfaceLight hover:bg-slate-600 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer font-medium border border-slate-700/50"
          title="Audit/Review Application"
        >
          <Eye size={13} />
          <span>Audit</span>
        </button>
      </div>
    );
  };

  // Pagination Math
  const totalPages = Math.ceil(admissions.length / limit) || 1;
  const paginatedData = admissions.slice((currentPage - 1) * limit, currentPage * limit);

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header Toolbar */}
        <PageHeader
          title="Admissions Registry"
          subtitle="Audit applicant profiles, update academic vetting status, and process student enrollments."
          actions={
            <Button variant="primary" onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create File</span>
            </Button>
          }
        />

        {/* Alerts Toast */}
        {alert && (
          <div className={`flex gap-2.5 p-3 rounded-lg text-sm border ${alert.type === 'error' ? 'bg-status-danger/15 border-status-danger/30 text-status-danger' : 'bg-status-success/15 border-status-success/30 text-status-success'}`}>
            {alert.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800 pb-px gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                activeTab === tab 
                  ? 'border-brand text-brand-light bg-brand/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters Toolbar */}
        <div className="glass-card max-w-md items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300 font-heading">Search Applicant</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-500 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search by Name or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none glass-input"
              />
            </div>
          </div>
        </div>

        {/* Data Grid Table */}
        <Table
          headers={tableHeaders}
          data={paginatedData}
          loading={loading}
          actions={tableActions}
          emptyMessage="No admissions applications found matching these filters."
          pagination={{
            currentPage,
            totalPages,
            limit,
            onPageChange: (page) => setCurrentPage(page),
            onLimitChange: (size) => {
              setLimit(size);
              setCurrentPage(1);
            }
          }}
        />

        {/* Create Application Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title="Log Student Admission Application"
        >
          <AdmissionForm
            onSubmit={handleFormSubmit}
            onClose={() => setIsFormOpen(false)}
          />
        </Modal>

        {/* Review/Audit Application Modal */}
        <Modal
          isOpen={isReviewOpen}
          onClose={() => {
            setIsReviewOpen(false);
            setSelectedAdmission(null);
          }}
          title="Audit Admission File Review"
        >
          {selectedAdmission && (
            <AdmissionReviewModal
              admission={selectedAdmission}
              userRole={userRole}
              onClose={() => {
                setIsReviewOpen(false);
                setSelectedAdmission(null);
              }}
              onRefresh={loadAdmissions}
            />
          )}
        </Modal>

      </div>
    </>
  );
};

export default AdmissionPage;
