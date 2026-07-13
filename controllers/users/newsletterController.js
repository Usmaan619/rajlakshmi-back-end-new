const asyncHandler = require("express-async-handler");
const newsletterModel = require("../../model/users/newsletterModel");

// LIST WITH PAGINATION
exports.getNewsletter = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", status = "" } = req.query;

  const data = await newsletterModel.getAll({
    page: Number(page),
    limit: Number(limit),
    search,
    status,
  });

  res.status(200).json({
    success: true,
    data: data.rows,
    pagination: data.pagination,
  });
});

// CREATE
exports.createNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const id = await newsletterModel.create(email);

  res.status(201).json({
    success: true,
    message: "Email subscribed successfully",
    id,
  });
});

// UPDATE STATUS
exports.updateNewsletterStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  await newsletterModel.updateStatus(req.params.id, status);

  res.status(200).json({
    success: true,
    message: "Status updated",
  });
});

// DELETE
exports.deleteNewsletter = asyncHandler(async (req, res) => {
  await newsletterModel.delete(req.params.id);

  res.status(200).json({
    success: true,
    message: "Newsletter deleted",
  });
});
