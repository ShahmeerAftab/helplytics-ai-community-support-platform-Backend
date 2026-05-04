import Request from "../models/request.js";

// Simple keyword-based category detection (AI feature)
function detectCategory(description) {
  const text = description.toLowerCase();
  if (/react|html|css/.test(text))       return "Frontend";
  if (/node|api|express/.test(text))     return "Backend";
  if (/database|mongo|sql/.test(text))   return "Database";
  return null; // no keyword match — keep user's choice
}

export const createRequest = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    // Auto-categorize from description keywords; falls back to user's choice
    const autoCategory = detectCategory(description);

    const request = await Request.create({
      user: req.user._id,
      title,
      description,
      category: autoCategory || category || "General",
      tags: tags || [],
    });

    await request.populate("user", "username");

    res.status(201).json({ request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRequests = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { title:       { $regex: req.query.search, $options: "i" } },
        { tags:        { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }
    if (req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }

    const [requests, total] = await Promise.all([
      Request.find(filter)
        .populate("user", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Request.countDocuments(filter),
    ]);

    res.json({
      requests,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyRequests = async (req, res) => {
  try {
    const myRequests = await Request.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    const helpedCount = await Request.countDocuments({ helpers: req.user._id });

    const stats = {
      total:  myRequests.length,
      solved: myRequests.filter((r) => r.status === "solved").length,
      open:   myRequests.filter((r) => r.status === "open").length,
      helped: helpedCount,
    };

    res.json({ requests: myRequests, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("user", "username")
      .populate("helpers", "username")
      .populate("responses.user", "username");

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, category, tags } = req.body;
    if (title)       request.title       = title;
    if (description) request.description = description;
    if (category)    request.category    = category;
    if (tags)        request.tags        = tags;

    await request.save();
    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await request.deleteOne();
    res.json({ message: "Question deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addResponse = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: "Response text is required" });
    }

    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.responses.push({ user: req.user._id, text: text.trim() });

    if (!request.helpers.includes(req.user._id)) {
      request.helpers.push(req.user._id);
    }

    await request.save();
    await request.populate("responses.user", "username");

    res.status(201).json({ response: request.responses.at(-1) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addHelper = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const userId = req.user._id.toString();

    // Prevent duplicate helpers
    const alreadyHelping = request.helpers.some((h) => h.toString() === userId);
    if (alreadyHelping) {
      return res.status(400).json({ message: "You are already marked as a helper" });
    }

    request.helpers.push(req.user._id);
    await request.save();

    res.json({ helperCount: request.helpers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markSolved = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the question author can mark it as solved" });
    }

    request.status = "solved";
    await request.save();

    res.json({ message: "Marked as solved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
