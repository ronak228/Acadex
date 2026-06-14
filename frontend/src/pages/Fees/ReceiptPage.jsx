import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, AlertCircle } from 'lucide-react';
import ReceiptCard from '../../components/ReceiptCard';
import Button from '../../components/Button';
import feeService from '../../services/feeService';

const ReceiptPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    feeService.getReceipt(id)
      .then((res) => setReceipt(res.data))
      .catch(() => setError('Receipt not found or you do not have permission to view it.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-white font-heading">Payment Receipt</h1>
            <p className="text-xs text-slate-400">
              {receipt ? receipt.receiptNumber : '—'}
            </p>
          </div>
          {receipt && (
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2 print:hidden"
            >
              <Printer size={15} /> Print
            </Button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex gap-2.5 p-4 rounded-xl bg-status-danger/15 border border-status-danger/30 text-status-danger">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {receipt && (
          <div className="flex justify-center py-4">
            <ReceiptCard receipt={receipt} />
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm 18mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          aside, nav, header { display: none !important; }
          main, [class*="ml-"], [class*="pl-"] { margin-left: 0 !important; padding-left: 0 !important; }
          .flex.flex-col.gap-6 { gap: 0 !important; }
          .flex.justify-center.py-4 { padding: 0 !important; }
        }
      `}</style>
    </>
  );
};

export default ReceiptPage;
