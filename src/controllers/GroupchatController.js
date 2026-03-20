// controllers/groupController.js

import GroupChat from "../models/GroupChat";

export const getGroups = async (req, res) => {
  try {
    const {
      city,
      university,
      subject,
      search,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = {};

    // 🔍 Filters
    if (city) {
      filter.city = city.toLowerCase();
    }

    if (university) {
      filter.university = university;
    }

    if (subject) {
      filter.subject = subject;
    }

    // 🔎 Search (name + tags)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    let query = GroupChat.find(filter);

    // 🔽 Sorting
    if (sort === "latest") {
      query = query.sort({ createdAt: -1 });
    } else if (sort === "members") {
      query = query.sort({ memberCount: -1 });
    } else if (sort === "az") {
      query = query.sort({ name: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    // 📄 Pagination
    const skip = (page - 1) * limit;

    const groups = await query.skip(skip).limit(Number(limit));

    const total = await GroupChat.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: groups,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Get single group
export const getGroupBySlug = async (req, res) => {
  try {
    const group = await GroupChat.findOne({ slug: req.params.slug });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ➕ Create group
export const createGroup = async (req, res) => {
  try {
    const newGroup = new GroupChat(req.body);
    const saved = await newGroup.save();

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};