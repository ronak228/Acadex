import React, { useState, useEffect } from 'react';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import studentService from '../../services/studentService';
import inquiryService from '../../services/inquiryService';

const AdmissionForm = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    phone: '',
    email: '',
    courseId: '',
    inquiryId: ''
  });

  const [courses, setCourses] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch courses and inquiries on mount
  useEffect(() => {
    const loadOptions = async () => {
      const coursesData = await studentService.getCourses();
      setCourses(coursesData.map(c => ({ value: c.id, label: c.name })));

      const inquiriesData = await inquiryService.getInquiries();
      // filter out converted/dropped ones if possible, showing name/phone
      const activeInquiries = inquiriesData.filter(i => i.status !== 'CONVERTED' && i.status !== 'DROPPED');
      setInquiries(activeInquiries.map(i => ({ value: i.id, label: `${i.name} (${i.phone})` })));
    };
    loadOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-populate name/phone if an inquiry is linked
    if (name === 'inquiryId' && value) {
      inquiryService.getInquiryById(value).then((inq) => {
        if (inq) {
          setFormData(prev => ({
            ...prev,
            studentName: inq.name || prev.studentName,
            phone: inq.phone || prev.phone,
            email: inq.email || prev.email,
            inquiryId: value
          }));
        }
      });
    }

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
    if (!formData.studentName.trim()) newErrors.studentName = 'Applicant Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.courseId) newErrors.courseId = 'Course selection is required';
    
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
    try {
      await onSubmit(formData);
    } catch {
      // parent handles error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      
      <Select
        label="Link to CRM Inquiry (Optional)"
        name="inquiryId"
        options={inquiries}
        value={formData.inquiryId}
        onChange={handleChange}
        placeholder="Select existing lead to auto-fill"
      />

      <Input
        label="Applicant Full Name"
        name="studentName"
        placeholder="Tony Stark"
        value={formData.studentName}
        onChange={handleChange}
        error={errors.studentName}
        required
      />

      <Input
        label="Phone Number"
        name="phone"
        placeholder="555-0199"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        required
      />

      <Input
        label="Email Address"
        name="email"
        type="email"
        placeholder="tony@stark.com"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
      />

      <Select
        label="Requested Course Program"
        name="courseId"
        options={courses}
        value={formData.courseId}
        onChange={handleChange}
        error={errors.courseId}
        placeholder="Select Course"
        required
      />

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-2">
        <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" loading={loading}>
          Log Application
        </Button>
      </div>

    </form>
  );
};

export default AdmissionForm;
