class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({ success: true, message, data });
  }

  static error(res, message = 'Error', statusCode = 500) {
    return res.status(statusCode).json({ success: false, message });
  }

  static paginated(res, data, total, page, limit) {
    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  }
}

module.exports = ApiResponse;
