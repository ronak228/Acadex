import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, CheckCircle, ShieldAlert, Sparkles, CreditCard, Edit, HelpCircle, FileText } from 'lucide-react';
import Table from '../../components/Table';
import Select from '../../components/Select';
import Button from '../../components/Button';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import salaryService from '../../services/salaryService';
import facultyService from '../../services/facultyService';
import authService from '../../services/authService';

const SalaryPage = () => {
  const navigate = useNavigate();
  const currentUser = authService.getLocalUser() || { id: 'f1', role: 'FACULTY', name: 'User' };
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Date Selection States (default to current month/year)
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  // Data States
  const [salaryRecords, setSalaryRecords] = useState([]); // for Admin
  const [personalHistory, setPersonalHistory] = useState([]); // for Faculty
  const [loading, setLoading] = useState(false);

  // Modals States
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustRecord, setAdjustRecord] = useState(null);
  const [adjustDeductions, setAdjustDeductions] = useState(0);
  const [adjustBonus, setAdjustBonus] = useState(0);
  const [adjustRemarks, setAdjustRemarks] = useState('');

  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payRecord, setPayRecord] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');

  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [slipRecord, setSlipRecord] = useState(null);

  // UI Toast State
  const [alert, setAlert] = useState(null);

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const years = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' }
  ];

  // Fetch salaries data
  const loadSalaries = async () => {
    setLoading(true);
    if (isAdmin) {
      const records = await salaryService.getSalaryRecords({
        month: selectedMonth,
        year: selectedYear
      });
      setSalaryRecords(records);
    } else {
      const facObj = await facultyService.getMyFaculty();
      if (facObj) {
        const history = await salaryService.getFacultySalaryHistory(facObj.id);
        setPersonalHistory(history);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSalaries();
  }, [selectedMonth, selectedYear]);

  // Bulk Generation Wizard Submit
  const handleBulkGenerate = async () => {
    setWizardLoading(true);
    const res = await salaryService.generateBulkSalary(selectedMonth, selectedYear);
    setWizardLoading(false);
    setIsWizardOpen(false);
    
    if (res.success) {
      setAlert({
        type: 'success',
        message: `${res.message} Generated: ${res.generated}, Skipped: ${res.skipped}.`
      });
      loadSalaries();
      setTimeout(() => setAlert(null), 4000);
    }
  };

  // Adjustments Form Submit (Realtime previews update on input changes)
  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustRecord) return;

    const res = await salaryService.updateSalaryRecord(adjustRecord.id, {
      deductions: adjustDeductions,
      bonus: adjustBonus,
      remarks: adjustRemarks
    });

    if (res.success) {
      setAlert({ type: 'success', message: 'Salary adjustments saved successfully.' });
      setIsAdjustOpen(false);
      setAdjustRecord(null);
      loadSalaries();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Mark as Paid Submit
  const handleMarkPaidSubmit = async () => {
    if (!payRecord) return;

    const res = await salaryService.markSalaryPaid(payRecord.id, { transactionRef });
    if (res.success) {
      setAlert({ type: 'success', message: 'Salary payout logged successfully.' });
      setIsPayOpen(false);
      setPayRecord(null);
      setTransactionRef('');
      loadSalaries();
      setTimeout(() => setAlert(null), 3000);
    }
  };

  // Print slip handler
  const handlePrint = () => {
    if (!slipRecord) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Payslip — \${slipRecord.faculty?.user?.name || 'N/A'}</title>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            @page { size: A4 portrait; margin: 18mm 20mm; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1e293b; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            /* ── Branding header ── */
            .page-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4f46e5; padding-bottom: 14px; margin-bottom: 22px; }
            .org-name { font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
            .org-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
            .slip-title { text-align: right; }
            .slip-title h2 { font-size: 15px; font-weight: 700; color: #1e293b; }
            .slip-title p { font-size: 11px; color: #64748b; margin-top: 2px; }
            /* ── Employee details grid ── */
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 22px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; page-break-inside: avoid; }
            .detail-row { display: flex; gap: 6px; font-size: 12.5px; padding: 3px 0; }
            .label { color: #64748b; min-width: 130px; flex-shrink: 0; }
            .value { font-weight: 600; color: #0f172a; }
            /* ── Earnings table ── */
            .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #64748b; margin-bottom: 8px; }
            .ledger-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; page-break-inside: avoid; }
            .ledger-table thead tr { background: #4f46e5; }
            .ledger-table th { padding: 9px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
            .ledger-table th:last-child { text-align: right; }
            .ledger-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; vertical-align: middle; }
            .ledger-table td:last-child { text-align: right; }
            .ledger-table tr:last-child td { border-bottom: none; }
            .ledger-table tr.total-row { background: #f0fdf4; }
            .ledger-table tr.total-row td { font-weight: 700; font-size: 15px; border-top: 2px solid #d1fae5; color: #15803d; }
            .credit { color: #16a34a; }
            .debit { color: #dc2626; }
            /* ── Remarks ── */
            .remarks { font-size: 12px; color: #64748b; padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 5px; margin-bottom: 32px; page-break-inside: avoid; }
            .remarks strong { color: #92400e; }
            /* ── Signatures ── */
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid; }
            .sig-block { width: 44%; }
            .sig-line { border-top: 1.5px solid #94a3b8; padding-top: 8px; font-size: 12px; color: #475569; text-align: center; }
            .sig-name { font-size: 11px; color: #94a3b8; margin-top: 3px; text-align: center; }
            /* ── Footer ── */
            .page-footer { margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10.5px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="page-header">
            <div>
              <div class="org-name">Acadex ERP</div>
              <div class="org-sub">Human Resources · Payroll Management</div>
            </div>
            <div class="slip-title">
              <h2>Salary Disbursement Slip</h2>
              <p>Pay Period: \${months.find(m => Number(m.value) === slipRecord.month)?.label || ''} \${slipRecord.year}</p>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-row"><span class="label">Employee Name</span><span class="value">\${slipRecord.faculty?.user?.name || 'N/A'}</span></div>
            <div class="detail-row"><span class="label">Pay Period</span><span class="value">\${months.find(m => Number(m.value) === slipRecord.month)?.label} \${slipRecord.year}</span></div>
            <div class="detail-row"><span class="label">Employee Code</span><span class="value">\${slipRecord.faculty?.employeeCode || 'N/A'}</span></div>
            <div class="detail-row"><span class="label">Disbursement Date</span><span class="value">\${slipRecord.paidAt ? new Date(slipRecord.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span></div>
            <div class="detail-row"><span class="label">Designation</span><span class="value">\${slipRecord.faculty?.designation || 'N/A'}</span></div>
            <div class="detail-row"><span class="label">Bank Account</span><span class="value">\${slipRecord.faculty?.bankAccount || 'N/A'}</span></div>
            <div class="detail-row"><span class="label">Department</span><span class="value">\${slipRecord.faculty?.department || 'N/A'}</span></div>
            <div class="detail-row"><span class="label">IFSC Code</span><span class="value">\${slipRecord.faculty?.ifscCode || 'N/A'}</span></div>
          </div>

          <p class="section-title">Earnings &amp; Deductions</p>
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base Salary</td>
                <td>₹\${Number(slipRecord.baseSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>Bonus / Incentives</td>
                <td class="credit">+ ₹\${Number(slipRecord.bonus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td>Deductions (Unpaid leaves / Absences)</td>
                <td class="debit">− ₹\${Number(slipRecord.deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr class="total-row">
                <td>Net Salary Disbursed</td>
                <td>₹\${Number(slipRecord.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          <div class="remarks">
            <strong>Remarks:</strong> \${slipRecord.remarks || 'Salary disbursed as per approved payroll cycle.'}
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-line">Beneficiary Signature</div>
              <div class="sig-name">\${slipRecord.faculty?.user?.name || ''}</div>
            </div>
            <div class="sig-block">
              <div class="sig-line">Authorised Signatory</div>
              <div class="sig-name">Paid by: \${slipRecord.payer?.name || 'Administrator'}</div>
            </div>
          </div>

          <div class="page-footer">
            <p>This is a system-generated document. No physical stamp required. · Acadex Education ERP</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.addEventListener('afterprint', function() { window.close(); });
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Define Admin Payroll Table Headers
  const adminHeaders = [
    { 
      key: 'employeeCode', 
      label: 'Faculty Code', 
      sortable: true,
      render: (row) => row.faculty?.employeeCode || 'N/A'
    },
    { 
      key: 'facultyName', 
      label: 'Full Name', 
      sortable: true,
      render: (row) => row.faculty?.user?.name || 'N/A'
    },
    { 
      key: 'baseSalary', 
      label: 'Base Salary',
      render: (row) => `₹${row.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'deductions', 
      label: 'Deductions',
      render: (row) => `₹${row.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'bonus', 
      label: 'Bonus',
      render: (row) => `₹${row.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'netSalary', 
      label: 'Net Salary',
      render: (row) => (
        <span className="font-bold text-white">
          ₹{row.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'paidAt', 
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full border ${
          row.paidAt 
            ? 'bg-status-success/15 border-status-success/30 text-status-success' 
            : 'bg-status-warning/15 border-status-warning/30 text-status-warning'
        }`}>
          {row.paidAt ? 'Paid' : 'Unpaid'}
        </span>
      )
    }
  ];

  // Define Faculty Personal History Table Headers
  const facultyHeaders = [
    { 
      key: 'monthYear', 
      label: 'Pay Period',
      render: (row) => `${months.find(m => Number(m.value) === row.month)?.label} ${row.year}`
    },
    { 
      key: 'baseSalary', 
      label: 'Base Salary',
      render: (row) => `₹${row.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'deductions', 
      label: 'Deductions',
      render: (row) => `₹${row.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'bonus', 
      label: 'Bonus',
      render: (row) => `₹${row.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    { 
      key: 'netSalary', 
      label: 'Net Salary',
      render: (row) => (
        <span className="font-bold text-brand-light">
          ₹{row.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'paidAt', 
      label: 'Pay Status',
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${
          row.paidAt 
            ? 'bg-status-success/15 text-status-success' 
            : 'bg-status-warning/15 text-status-warning'
        }`}>
          {row.paidAt ? 'Paid' : 'Processing'}
        </span>
      )
    },
    { 
      key: 'paidAtDate', 
      label: 'Paid Date',
      render: (row) => row.paidAt ? new Date(row.paidAt).toLocaleDateString() : '—'
    }
  ];

  // Admin Actions Row Cell Renders
  const adminActions = (row) => {
    const isPaid = !!row.paidAt;
    return (
      <div className="flex gap-2 justify-end">
        {!isPaid ? (
          <>
            <button
              onClick={() => {
                setAdjustRecord(row);
                setAdjustDeductions(row.deductions);
                setAdjustBonus(row.bonus);
                setAdjustRemarks(row.remarks || '');
                setIsAdjustOpen(true);
              }}
              className="px-2 py-1 rounded bg-bg-surfaceLight hover:bg-slate-600 text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1 border border-slate-700/50 cursor-pointer"
              title="Configure Adjustments"
            >
              <Edit size={13} />
              <span>Adjust</span>
            </button>
            <button
              onClick={() => {
                setPayRecord(row);
                setTransactionRef('');
                setIsPayOpen(true);
              }}
              className="px-2 py-1 rounded bg-brand/10 hover:bg-brand text-xs text-brand-light hover:text-white transition-all flex items-center gap-1 border border-brand/20 cursor-pointer"
              title="Mark Paid"
            >
              <CreditCard size={13} />
              <span>Pay</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              setSlipRecord(row);
              setIsSlipOpen(true);
            }}
            className="px-2 py-1 rounded bg-brand/10 hover:bg-brand text-xs text-brand-light hover:text-white transition-all flex items-center gap-1.5 border border-brand/20 cursor-pointer"
            title="View Payslip"
          >
            <FileText size={13} />
            <span>Payslip</span>
          </button>
        )}
      </div>
    );
  };

  // Faculty Actions Row Cell Renders
  const facultyActions = (row) => {
    const isPaid = !!row.paidAt;
    return (
      <div className="flex gap-2 justify-end">
        {isPaid ? (
          <button
            onClick={() => {
              setSlipRecord(row);
              setIsSlipOpen(true);
            }}
            className="px-2 py-1 rounded bg-brand/10 hover:bg-brand text-xs text-brand-light hover:text-white transition-all flex items-center gap-1.5 border border-brand/20 cursor-pointer"
            title="View Payslip"
          >
            <FileText size={13} />
            <span>Payslip</span>
          </button>
        ) : (
          <span className="text-xs text-slate-500 font-medium italic pr-2">Processing</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        
        {/* Header Toolbar */}
        <PageHeader
          title="Payroll Ledger"
          subtitle={isAdmin
            ? 'Generate monthly faculty salaries, apply deduction/bonus adjustments, and authorize payouts.'
            : 'Review your payroll histories details, bonuses, deductions, and salary disbursement logs.'}
          actions={isAdmin && (
            <Button variant="primary" onClick={() => setIsWizardOpen(true)} className="flex items-center gap-2">
              <DollarSign size={16} />
              <span>Bulk Generation Wizard</span>
            </Button>
          )}
        />

        {/* Alerts toast */}
        {alert && (
          <div className="flex gap-2.5 p-3 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-sm">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>{alert.message}</span>
          </div>
        )}

        {/* ------------------------------------------------ */}
        {/* VIEWPORT: ADMIN PAYROLL CONTROLS */}
        {/* ------------------------------------------------ */}
        {isAdmin && (
          <>
            {/* Filters Box */}
            <div className="glass-card flex flex-wrap gap-4 items-end max-w-lg">
              <Select
                label="Select Month"
                name="salMonth"
                options={months}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                placeholder={null}
                className="w-40"
              />

              <Select
                label="Select Year"
                name="salYear"
                options={years}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder={null}
                className="w-32"
              />
            </div>

            {/* Payroll Table */}
            <Table
              headers={adminHeaders}
              data={salaryRecords}
              loading={loading}
              actions={adminActions}
              emptyMessage="No salary records generated for this pay period. Use the Wizard above to compute records."
            />
          </>
        )}

        {/* ------------------------------------------------ */}
        {/* VIEWPORT: FACULTY PERSONAL HISTORY */}
        {/* ------------------------------------------------ */}
        {!isAdmin && (
          <Table
            headers={facultyHeaders}
            data={personalHistory}
            loading={loading}
            actions={facultyActions}
            emptyMessage="No salary history records logged for your profile."
          />
        )}

        {/* Wizard Confirmation Modal */}
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title="Payroll Generation Wizard"
        >
          <div className="flex flex-col gap-4 text-slate-300 text-sm">
            <div className="flex gap-2.5 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Confirm Bulk Run</p>
                <p className="opacity-90 mt-0.5">This action initiates salary calculations for all active faculty members for the selected pay period.</p>
              </div>
            </div>

            <p>
              Are you sure you want to generate salary records for <strong className="text-white">{months.find(m => m.value === selectedMonth)?.label} {selectedYear}</strong>?
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-400 space-y-1">
              <li>Queries faculty calendar attendance logs automatically.</li>
              <li>Calculates monthly deductions based on duty aggregates.</li>
              <li>Preserves existing custom adjustments notes where records already exist.</li>
            </ul>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
              <Button variant="outline" onClick={() => setIsWizardOpen(false)} disabled={wizardLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleBulkGenerate} loading={wizardLoading}>
                Initiate Run
              </Button>
            </div>
          </div>
        </Modal>

        {/* Adjustments Configurations Modal */}
        <Modal
          isOpen={isAdjustOpen}
          onClose={() => {
            setIsAdjustOpen(false);
            setAdjustRecord(null);
          }}
          title={adjustRecord ? `Payroll Adjustments — ${adjustRecord.faculty?.user?.name}` : ''}
        >
          {adjustRecord && (
            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-bg-deep/40 border border-slate-700/30 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Base Salary</span>
                  <span className="font-semibold text-slate-300">₹{adjustRecord.baseSalary.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Realtime Net Salary Preview</span>
                  <span className="font-bold text-white text-sm">
                    ₹{(adjustRecord.baseSalary - parseFloat(adjustDeductions || 0) + parseFloat(adjustBonus || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Deductions (₹)"
                  name="adjustDeductions"
                  type="number"
                  placeholder="0.00"
                  value={adjustDeductions}
                  onChange={(e) => setAdjustDeductions(e.target.value)}
                  required
                />
                <Input
                  label="Bonus (₹)"
                  name="adjustBonus"
                  type="number"
                  placeholder="0.00"
                  value={adjustBonus}
                  onChange={(e) => setAdjustBonus(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label htmlFor="adjustRemarks" className="text-sm font-medium text-slate-300">
                  Adjustment Remarks / Reasons
                </label>
                <textarea
                  id="adjustRemarks"
                  rows={2}
                  placeholder="E.g., Attendance deduction override, performance bonus logged."
                  value={adjustRemarks}
                  onChange={(e) => setAdjustRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => {
                    setIsAdjustOpen(false);
                    setAdjustRecord(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Adjustments
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Payout Confirmation Modal */}
        <Modal
          isOpen={isPayOpen}
          onClose={() => {
            setIsPayOpen(false);
            setPayRecord(null);
          }}
          title="Confirm Payout Transaction"
        >
          {payRecord && (
            <div className="flex flex-col gap-4 text-sm text-slate-300">
              <div className="p-3.5 rounded-lg bg-brand/10 border border-brand/20 flex flex-col gap-1.5">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Payout Amount</span>
                <span className="text-2xl font-black text-white font-heading">₹{payRecord.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <span className="text-xs text-slate-400 mt-1">Beneficiary: {payRecord.faculty?.user?.name} ({payRecord.faculty?.employeeCode})</span>
              </div>

              <p>
                Confirming this logs the payout transaction under your Administrator profile ID, signs the voucher with a server timestamp, and locks the payroll line.
              </p>

              <div className="flex flex-col gap-1.5">
                <Input
                  label="Bank Transfer / Transaction Ref (Optional)"
                  name="transactionRef"
                  type="text"
                  placeholder="E.g., TXN1234567890"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsPayOpen(false);
                    setPayRecord(null);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleMarkPaidSubmit} className="flex items-center gap-1.5">
                  <CheckCircle size={15} />
                  <span>Confirm Payout</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Payslip Voucher Preview Modal */}
        <Modal
          isOpen={isSlipOpen}
          onClose={() => {
            setIsSlipOpen(false);
            setSlipRecord(null);
          }}
          title="Salary Slip Details"
          maxWidth="max-w-xl"
        >
          {slipRecord && (
            <div className="flex flex-col gap-6 text-slate-300">
              
              {/* Slip Document Frame */}
              <div className="border border-slate-700/60 rounded-xl p-5 bg-slate-950/60 flex flex-col gap-5">
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight">ACADEX ERP</h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Salary Disbursement Receipt</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Pay Period</span>
                    <span className="font-bold text-white text-sm">
                      {months.find(m => Number(m.value) === slipRecord.month)?.label} {slipRecord.year}
                    </span>
                  </div>
                </div>

                {/* Employee / Institution Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Beneficiary Name</span>
                    <span className="font-semibold text-slate-200">{slipRecord.faculty?.user?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Employee Code</span>
                    <span className="font-semibold text-slate-200">{slipRecord.faculty?.employeeCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Designation</span>
                    <span className="font-semibold text-slate-200">{slipRecord.faculty?.designation || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Bank Account</span>
                    <span className="font-semibold text-slate-200">{slipRecord.faculty?.bankAccount || 'N/A'}</span>
                  </div>
                </div>

                {/* Financial Details Table */}
                <div className="border border-slate-800/80 rounded-lg overflow-hidden text-xs mt-2">
                  <div className="grid grid-cols-2 bg-slate-900/40 p-2 font-bold border-b border-slate-800 text-slate-400">
                    <span>Description</span>
                    <span className="text-right">Amount (₹)</span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    <div className="grid grid-cols-2 p-2">
                      <span className="text-slate-400">Base Salary</span>
                      <span className="text-right font-medium text-slate-200">₹{slipRecord.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <span className="text-slate-400">Bonus & Allowances</span>
                      <span className="text-right font-medium text-status-success">+₹{slipRecord.bonus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2">
                      <span className="text-slate-400">Deductions (Unpaid absence)</span>
                      <span className="text-right font-medium text-status-danger">-₹{slipRecord.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="grid grid-cols-2 p-2.5 font-extrabold bg-slate-900/20 border-t border-slate-700">
                      <span className="text-white text-sm">Net Pay Disbursed</span>
                      <span className="text-right text-brand-light text-sm">₹{slipRecord.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Audit & Txn log details */}
                <div className="bg-bg-deep/30 border border-slate-800/60 p-3 rounded-lg flex flex-col gap-1.5 text-[11px] text-slate-400">
                  <div>
                    <strong>Disbursement Status:</strong> <span className="text-status-success font-semibold">PAID</span>
                  </div>
                  {slipRecord.paidAt && (
                    <div>
                      <strong>Disbursed Date:</strong> {new Date(slipRecord.paidAt).toLocaleDateString()} {new Date(slipRecord.paidAt).toLocaleTimeString()}
                    </div>
                  )}
                  {slipRecord.remarks && (
                    <div>
                      <strong>Payment Ledger Notes:</strong> {slipRecord.remarks}
                    </div>
                  )}
                  {slipRecord.payer?.name && (
                    <div>
                      <strong>Authorized By:</strong> {slipRecord.payer.name}
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <Button variant="outline" onClick={() => {
                  setIsSlipOpen(false);
                  setSlipRecord(null);
                }}>
                  Close
                </Button>
                <Button variant="primary" onClick={handlePrint} className="flex items-center gap-1.5">
                  <FileText size={15} />
                  <span>Print Slip</span>
                </Button>
              </div>

            </div>
          )}
        </Modal>

      </div>
    </>
  );
};

export default SalaryPage;
