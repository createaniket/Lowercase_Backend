const GroupChat = require("../models/GroupChat");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const slugify = require("slugify");
const mongoose = require("mongoose");

// 🔥 HELPER
const parseArray = (value) => {
  if (!value) return [];
  return value.split("|").map((v) => v.trim()).filter(Boolean);
};

// 🔥 FORMAT ROW (UPDATED FOR YOUR SHEET)
const formatRow = (row) => {
  const name = row.Title?.trim();
  const city = row.Cities?.toLowerCase().trim();
  const university = row.Universities?.trim();

  if (!name || !city || !university) return null;

  const baseSlug = slugify(name, { lower: true, strict: true });

  return {
    name,
    slug:
      baseSlug +
      "-" +
      new mongoose.Types.ObjectId().toString().slice(-6),

    date: row.Date ? new Date(row.Date) : null,

    city,
    university,
    subject: row.Subjects?.trim() || "General",

    groupJoinUrl: row.group_join_url || "",
    groupTypeDescription: row.group_type_description || "",
    displayLineMain: row.display_line_main || "",
    displayLineThird: row.display_line_third || "",
    universitySecondLine: row.university_second_line || "",

    groupTypes: parseArray(row["Group Types"]),
    accommodationTypes: parseArray(row["Accommodation Types"]),
    courseLevels: parseArray(row["Course Levels"]),
    hallNames: parseArray(row["Hall Names"]),
  };
};

// ================= UPLOAD =================
const uploadGroupsFile = async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    filePath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();

    let results = [];

    if (ext === ".csv") {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (row) => {
            const formatted = formatRow(row);
            if (formatted) results.push(formatted);
          })
          .on("end", resolve)
          .on("error", reject);
      });
    } else {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      results = data.map(formatRow).filter(Boolean);
    }

    const bulkOps = results.map((item) => ({
      updateOne: {
        filter: {
          name: item.name,
          city: item.city,
          university: item.university,
        },
        update: { $set: item },
        upsert: true,
      },
    }));

    const result = await GroupChat.bulkWrite(bulkOps);

    res.json({
      success: true,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// // ================= GET =================
// const getGroups = async (req, res) => {
//   try {
//     const {
//       city,
//       university,
//       subject,
//       courseLevel,
//       accommodationType,
//       search,
//     } = req.query;

//     let filter = {};

//     if (city) filter.city = city.toLowerCase();
//     if (university) filter.university = university;
//     if (subject) filter.subject = subject;

//     if (courseLevel) {
//       filter.courseLevels = { $in: [courseLevel] };
//     }

//     if (accommodationType) {
//       filter.accommodationTypes = { $in: [accommodationType] };
//     }

//     if (search) {
//       filter.$text = { $search: search };
//     }

//     // const data = await GroupChat.find(filter).limit(50);

//     const data = await GroupChat.find(filter);


//     res.json({ success: true, data });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };


const getGroups = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 25,
      city,
      subject,
      university,
    } = req.query;

    const query = {};

    // 🔍 SEARCH (multi-field)
    if (search && search.trim() !== "") {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { university: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { displayLineMain: { $regex: search, $options: "i" } },
        { groupTypeDescription: { $regex: search, $options: "i" } },
      ];
    }

    // 🎯 FILTERS (optional)
    if (city) query.city = city;
    if (subject) query.subject = subject;
    if (university) query.university = university;

    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      GroupChat.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),

      GroupChat.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: groups,
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


const GetFilters = async (req, res) => {
  try {
    const universities = await GroupChat.distinct("university");
    const subjects = await GroupChat.distinct("subject");

    res.json({
      success: true,
      universities,
      subjects,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// controllers/groupController.js

const GetGroupCountsByUniversity = async (req, res) => {
  try {
    const data = await GroupChat.aggregate([
      {
        $group: {
          _id: "$university",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          university: "$_id",
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


const FixExistingCapitalization = async (req, res) => {
  try {
    const capitalizeWords = (str) => {
      if (!str) return str;
      return str
        .toLowerCase()
        .split(" ")
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    };

    const groups = await GroupChat.find();

    const bulkOps = groups.map(group => ({
      updateOne: {
        filter: { _id: group._id },
        update: {
          $set: {
            city: capitalizeWords(group.city),
            university: capitalizeWords(group.university),
            subject: capitalizeWords(group.subject),
          },
        },
      },
    }));

    await GroupChat.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "✅ Existing data fixed successfully",
      total: groups.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fixing data" });
  }
};

const RemoveTextTags = async (req, res) => {
  try {
    // 🔥 sirf [text=...] remove karega
    const cleanText = (str) => {
      if (!str) return str;
      return str.replace(/\[text=.*?\]/gi, "").trim();
    };

    const groups = await GroupChat.find();

    const bulkOps = groups.map(group => ({
      updateOne: {
        filter: { _id: group._id },
        update: {
          $set: {
            groupTypeDescription: cleanText(group.groupTypeDescription),
            displayLineThird: cleanText(group.displayLineThird),
          },
        },
      },
    }));

    await GroupChat.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "✅ Text tags removed successfully",
      total: groups.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error removing text tags" });
  }
};


module.exports = {
  uploadGroupsFile,
  getGroups,
  GetGroupCountsByUniversity,
  GetFilters,
  FixExistingCapitalization,
  RemoveTextTags
};