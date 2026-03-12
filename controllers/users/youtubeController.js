const {
  addYoutubeShort,
  getAllYoutubeShorts,
  deleteYoutubeShort,
} = require("../../model/users/youtubeModel");

exports.createYoutubeShort = async (req, res) => {
  try {
    const { short_id } = req.body;

    if (!short_id) {
      return res.json({ success: false, message: "YouTube Short ID required" });
    }

    const existingShorts = await getAllYoutubeShorts();
    if (existingShorts.length >= 6) {
      return res.json({
        success: false,
        message: "Maximum 6 YouTube Shorts allowed",
      });
    }

    const id = await addYoutubeShort(short_id);

    res.json({ success: true, id });
  } catch (e) {
    console.error("error: ", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.listYoutubeShorts = async (req, res) => {
  try {
    const shorts = await getAllYoutubeShorts();
    res.json({ success: true, shorts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteYoutubeShortById = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteYoutubeShort(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
