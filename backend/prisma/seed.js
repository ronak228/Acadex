const prisma = require('../src/db');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting rich database seeding...');

  // Clean up existing records in reverse dependency order
  await prisma.feePayment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.feeInstallment.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.scholarship.deleteMany();
  await prisma.assignmentSubmission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.studyMaterial.deleteMany();
  await prisma.syllabusProgress.deleteMany();
  await prisma.syllabusUnit.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.questionBank.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.facultyAttendance.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.faculty.deleteMany();
  await prisma.designation.deleteMany();
  await prisma.department.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.student.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleaned successfully.');

  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash('AdminSecretPass123', salt);
  const userPasswordHash = await bcrypt.hash('Madhav12@', salt);

  // 1. Create Core Users
  const userMadhav = await prisma.user.create({
    data: {
      name: 'Madhav Desai',
      email: 'mddesai207@gmail.com',
      password: userPasswordHash,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      name: 'System Super Admin',
      email: 'superadmin@eduerp.com',
      password: commonPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: 'Sarah Smith',
      email: 'admin1@eduerp.com',
      password: commonPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const receptionistUser = await prisma.user.create({
    data: {
      name: 'Nancy Drew',
      email: 'receptionist1@eduerp.com',
      password: commonPassword,
      role: 'RECEPTIONIST',
      isActive: true,
    },
  });

  // 2. Create Courses
  const courseCS = await prisma.course.create({
    data: { name: 'Computer Science', code: 'CS', durationMonths: 36, fees: 50000.00, isActive: true },
  });

  const courseIT = await prisma.course.create({
    data: { name: 'Information Technology', code: 'IT', durationMonths: 36, fees: 45000.00, isActive: true },
  });

  const courseBS = await prisma.course.create({
    data: { name: 'Bio-Science', code: 'BS', durationMonths: 24, fees: 40000.00, isActive: true },
  });

  // 3. Create Designations & Departments
  const designationProf = await prisma.designation.create({
    data: { name: 'Professor', description: 'Senior teaching staff' },
  });
  const designationAssocProf = await prisma.designation.create({
    data: { name: 'Associate Professor', description: 'Mid-level teaching staff' },
  });
  const deptCS = await prisma.department.create({
    data: { name: 'Computer Science', code: 'CS-DEPT', isActive: true },
  });
  const deptIT = await prisma.department.create({
    data: { name: 'Information Technology', code: 'IT-DEPT', isActive: true },
  });

  // 4. Create Faculty Users & Records
  const userFaculty1 = await prisma.user.create({
    data: { name: 'Dr. Alan Turing', email: 'turing@eduerp.com', password: commonPassword, role: 'FACULTY', isActive: true },
  });

  const faculty1 = await prisma.faculty.create({
    data: {
      userId: userFaculty1.id,
      employeeCode: 'FAC-2026-001',
      designation: 'Professor',
      department: 'Computer Science',
      designationId: designationProf.id,
      departmentId: deptCS.id,
      dateOfJoining: new Date('2024-01-01'),
      qualification: 'PhD in Computer Science',
      bankAccount: '12345678901',
      baseSalary: 80000.00,
      isActive: true,
    },
  });

  const userFaculty2 = await prisma.user.create({
    data: { name: 'Dr. Ada Lovelace', email: 'lovelace@eduerp.com', password: commonPassword, role: 'FACULTY', isActive: true },
  });

  const faculty2 = await prisma.faculty.create({
    data: {
      userId: userFaculty2.id,
      employeeCode: 'FAC-2026-002',
      designation: 'Associate Professor',
      department: 'Information Technology',
      designationId: designationAssocProf.id,
      departmentId: deptIT.id,
      dateOfJoining: new Date('2024-06-01'),
      qualification: 'PhD in Information Systems',
      bankAccount: '98765432109',
      baseSalary: 75000.00,
      isActive: true,
    },
  });

  // 5. Create Batches (linked to Courses & Faculty)
  const batchCS_A = await prisma.batch.create({
    data: { name: 'Batch 2026-A', courseId: courseCS.id, startDate: new Date('2026-06-01'), facultyId: faculty1.id, isActive: true },
  });

  const batchCS_B = await prisma.batch.create({
    data: { name: 'Batch 2026-B', courseId: courseCS.id, startDate: new Date('2026-06-15'), facultyId: faculty1.id, isActive: true },
  });

  const batchIT_C = await prisma.batch.create({
    data: { name: 'Batch 2026-C', courseId: courseIT.id, startDate: new Date('2026-06-01'), facultyId: faculty2.id, isActive: true },
  });

  const batchBS_D = await prisma.batch.create({
    data: { name: 'Batch 2026-D', courseId: courseBS.id, startDate: new Date('2026-06-01'), isActive: true },
  });

  // 5. Create Subjects
  const subjectIntroCS = await prisma.subject.create({
    data: { name: 'Introduction to Programming', code: 'CS-101', courseId: courseCS.id, isActive: true },
  });

  const subjectDBMS = await prisma.subject.create({
    data: { name: 'Database Management Systems', code: 'CS-102', courseId: courseCS.id, isActive: true },
  });

  const subjectWebTech = await prisma.subject.create({
    data: { name: 'Web Technologies', code: 'IT-101', courseId: courseIT.id, isActive: true },
  });

  const subjectGenetics = await prisma.subject.create({
    data: { name: 'Genetics & Evolution', code: 'BS-101', courseId: courseBS.id, isActive: true },
  });

  // 6. Create Timetables
  await prisma.timetable.create({
    data: { batchId: batchCS_A.id, subjectId: subjectIntroCS.id, facultyId: faculty1.id, dayOfWeek: 1, startTime: '09:00', endTime: '10:30', room: 'Lab 101' },
  });
  await prisma.timetable.create({
    data: { batchId: batchCS_A.id, subjectId: subjectDBMS.id, facultyId: faculty1.id, dayOfWeek: 3, startTime: '11:00', endTime: '12:30', room: 'Lecture Hall A' },
  });
  await prisma.timetable.create({
    data: { batchId: batchIT_C.id, subjectId: subjectWebTech.id, facultyId: faculty2.id, dayOfWeek: 2, startTime: '09:00', endTime: '10:30', room: 'Lab 203' },
  });

  // 7. Create Syllabus Units
  const syllabusUnit1 = await prisma.syllabusUnit.create({
    data: { courseId: courseCS.id, subjectId: subjectIntroCS.id, unitNumber: 1, title: 'Basics of Programming', description: 'Variables, loops, and conditions.' },
  });
  const syllabusUnit2 = await prisma.syllabusUnit.create({
    data: { courseId: courseCS.id, subjectId: subjectIntroCS.id, unitNumber: 2, title: 'Functions & Recursion', description: 'Understanding function calls.' },
  });

  await prisma.syllabusProgress.create({
    data: { unitId: syllabusUnit1.id, batchId: batchCS_A.id, isCovered: true, coveredAt: new Date(), coveredBy: userFaculty1.id },
  });
  await prisma.syllabusProgress.create({
    data: { unitId: syllabusUnit2.id, batchId: batchCS_A.id, isCovered: false },
  });

  // 8. Create Inquiries & Admissions
  const inquiry1 = await prisma.inquiry.create({
    data: { name: 'Alice Smith', phone: '9988776655', email: 'alice.smith@test.com', courseInterest: 'Computer Science', status: 'NEW', source: 'Website', notes: 'Highly interested in Software Engineering.', followUpDate: new Date('2026-06-12'), assignedTo: superAdmin.id },
  });

  const inquiry2 = await prisma.inquiry.create({
    data: { name: 'Bob Johnson', phone: '8877665544', email: 'bob.johnson@test.com', courseInterest: 'Information Technology', status: 'CONTACTED', source: 'Referral', notes: 'Needs detail about installment plans.', followUpDate: new Date('2026-06-10'), assignedTo: superAdmin.id },
  });

  const inquiry3 = await prisma.inquiry.create({
    data: { name: 'Charlie Green', phone: '7766554433', email: 'charlie.green@test.com', courseInterest: 'Bio-Science', status: 'INTERESTED', source: 'Walk-in', notes: 'Wants admission next week.', followUpDate: new Date('2026-06-11'), assignedTo: superAdmin.id },
  });

  const inquiry4 = await prisma.inquiry.create({
    data: { name: 'John Doe', phone: '9876543210', email: 'john.doe@test.com', courseInterest: 'Computer Science', status: 'CONVERTED', source: 'Newspaper Ad' },
  });

  const inquiry5 = await prisma.inquiry.create({
    data: { name: 'Jane Miller', phone: '1234567890', email: 'jane.miller@test.com', courseInterest: 'Information Technology', status: 'DROPPED', source: 'Search Engine', notes: 'Fees too high.' },
  });

  const admissionActive = await prisma.admission.create({
    data: { studentName: 'John Doe', phone: '9876543210', email: 'john.doe@test.com', courseId: courseCS.id, status: 'ENROLLED', appliedAt: new Date('2026-05-15'), reviewedBy: adminUser.id, remarks: 'Documents verified. Proceeding to enrollment.' },
  });

  const admissionPending = await prisma.admission.create({
    data: { studentName: 'Emma Watson', phone: '9991112222', email: 'emma@test.com', courseId: courseCS.id, status: 'UNDER_REVIEW', appliedAt: new Date('2026-06-08'), reviewedBy: adminUser.id, remarks: 'Waiting for original birth certificate.' },
  });

  const admissionApproved = await prisma.admission.create({
    data: { studentName: 'Liam Neeson', phone: '8882223333', email: 'liam@test.com', courseId: courseIT.id, status: 'APPROVED', appliedAt: new Date('2026-06-01') },
  });

  // 9. Create Student Users & Records
  const userStudent1 = await prisma.user.create({
    data: { name: 'John Doe', email: 'john.doe@test.com', password: commonPassword, role: 'STUDENT', isActive: true },
  });

  const student1 = await prisma.student.create({
    data: {
      userId: userStudent1.id,
      rollNumber: 'CS-2026-001',
      dateOfBirth: new Date('2005-05-15'),
      gender: 'MALE',
      address: '123 CS Lane, Silicon Valley',
      parentName: 'Robert Doe',
      parentPhone: '9998887776',
      courseId: courseCS.id,
      batchId: batchCS_A.id,
      isActive: true,
    },
  });

  await prisma.admission.update({
    where: { id: admissionActive.id },
    data: { enrolledStudentId: student1.id },
  });

  const userStudent2 = await prisma.user.create({
    data: { name: 'Jane Smith', email: 'jane.smith@test.com', password: commonPassword, role: 'STUDENT', isActive: true },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: userStudent2.id,
      rollNumber: 'CS-2026-002',
      dateOfBirth: new Date('2005-08-20'),
      gender: 'FEMALE',
      address: '456 Science Rd, Seattle',
      parentName: 'Thomas Smith',
      parentPhone: '8887776665',
      courseId: courseCS.id,
      batchId: batchCS_A.id,
      isActive: true,
    },
  });

  const userStudent3 = await prisma.user.create({
    data: { name: 'Alice Johnson', email: 'alice.johnson@test.com', password: commonPassword, role: 'STUDENT', isActive: true },
  });

  const student3 = await prisma.student.create({
    data: {
      userId: userStudent3.id,
      rollNumber: 'IT-2026-001',
      dateOfBirth: new Date('2006-02-10'),
      gender: 'FEMALE',
      address: '789 Tech Park, San Francisco',
      parentName: 'David Johnson',
      parentPhone: '7776665554',
      courseId: courseIT.id,
      batchId: batchIT_C.id,
      isActive: true,
    },
  });

  // 10. Create Attendance Logs (last 3 days)
  const days = [new Date(), new Date(Date.now() - 86400000), new Date(Date.now() - 172800000)];
  
  for (const date of days) {
    await prisma.attendance.createMany({
      data: [
        { studentId: student1.id, batchId: batchCS_A.id, date, status: 'PRESENT', markedBy: userFaculty1.id },
        { studentId: student2.id, batchId: batchCS_A.id, date, status: 'PRESENT', markedBy: userFaculty1.id },
        { studentId: student3.id, batchId: batchIT_C.id, date, status: 'PRESENT', markedBy: userFaculty2.id },
      ],
    });
    
    await prisma.facultyAttendance.createMany({
      data: [
        { facultyId: faculty1.id, date, status: 'PRESENT', markedBy: superAdmin.id },
        { facultyId: faculty2.id, date, status: 'PRESENT', markedBy: superAdmin.id },
      ],
    });
  }

  // 11. Create Salary Ledger for May 2026
  await prisma.salaryRecord.createMany({
    data: [
      { facultyId: faculty1.id, month: 5, year: 2026, baseSalary: 80000.00, deductions: 2000.00, bonus: 5000.00, netSalary: 83000.00, paidAt: new Date(), paidBy: superAdmin.id, remarks: 'Regular salary + May performance bonus.' },
      { facultyId: faculty2.id, month: 5, year: 2026, baseSalary: 75000.00, deductions: 1500.00, bonus: 0.00, netSalary: 73500.00, paidAt: new Date(), paidBy: superAdmin.id, remarks: 'Regular monthly salary.' },
    ],
  });

  // 12. Create Examinations & Results
  const examIntro = await prisma.exam.create({
    data: {
      title: 'Programming Midterms',
      courseId: courseCS.id,
      batchId: batchCS_A.id,
      examType: 'INTERNAL',
      examDate: new Date('2026-06-05'),
      totalMarks: 100,
      passingMarks: 40,
      createdBy: superAdmin.id,
    },
  });

  await prisma.examResult.createMany({
    data: [
      { examId: examIntro.id, studentId: student1.id, marksObtained: 85.50, status: 'PASS', enteredBy: superAdmin.id, remarks: 'Excellent logical skills.' },
      { examId: examIntro.id, studentId: student2.id, marksObtained: 38.00, status: 'FAIL', enteredBy: superAdmin.id, remarks: 'Needs more practice with recursion.' },
    ],
  });

  // 13. Create Assignments & Submissions
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'Loops and Conditions Exercises',
      description: 'Solve 10 algorithm problems related to loops and conditionals.',
      batchId: batchCS_A.id,
      subjectId: subjectIntroCS.id,
      createdBy: userFaculty1.id,
      dueDate: new Date(Date.now() + 86400000 * 5),
      maxMarks: 100,
      status: 'PUBLISHED',
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1.id,
      submittedAt: new Date(),
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student2.id,
      submittedAt: null,
    },
  });

  // 14. Create Finance structures, Discounts & Payments
  const discountEarly = await prisma.discount.create({
    data: { name: 'Early Bird Special', type: 'PERCENTAGE', value: 10.00, courseId: courseCS.id, isActive: true },
  });

  const feeStructureCS = await prisma.feeStructure.create({
    data: { name: 'CS Core Fee Structure', courseId: courseCS.id, totalAmount: 50000.00, frequency: 'QUARTERLY', isActive: true },
  });

  const inst1 = await prisma.feeInstallment.create({
    data: { feeStructureId: feeStructureCS.id, installmentNo: 1, label: 'Term 1 Fee', amount: 25000.00, dueDate: new Date('2026-06-01') },
  });

  const inst2 = await prisma.feeInstallment.create({
    data: { feeStructureId: feeStructureCS.id, installmentNo: 2, label: 'Term 2 Fee', amount: 25000.00, dueDate: new Date('2026-09-01') },
  });

  // Link Student 1 with 10% Discount
  const studentFee1 = await prisma.studentFee.create({
    data: { studentId: student1.id, feeStructureId: feeStructureCS.id, discountId: discountEarly.id, netPayable: 45000.00 },
  });

  // Link Student 2 with no Discount
  const studentFee2 = await prisma.studentFee.create({
    data: { studentId: student2.id, feeStructureId: feeStructureCS.id, netPayable: 50000.00 },
  });

  // Record Payments
  await prisma.feePayment.create({
    data: {
      studentFeeId: studentFee1.id,
      installmentId: inst1.id,
      amountPaid: 22500.00, // 25000 - 10%
      paymentMethod: 'UPI',
      paymentDate: new Date('2026-06-02'),
      status: 'PAID',
      transactionRef: 'TXN-UPI-789456',
      collectedBy: superAdmin.id,
      receiptNumber: 'RCP-2026-0001',
      remarks: 'First installment paid online.',
    },
  });

  await prisma.feePayment.create({
    data: {
      studentFeeId: studentFee2.id,
      installmentId: inst1.id,
      amountPaid: 25000.00,
      paymentMethod: 'CASH',
      paymentDate: new Date('2026-06-03'),
      status: 'PAID',
      collectedBy: superAdmin.id,
      receiptNumber: 'RCP-2026-0002',
      remarks: 'First installment paid in cash.',
    },
  });

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
