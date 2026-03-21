// // src/controllers/groupController.js

// const GroupChat = require("../models/GroupChat");
// const fs = require("fs");
// const path = require("path");
// const csv = require("csv-parser");
// const XLSX = require("xlsx");
// const slugify = require("slugify");
// const mongoose = require("mongoose");

// // 🔥 MAIN FUNCTION
// const uploadGroupsFile = async (req, res) => {
//   let filePath;

//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "File required" });
//     }

//     filePath = path.resolve(req.file.path);
//     const ext = path.extname(req.file.originalname).toLowerCase();

//     let results = [];

//     // ================= CSV =================
//     if (ext === ".csv") {
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csv())
//           .on("data", (row) => {
//             const formatted = formatRow(row);
//             if (formatted) results.push(formatted);
//           })
//           .on("end", resolve)
//           .on("error", reject);
//       });
//     }

//     // ================= XLSX =================
//     else if (ext === ".xlsx" || ext === ".xls") {
//       const workbook = XLSX.readFile(filePath);
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const data = XLSX.utils.sheet_to_json(sheet);

//       results = data.map(formatRow).filter(Boolean);
//     } else {
//       return res.status(400).json({
//         message: "Only CSV or XLSX allowed",
//       });
//     }

//     if (!results.length) {
//       return res.status(400).json({
//         message: "No valid rows found",
//       });
//     }

//     // ================= BULK INSERT =================
//     const BATCH_SIZE = 1000;
//     let inserted = 0;

//     for (let i = 0; i < results.length; i += BATCH_SIZE) {
//       const batch = results.slice(i, i + BATCH_SIZE);

//       try {
//         const resInsert = await GroupChat.insertMany(batch, {
//           ordered: false, // skip duplicates
//         });

//         inserted += resInsert.length;
//       } catch (err) {
//         if (err.writeErrors) {
//           inserted += err.result?.nInserted || 0;
//         } else {
//           throw err;
//         }
//       }
//     }

//     res.status(200).json({
//       success: true,
//       totalRows: results.length,
//       inserted,
//       skipped: results.length - inserted,
//     });

//   } catch (error) {
//     console.error("UPLOAD ERROR:", error);
//     res.status(500).json({
//       error: error.message,
//     });
//   } finally {
//     // 🔥 ALWAYS DELETE FILE
//     if (filePath && fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   }
// };



// // 🔥 FORMAT FUNCTION (UPGRADED)


// const formatRow = (row) => {
//   const name = row.Title?.toString().trim();
//   const city = row.Cities?.toString().toLowerCase().trim();
//   const university = row.Universities?.toString().trim();
//   const subject = row.Subjects?.toString().trim();

//   if (!name || !city || !university) return null;

//   const baseSlug = slugify(name, { lower: true, strict: true });

//   return {
//     name,
//     city,
//     university,
//     subject: subject || "General",
//     slug: `${baseSlug}-${new mongoose.Types.ObjectId().toString().slice(-6)}`, // 🔥 FIX
//   };
// };



// src/controllers/groupController.js

const GroupChat = require("../models/GroupChat");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const slugify = require("slugify");
const mongoose = require("mongoose");

// 🔥 MAIN FUNCTION (UPSERT VERSION)
const uploadGroupsFile = async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    filePath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();

    let results = [];

    // ================= CSV =================
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
    }

    // ================= XLSX =================
    else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      results = data.map(formatRow).filter(Boolean);
    } else {
      return res.status(400).json({
        message: "Only CSV or XLSX allowed",
      });
    }

    if (!results.length) {
      return res.status(400).json({
        message: "No valid rows found",
      });
    }

    // ================= BULK UPSERT =================
    const BATCH_SIZE = 1000;
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);

      const bulkOps = batch.map((item) => ({
        updateOne: {
          filter: {
            name: item.name,
            city: item.city,
            university: item.university,
          },
          update: {
            $set: {
              subject: item.subject,
              slug: item.slug,
            },
          },
          upsert: true,
        },
      }));

      const resBulk = await GroupChat.bulkWrite(bulkOps);

      inserted += resBulk.upsertedCount;
      updated += resBulk.modifiedCount;
    }

    res.status(200).json({
      success: true,
      totalRows: results.length,
      inserted,
      updated,
      skipped: results.length - inserted - updated,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({
      error: error.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};


// 🔥 FORMAT FUNCTION (YOUR SHEET MAPPING)
const formatRow = (row) => {
  const name = row.Title?.toString().trim();
  const city = row.Cities?.toString().toLowerCase().trim();
  const university = row.Universities?.toString().trim();
  const subject = row.Subjects?.toString().trim();

  if (!name || !city || !university) return null;

  const baseSlug = slugify(name, { lower: true, strict: true });

  return {
    name,
    city,
    university,
    subject: subject || "General",
    slug:
      baseSlug +
      "-" +
      new mongoose.Types.ObjectId().toString().slice(-6), // unique slug
  };
};

// ✅ GET ALL GROUPS
const getGroups = async (req, res) => {
  try {
    let {
      city,
      university,
      subject,
      search,
      sort = "latest",
      page = 1,
      limit = 10,
    } = req.query;

    page = Math.max(1, Number(page));
    limit = Math.min(50, Number(limit));

    let filter = {};

    if (city) filter.city = city.toLowerCase().trim();
    if (university) filter.university = university.trim();
    if (subject) filter.subject = subject.trim();

    if (search) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { tags: { $regex: search.trim(), $options: "i" } },
      ];
    }

    let query = GroupChat.find(filter).lean();

    switch (sort) {
      case "members":
        query = query.sort({ memberCount: -1 });
        break;
      case "az":
        query = query.sort({ name: 1 });
        break;
      default:
        query = query.sort({ createdAt: -1 });
    }

    const skip = (page - 1) * limit;

    const [groups, total] = await Promise.all([
      query.skip(skip).limit(limit),
      GroupChat.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: groups,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};



// ✅ GET BY SLUG
const getGroupBySlug = async (req, res) => {
  try {
    const group = await GroupChat.findOne({ slug: req.params.slug });

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json({ success: true, data: group });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ✅ CREATE SINGLE GROUP
const createGroup = async (req, res) => {
  try {
    const { name, city, university, subject } = req.body;

    if (!name || !city || !university || !subject) {
      return res.status(400).json({
        message: "All fields required",
      });
    }

    const newGroup = new GroupChat({
      ...req.body,
      city: city.toLowerCase(),
      slug:
        slugify(name, { lower: true, strict: true }) +
        "-" +
        Math.floor(Math.random() * 10000),
    });

    const saved = await newGroup.save();

    res.status(201).json({
      success: true,
      data: saved,
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



module.exports = {
  getGroups,
  getGroupBySlug,
  createGroup,
  uploadGroupsFile,
};