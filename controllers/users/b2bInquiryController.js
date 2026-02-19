const asyncHandler = require("express-async-handler");
const InquiryModel = require("../../model/users/b2bInquiryModel");

// CREATE
exports.createInquiry = asyncHandler(async (req, res) => {
  const id = await InquiryModel.create(req.body);

  res.status(201).json({
    success: true,
    message: "Inquiry submitted successfully",
    id,
  });
});

// GET ALL — Pagination + Search + Filter
// exports.getInquiries = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const search = req.query.search || "";
//   const status = req.query.status || "";

//   const result = await InquiryModel.getAll({ page, limit, search, status });

//   res.json({
//     success: true,
//     pagination: {
//       totalItems: result.total,
//       limit,
//       page,
//       totalPages: Math.ceil(result.total / limit),
//     },
//     data: result.data,
//   });
// });

exports.getInquiries = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const status = req.query.status || "";

  const result = await InquiryModel.getAll({ page, limit, search, status });

  res.json({
    success: true,
    pagination: {
      totalItems: result.total,
      limit,
      page,
      totalPages: Math.ceil(result.total / limit),
    },
    data: result.data,
  });
});

// GET ONE
exports.getInquiryById = asyncHandler(async (req, res) => {
  const inquiry = await InquiryModel.getById(req.params.id);

  if (!inquiry) {
    return res
      .status(404)
      .json({ success: false, message: "Inquiry not found" });
  }

  res.json({ success: true, data: inquiry });
});

// UPDATE
exports.updateInquiry = asyncHandler(async (req, res) => {
  const affected = await InquiryModel.update(req.params.id, req.body);

  if (!affected)
    return res
      .status(404)
      .json({ success: false, message: "Inquiry not found" });

  res.json({ success: true, message: "Inquiry updated successfully" });
});

/* =====================================================
    DELETE Inquiry Controller
===================================================== */
exports.deleteInquiry = asyncHandler(async (req, res) => {
  const inquiryId = req.params.id;

  if (!inquiryId) {
    return res.status(400).json({
      success: false,
      message: "Inquiry ID is required",
    });
  }

  const affected = await InquiryModel.delete(inquiryId);

  if (!affected) {
    return res.status(404).json({
      success: false,
      message: "Inquiry not found",
    });
  }

  return res.json({
    success: true,
    message: "Inquiry deleted successfully",
  });
});
