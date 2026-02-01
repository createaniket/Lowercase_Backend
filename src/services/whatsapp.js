const client = require("../config/twilio");

exports.sendWhatsApp = async (submission) => {
  let msg = `📩 New Form Submission\n\n`;

  msg += `Name: ${submission.name}\n`;
  msg += `Phone: ${submission.phone}\n`;
  msg += `Type: ${submission.formType}\n\n`;

  for (let key in submission.data) {
    msg += `${key}: ${submission.data[key]}\n`;
  }

  await client.messages.create({
    from: "whatsapp:+14155238886",
    to: `whatsapp:${process.env.ADMIN_WHATSAPP}`,
    body: msg,
  });
};