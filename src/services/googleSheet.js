const sheets = require("../config/google");

exports.sendToGoogleSheet = async (submission) => {
  const values = [
    [
      new Date().toISOString(),
      submission.name,
      submission.phone,
      submission.formType,
      ...Object.values(submission.data),
    ],
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GS_SHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
};
