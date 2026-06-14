import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import designationService from '../../services/designationService';
import departmentService from '../../services/departmentService';

const FacultyForm = ({ onSubmit, initialData = null, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    designationId: '',
    departmentId: '',
    dateOfJoining: '',
    qualification: '',
    bankAccount: '',
    ifscCode: '',
    baseSalary: '',
  });

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load designation and department options from DB
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [desigs, depts] = await Promise.all([
          designationService.getDesignations({ isActive: 'true' }),
          departmentService.getDepartments({ isActive: 'true' })
        ]);
        setDesignations(Array.isArray(desigs) ? desigs.map(d => ({ value: d.id, label: d.name })) : []);
        setDepartments(Array.isArray(depts) ? depts.map(d => ({ value: d.id, label: `${d.name} (${d.code})` })) : []);
      } catch (err) {
        console.error('Failed to load designation/department options', err);
      }
    };
    loadOptions();
  }, []);

  // Hydrate fields if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.user?.name || '',
        email: initialData.user?.email || '',
        phone: initialData.user?.phone || '',
        designationId: initialData.designationId || '',
        departmentId: initialData.departmentId || '',
        dateOfJoining: initialData.dateOfJoining ? initialData.dateOfJoining.split('T')[0] : '',
        qualification: initialData.qualification || '',
        bankAccount: initialData.bankAccount ? initialData.bankAccount.replace(/•/g, '') : '',
        ifscCode: initialData.ifscCode || '',
        baseSalary: initialData.baseSalary ? String(initialData.baseSalary) : '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Name: required, min 2 chars
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full Name must be at least 2 characters';
    }

    // Email: required + format (skip on edit — field disabled)
    if (!initialData) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Phone: required, 7–15 digits (allows +, spaces, dashes)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Mobile number is required';
    } else if (!/^\+?[\d\s\-().]{7,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (7–15 digits)';
    }

    // Designation: required dropdown
    if (!formData.designationId) newErrors.designationId = 'Designation is required';

    // Date of Joining: required
    if (!formData.dateOfJoining) {
      newErrors.dateOfJoining = 'Date of Joining is required';
    } else {
      const d = new Date(formData.dateOfJoining);
      if (isNaN(d.getTime())) newErrors.dateOfJoining = 'Please enter a valid date';
    }

    // Qualification: required, min 3 chars
    if (!formData.qualification.trim()) {
      newErrors.qualification = 'Qualification is required';
    } else if (formData.qualification.trim().length < 3) {
      newErrors.qualification = 'Qualification must be at least 3 characters';
    }

    // Bank Account: optional, if provided must be 9–18 digits
    if (formData.bankAccount.trim() && !/^\d{9,18}$/.test(formData.bankAccount.trim())) {
      newErrors.bankAccount = 'Bank account must be 9–18 digits';
    }

    // IFSC Code: optional, if provided must match IFSC format
    if (formData.ifscCode.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode.trim())) {
      newErrors.ifscCode = 'IFSC code must be in format: ABCD0123456';
    }

    // Base Salary: required, positive decimal
    const salaryNum = parseFloat(formData.baseSalary);
    if (!formData.baseSalary || isNaN(salaryNum)) {
      newErrors.baseSalary = 'Base Salary must be a valid number';
    } else if (salaryNum <= 0) {
      newErrors.baseSalary = 'Base Salary must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          name="name"
          placeholder="Dr. Alan Turing"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />

        <Input
          label="Account Email"
          name="email"
          type="email"
          placeholder="alan.turing@eduerp.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          disabled={!!initialData} // disable email edit under normal flow
          required
        />

        <Input
          label="Contact Phone"
          name="phone"
          placeholder="555-1001"
          value={formData.phone}
          onChange={handleChange}
          error={errors.phone}
          required
        />

        <Input
          label="Date of Joining"
          name="dateOfJoining"
          type="date"
          value={formData.dateOfJoining}
          onChange={handleChange}
          error={errors.dateOfJoining}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Designation"
          name="designationId"
          options={designations}
          value={formData.designationId}
          onChange={handleChange}
          error={errors.designationId}
          placeholder="Select Designation"
          required
        />

        <Select
          label="Department"
          name="departmentId"
          options={departments}
          value={formData.departmentId}
          onChange={handleChange}
          placeholder="Select Department"
        />
      </div>

      <Input
        label="Qualifications"
        name="qualification"
        placeholder="Ph.D. in Mathematical Sciences & Computation"
        value={formData.qualification}
        onChange={handleChange}
        error={errors.qualification}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Bank Account Details"
          name="bankAccount"
          placeholder="123456789012"
          value={formData.bankAccount}
          onChange={handleChange}
          error={errors.bankAccount}
        />

        <Input
          label="IFSC Code"
          name="ifscCode"
          placeholder="SBIN0001234"
          value={formData.ifscCode}
          onChange={handleChange}
          error={errors.ifscCode}
        />

        <Input
          label="Base Salary (₹)"
          name="baseSalary"
          placeholder="8500.00"
          value={formData.baseSalary}
          onChange={handleChange}
          error={errors.baseSalary}
          required
        />
      </div>

      {!initialData && (
        <div className="p-3 rounded-lg bg-bg-deep/40 border border-slate-700/30 text-[11px] text-slate-500">
          Faculty accounts auto-generate system credentials formatted as: <code className="text-brand-light font-mono font-bold">FAC@&lt;EmployeeCode&gt;</code>.
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
        <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initialData ? 'Save Changes' : 'Register Faculty'}
        </Button>
      </div>

    </form>
  );
};

export default FacultyForm;
