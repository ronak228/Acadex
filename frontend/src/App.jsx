import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import StudentListPage from './pages/Students/StudentListPage';
import AddStudentPage from './pages/Students/AddStudentPage';
import StudentDetailPage from './pages/Students/StudentDetailPage';
import EditStudentPage from './pages/Students/EditStudentPage';
import InquiryPage from './pages/Inquiry/InquiryPage';
import AdmissionPage from './pages/Admissions/AdmissionPage';
import FacultyPage from './pages/Faculty/FacultyPage';
import DesignationPage from './pages/Faculty/DesignationPage';
import DepartmentPage from './pages/Faculty/DepartmentPage';
import AttendancePage from './pages/Attendance/AttendancePage';
import AttendanceMarkForm from './pages/Attendance/AttendanceMarkForm';
import SalaryPage from './pages/Salary/SalaryPage';
import UserAdminPage from './pages/Dashboard/UserAdminPage';
import ProtectedRoute from './routes/ProtectedRoute';
import CoursePage from './pages/Courses/CoursePage';
import SubjectPage from './pages/Subjects/SubjectPage';
import BatchPage from './pages/Batch/BatchPage';
import BatchDetail from './pages/Batch/BatchDetail';
import TimetablePage from './pages/Timetable/TimetablePage';
import StudentAttendancePage from './pages/StudentAttendance/StudentAttendancePage';
import StudentAttendanceMarkForm from './pages/StudentAttendance/AttendanceMarkForm';
import AttendanceSummary from './pages/StudentAttendance/AttendanceSummary';
import SyllabusPage from './pages/Syllabus/SyllabusPage';
import MaterialsPage from './pages/Materials/MaterialsPage';
import AssignmentPage from './pages/Assignments/AssignmentPage';
import AssignmentSubmissions from './pages/Assignments/AssignmentSubmissions';
import FeeStructurePage from './pages/Fees/FeeStructurePage';
import FeeCollectionPage from './pages/Fees/FeeCollectionPage';
import StudentFeePage from './pages/Fees/StudentFeePage';
import DueFeePage from './pages/Fees/DueFeePage';
import ReceiptPage from './pages/Fees/ReceiptPage';
import DiscountPage from './pages/Fees/DiscountPage';
import QuestionBankPage from './pages/Examination/QuestionBankPage';
import ExamListPage from './pages/Examination/ExamListPage';
import ExamCreatePage from './pages/Examination/ExamCreatePage';
import ExamDetailPage from './pages/Examination/ExamDetailPage';
import ResultEntryPage from './pages/Examination/ResultEntryPage';
import StudentResultPage from './pages/Examination/StudentResultPage';
import ExamAnalyticsPage from './pages/Examination/ExamAnalyticsPage';
import RevenueReportPage from './pages/Reports/RevenueReportPage';
import AttendanceReportPage from './pages/Reports/AttendanceReportPage';
import AcademicReportPage from './pages/Reports/AcademicReportPage';
import ExaminationReportPage from './pages/Reports/ExaminationReportPage';
import PerformanceReportPage from './pages/Reports/PerformanceReportPage';
import ConversionReportPage from './pages/Reports/ConversionReportPage';
import DueFeeReportPage from './pages/Reports/DueFeeReportPage';
import TopProgressBar from './components/TopProgressBar';
import ProtectedLayout from './layouts/ProtectedLayout';
import NotFoundPage from './pages/NotFound/NotFoundPage';

