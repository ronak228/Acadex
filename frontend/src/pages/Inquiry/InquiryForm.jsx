import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import inquiryService from '../../services/inquiryService';
import studentService from '../../services/studentService';

const InquiryForm = ({ onSubmit, initialData = null, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    courseInterest: '',
    source: 'Website',
    assignedTo: '',
    followUpDate: '',
    notes: '',
  });

  const [staffList, setStaffList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [errors, setErrors] = useState({});
  const [phoneWarning, setPhoneWarning] = useState('');
  const [loading, setLoading] = useState(false);

  // Load staff and courses on mount
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const staff = await inquiryService.getStaffUsers();
        setStaffList(staff.map(s => ({ value: s.id, label: `${s.name} (${s.role.toLowerCase()})` })));

        const courseList = await studentService.getCourses();
        const activeCourses = courseList.filter(c => c.isActive);
        setCourses(activeCourses.map(c => ({ value: c.id, label: `${c.name} (${c.code})` })));
      } catch (err) {
        console.error('Failed to load dependency data for Inquiry Form:', err);
      }
    };
    fetchDependencies();
  }, []);

  // Hydrate fields if editing
  useEffect(() => {
    if (initialData && courses.length > 0) {
      let resolvedCourseInterest = initialData.courseInterest || '';
      
      const matched = courses.find(
        c => c.value === resolvedCourseInterest || 
             c.label.toLowerCase().includes(resolvedCourseInterest.toLowerCase())
      );
      if (matched) {
        resolvedCourseInterest = matched.value;
      }

      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        courseInterest: resolvedCourseInterest,
        source: initialData.source || 'Website',
        assignedTo: initialData.assignedTo || '',
        followUpDate: initialData.followUpDate ? initialData.followUpDate.split('T')[0] : '',
        notes: initialData.notes || '',
      });
    } else if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        courseInterest: initialData.courseInterest || '',
        source: initialData.source || 'Website',
        assignedTo: initialData.assignedTo || '',
        followUpDate: initialData.followUpDate ? initialData.followUpDate.split('T')[0] : '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData, courses]);

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

  // Duplicate Phone Check on Blur
  const handlePhoneBlur = async () => {
    if (!formData.phone.trim()) return;
    setPhoneWarning('');
    
    // Query active inquiries to see if this phone exists
    const inquiries = await inquiryService.getInquiries();
    const isDuplicate = inquiries.some(i => i.phone === formData.phone.trim() && i.id !== initialData?.id);
    
    if (isDuplicate) {
      setPhoneWarning('Warning: A lead with this phone number already exists.');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Prospect Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.courseInterest) newErrors.courseInterest = 'Please select a course of interest';
    
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Prospect Name"
        name="name"
        placeholder="Peter Parker"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <div>
        <Input
          label="Phone Number"
          name="phone"
          placeholder="555-0199"
          value={formData.phone}
          onChange={handleChange}
          onBlur={handlePhoneBlur}
          error={errors.phone}
          required
        />
        {phoneWarning && (
          <p className="text-[11px] text-status-warning font-semibold mt-1 animate-pulse">
            {phoneWarning}
          </p>
        )}
      </div>

      <Input
        label="Email Address"
        name="email"
        type="email"
        placeholder="peter.parker@outlook.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />

      <Select
        label="Course Interest"
        name="courseInterest"
        options={courses}
        value={formData.courseInterest}
        onChange={handleChange}
        placeholder="Select interested course"
        error={errors.courseInterest}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Source"
          name="source"
          options={[
            { value: 'Walk-in', label: 'Walk-in' },
            { value: 'Website', label: 'Website' },
            { value: 'Referral', label: 'Referral' },
            { value: 'Phone', label: 'Phone' },
            { value: 'Social Media', label: 'Social Media' }
          ]}
          value={formData.source}
          onChange={handleChange}
          placeholder={null}
        />

        <Select
          label="Assign to Staff"
          name="assignedTo"
          options={staffList}
          value={formData.assignedTo}
          onChange={handleChange}
          placeholder="Select staff"
        />
      </div>

      <Input
        label="Follow-up Date"
        name="followUpDate"
        type="date"
        value={formData.followUpDate}
        onChange={handleChange}
      />

      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor="notes" className="text-sm font-medium text-slate-300">
          Internal Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Enquired about course fees, class timings, and job placements."
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none glass-input resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
        <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          {initialData ? 'Save Changes' : 'Submit Inquiry'}
        </Button>
      </div>
    </form>
  );
};

export default InquiryForm;
