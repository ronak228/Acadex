const prisma = require('../db');

/**
 * @desc    Create a new prospective student inquiry
 * @route   POST /api/v1/inquiries
 * @access  Private (Admin, Receptionist)
 */
const createInquiry = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      courseInterest,
      status,
      source,
      notes,
      followUpDate,
      assignedTo
    } = req.body;

    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        message: 'Missing required fields. name and phone are required.'
      });
    }

    // Validate status format if provided
    const queryStatus = (status || 'NEW').toUpperCase();
    const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'DROPPED'];
    if (!validStatuses.includes(queryStatus)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Duplicate phone number check — allow re-inquiry for DROPPED leads
    const existingInquiry = await prisma.inquiry.findFirst({
      where: { phone, status: { not: 'DROPPED' } }
    });
    if (existingInquiry) {
      return res.status(400).json({
        message: `An inquiry with phone number ${phone} already exists`
      });
    }

    // Access control: Assigning inquiries to staff is ADMIN only
    if (assignedTo && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        message: 'Access denied. Only administrators can assign inquiries to staff.'
      });
    }

    // Validate assigned staff user exists and is staff (not a student)
    if (assignedTo) {
      const staff = await prisma.user.findUnique({
        where: { id: assignedTo }
      });
      if (!staff) {
        return res.status(400).json({ message: 'Assigned staff user not found' });
      }
      const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'RECEPTIONIST'];
      if (!staffRoles.includes(staff.role)) {
        return res.status(400).json({ message: 'Inquiries can only be assigned to staff members.' });
      }
    }

    // Parse and validate follow-up date
    let parsedFollowUpDate;
    if (followUpDate) {
      parsedFollowUpDate = new Date(followUpDate);
      if (isNaN(parsedFollowUpDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid followUpDate format. Please use a valid date string.'
        });
      }
    }

    // Conversion Behavior: status set to CONVERTED
    if (queryStatus === 'CONVERTED') {
      // Must find a course for admission creation
      let course = null;
      const courseId = req.body.courseId;
      if (courseId) {
        course = await prisma.course.findUnique({ where: { id: courseId } });
      } else if (courseInterest) {
        // Try UUID check
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseInterest);
        if (isUuid) {
          course = await prisma.course.findUnique({ where: { id: courseInterest } });
        }
        if (!course) {
          // Look up by exact/case-insensitive code or name
          course = await prisma.course.findFirst({
            where: {
              OR: [
                { code: { equals: courseInterest, mode: 'insensitive' } },
                { name: { equals: courseInterest, mode: 'insensitive' } }
              ]
            }
          });
        }
      }

      if (!course) {
        return res.status(400).json({
          message: 'A valid courseId or matching courseInterest is required to convert this inquiry to an admission.'
        });
      }

      if (!course.isActive) {
        return res.status(400).json({
          message: 'The selected course is inactive. Cannot convert inquiry to admission.'
        });
      }

      // Execute transaction to create inquiry and admission
      const result = await prisma.$transaction(async (tx) => {
        const newInquiry = await tx.inquiry.create({
          data: {
            name,
            phone,
            email: email || null,
            courseInterest: courseInterest || null,
            status: 'CONVERTED',
            source: source || null,
            notes: notes || null,
            followUpDate: parsedFollowUpDate || null,
            assignedTo: assignedTo || null
          }
        });

        const newAdmission = await tx.admission.create({
          data: {
            inquiryId: newInquiry.id,
            studentName: name,
            phone,
            email: email || null,
            courseId: course.id,
            status: 'APPLIED',
            remarks: `Converted during creation of inquiry ${newInquiry.id}. Notes: ${notes || ''}`
          }
        });

        return { inquiry: newInquiry, admission: newAdmission };
      });

      return res.status(201).json({
        message: 'Inquiry created and converted to admission successfully',
        data: result
      });
    }

    // Normal Inquiry creation
    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        phone,
        email: email || null,
        courseInterest: courseInterest || null,
        status: queryStatus,
        source: source || null,
        notes: notes || null,
        followUpDate: parsedFollowUpDate || null,
        assignedTo: assignedTo || null
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(201).json({
      message: 'Inquiry created successfully',
      data: inquiry
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all inquiries (filterable)
 * @route   GET /api/v1/inquiries
 * @access  Private (Admin, Receptionist)
 */
const getInquiries = async (req, res, next) => {
  try {
    const { status, assignedTo, followUpDate, courseInterest, search } = req.query;

    const where = {};

    // Filter by status (case-insensitive enum check)
    if (status) {
      const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'DROPPED'];
      if (validStatuses.includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
      }
    }

    // Filter by assigned staff member
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Filter by course interest (case-insensitive substring contains)
    if (courseInterest) {
      where.courseInterest = { contains: courseInterest, mode: 'insensitive' };
    }

    // Filter by follow-up date (exact date or 'today')
    if (followUpDate) {
      const parseToUTCDate = (str) => {
        const parts = str.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      };
      if (followUpDate.toLowerCase() === 'today') {
        const now = new Date();
        where.followUpDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      } else {
        const parsed = parseToUTCDate(followUpDate);
        if (!parsed) {
          return res.status(400).json({ message: 'Invalid followUpDate format. Please use YYYY-MM-DD or today.' });
        }
        where.followUpDate = parsed;
      }
    }

    // Filter by search query (name or phone)
    if (search) {
      const searchTrimmed = search.trim();
      where.OR = [
        { name: { contains: searchTrimmed, mode: 'insensitive' } },
        { phone: { contains: searchTrimmed, mode: 'insensitive' } }
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json(inquiries);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get inquiry details by ID
 * @route   GET /api/v1/inquiries/:id
 * @access  Private (Admin, Receptionist)
 */
const getInquiryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        admissions: true
      }
    });

    if (!inquiry) {
      return res.status(404).json({
        message: 'Inquiry record not found'
      });
    }

    return res.status(200).json(inquiry);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update inquiry details
 * @route   PUT /api/v1/inquiries/:id
 * @access  Private (Admin, Receptionist)
 */
const updateInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      courseInterest,
      status,
      source,
      notes,
      followUpDate,
      assignedTo,
      courseId
    } = req.body;

    const existingInquiry = await prisma.inquiry.findUnique({
      where: { id }
    });

    if (!existingInquiry) {
      return res.status(404).json({
        message: 'Inquiry record not found'
      });
    }

    // 1. Inquiry status cannot be changed back after CONVERTED
    if (existingInquiry.status === 'CONVERTED' && status && status.toUpperCase() !== 'CONVERTED') {
      return res.status(400).json({
        message: 'Inquiry status cannot be changed after it has been CONVERTED'
      });
    }

    // 2. Validate status if passed
    if (status) {
      const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED', 'DROPPED'];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // 3. Duplicate phone number check — allow re-inquiry for DROPPED leads
    if (phone && phone !== existingInquiry.phone) {
      const existingPhone = await prisma.inquiry.findFirst({
        where: { phone, status: { not: 'DROPPED' } }
      });
      if (existingPhone) {
        return res.status(400).json({
          message: `An inquiry with phone number ${phone} already exists`
        });
      }
    }

    // 4. Access control: Assigning inquiries to staff is ADMIN only
    if (assignedTo !== undefined && assignedTo !== existingInquiry.assignedTo) {
      if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          message: 'Access denied. Only administrators can assign inquiries to staff.'
        });
      }

      // Validate assigned staff user exists and is staff (not a student)
      if (assignedTo) {
        const staff = await prisma.user.findUnique({
          where: { id: assignedTo }
        });
        if (!staff) {
          return res.status(400).json({ message: 'Assigned staff user not found' });
        }
        const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'RECEPTIONIST'];
        if (!staffRoles.includes(staff.role)) {
          return res.status(400).json({ message: 'Inquiries can only be assigned to staff members.' });
        }
      }
    }

    // Parse and validate follow-up date if provided
    let parsedFollowUpDate;
    if (followUpDate !== undefined) {
      if (followUpDate === null) {
        parsedFollowUpDate = null;
      } else {
        parsedFollowUpDate = new Date(followUpDate);
        if (isNaN(parsedFollowUpDate.getTime())) {
          return res.status(400).json({
            message: 'Invalid followUpDate format. Please use a valid date string.'
          });
        }
      }
    }

    const targetStatus = status ? status.toUpperCase() : existingInquiry.status;

    // Check transition to CONVERTED
    if (targetStatus === 'CONVERTED' && existingInquiry.status !== 'CONVERTED') {
      // Must find a course for admission creation
      let course = null;
      if (courseId) {
        course = await prisma.course.findUnique({ where: { id: courseId } });
      } else {
        const interest = courseInterest || existingInquiry.courseInterest;
        if (interest) {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(interest);
          if (isUuid) {
            course = await prisma.course.findUnique({ where: { id: interest } });
          }
          if (!course) {
            course = await prisma.course.findFirst({
              where: {
                OR: [
                  { code: { equals: interest, mode: 'insensitive' } },
                  { name: { equals: interest, mode: 'insensitive' } }
                ]
              }
            });
          }
        }
      }

      if (!course) {
        return res.status(400).json({
          message: 'A valid courseId or matching courseInterest is required to convert this inquiry to an admission.'
        });
      }

      if (!course.isActive) {
        return res.status(400).json({
          message: 'The selected course is inactive. Cannot convert inquiry to admission.'
        });
      }

      // Execute transaction to update inquiry and create admission
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.inquiry.update({
          where: { id },
          data: {
            name: name || existingInquiry.name,
            phone: phone || existingInquiry.phone,
            email: email !== undefined ? email : existingInquiry.email,
            courseInterest: courseInterest !== undefined ? courseInterest : existingInquiry.courseInterest,
            status: 'CONVERTED',
            source: source !== undefined ? source : existingInquiry.source,
            notes: notes !== undefined ? notes : existingInquiry.notes,
            followUpDate: followUpDate !== undefined ? parsedFollowUpDate : existingInquiry.followUpDate,
            assignedTo: assignedTo !== undefined ? assignedTo : existingInquiry.assignedTo
          }
        });

        const admission = await tx.admission.create({
          data: {
            inquiryId: updated.id,
            studentName: updated.name,
            phone: updated.phone,
            email: updated.email,
            courseId: course.id,
            status: 'APPLIED',
            remarks: `Converted from inquiry ${updated.id}. Notes: ${notes || existingInquiry.notes || ''}`
          }
        });

        return { inquiry: updated, admission };
      });

      return res.status(200).json({
        message: 'Inquiry updated and converted to admission successfully',
        data: result
      });
    }

    // Normal update
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (courseInterest !== undefined) updateData.courseInterest = courseInterest;
    if (status) updateData.status = status.toUpperCase();
    if (source !== undefined) updateData.source = source;
    if (notes !== undefined) updateData.notes = notes;
    if (followUpDate !== undefined) updateData.followUpDate = parsedFollowUpDate;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return res.status(200).json({
      message: 'Inquiry updated successfully',
      data: updatedInquiry
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete an inquiry (sets status to DROPPED)
 * @route   DELETE /api/v1/inquiries/:id
 * @access  Private (Admin only)
 */
const deleteInquiry = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingInquiry = await prisma.inquiry.findUnique({
      where: { id }
    });

    if (!existingInquiry) {
      return res.status(404).json({
        message: 'Inquiry record not found'
      });
    }

    // Inquiries are never hard-deleted (soft archive by setting status to DROPPED)
    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: { status: 'DROPPED' }
    });

    return res.status(200).json({
      message: 'Inquiry soft-deleted successfully',
      data: updatedInquiry
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry
};