function App() {
  return (
    <Router>
      <TopProgressBar />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Global Protected Layout Wrapper */}
        <Route element={<ProtectedLayout />}>
          {/* Protected Dashboard Route */}
          <Route 
            path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT', 'RECEPTIONIST']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Student Registry Route */}
        <Route 
          path="/students" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <StudentListPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Student Enrollment Route */}
        <Route 
          path="/students/add" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AddStudentPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Student Details Route */}
        <Route 
          path="/students/:id" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
              <StudentDetailPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Student Editing Route */}
        <Route 
          path="/students/edit/:id" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <EditStudentPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Inquiry Pipeline Route */}
        <Route 
          path="/inquiries" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']}>
              <InquiryPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Admissions Registry Route */}
        <Route 
          path="/admissions" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']}>
              <AdmissionPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Faculty Registry Route */}
        <Route
          path="/faculty"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <FacultyPage />
            </ProtectedRoute>
          }
        />

        {/* Faculty Designations */}
        <Route
          path="/faculty/designations"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <DesignationPage />
            </ProtectedRoute>
          }
        />

        {/* Faculty Departments */}
        <Route
          path="/faculty/departments"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <DepartmentPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Faculty Attendance Route */}
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <AttendancePage />
            </ProtectedRoute>
          } 
        />

        {/* Protected Mark Attendance Route */}
        <Route 
          path="/attendance/mark" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <AttendanceMarkForm />
            </ProtectedRoute>
          } 
        />

        {/* Protected Payroll Ledger Route */}
        <Route 
          path="/salary" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <SalaryPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected User Accounts Admin Route */}
        <Route 
          path="/users/admin" 
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <UserAdminPage />
            </ProtectedRoute>
          } 
        />

        {/* Course Management */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <CoursePage />
            </ProtectedRoute>
          }
        />

        {/* Subject Management */}
        <Route
          path="/subjects"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <SubjectPage />
            </ProtectedRoute>
          }
        />

        {/* Batch Management */}
        <Route
          path="/batches"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <BatchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batches/:id"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <BatchDetail />
            </ProtectedRoute>
          }
        />

        {/* Timetable */}
        <Route
          path="/timetable"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
              <TimetablePage />
            </ProtectedRoute>
          }
        />

        {/* Student Attendance */}
        <Route
          path="/student-attendance"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <StudentAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-attendance/mark"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <StudentAttendanceMarkForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-attendance/summary"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <AttendanceSummary />
            </ProtectedRoute>
          }
        />

        {/* Syllabus */}
        <Route
          path="/syllabus"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
              <SyllabusPage />
            </ProtectedRoute>
          }
        />

        {/* Study Materials */}
        <Route
          path="/materials"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />

        {/* Assignments */}
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
              <AssignmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments/:id/submissions"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <AssignmentSubmissions />
            </ProtectedRoute>
          }
        />

        {/* Fee Structures */}
        <Route
          path="/fees/structures"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <FeeStructurePage />
            </ProtectedRoute>
          }
        />

        {/* Fee Collection */}
        <Route
          path="/fees/collect"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <FeeCollectionPage />
            </ProtectedRoute>
          }
        />

        {/* Student Fee Summary */}
        <Route
          path="/fees/students"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'STUDENT']}>
              <StudentFeePage />
            </ProtectedRoute>
          }
        />

        {/* Due Fees */}
        <Route
          path="/fees/due"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <DueFeePage />
            </ProtectedRoute>
          }
        />

        {/* Receipt View */}
        <Route
          path="/fees/receipt/:id"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'STUDENT']}>
              <ReceiptPage />
            </ProtectedRoute>
          }
        />

        {/* Discounts & Scholarships */}
        <Route
          path="/fees/discounts"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <DiscountPage />
            </ProtectedRoute>
          }
        />

        {/* Question Bank */}
        <Route
          path="/question-bank"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <QuestionBankPage />
            </ProtectedRoute>
          }
        />

        {/* Exam List */}
        <Route
          path="/exams"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <ExamListPage />
            </ProtectedRoute>
          }
        />

        {/* Exam Create */}
        <Route
          path="/exams/create"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <ExamCreatePage />
            </ProtectedRoute>
          }
        />

        {/* Exam Detail */}
        <Route
          path="/exams/:id"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <ExamDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Result Entry */}
        <Route
          path="/exams/:id/results"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <ResultEntryPage />
            </ProtectedRoute>
          }
        />

        {/* Student Result View */}
        <Route
          path="/results"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentResultPage />
            </ProtectedRoute>
          }
        />

        {/* Exam Analytics */}
        <Route
          path="/analytics/exams"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <ExamAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Reports Module */}
        <Route
          path="/reports/revenue"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <RevenueReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/attendance"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <AttendanceReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/academic"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <AcademicReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/examination"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY']}>
              <ExaminationReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/performance"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
              <PerformanceReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/conversion"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <ConversionReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/due-fees"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
              <DueFeeReportPage />
            </ProtectedRoute>
          }
        />

        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
