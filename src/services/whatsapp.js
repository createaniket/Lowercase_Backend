const client = require("../config/twilio");

exports.sendWhatsApp = async (submission) => {

  try {

    const message = await client.messages.create({

      from: "whatsapp:+447360495222",
      to: `whatsapp:${process.env.ADMIN_WHATSAPP}`,

      // ✅ Your approved template SID
      contentSid: process.env.CONTENTTWILIOID, // <-- replace with real SID

      // ✅ Map variables
      contentVariables: JSON.stringify({

        formId: submission._id,
        userName: submission.name,
        userPhoneNumber: submission.phone,
        userEmail: submission.email,
        formType: submission.formType,

        messageData:
          typeof submission.data === "string"
            ? submission.data
            : JSON.stringify(submission.data)

      })

    });

    console.log("WhatsApp Status:", message.status);

  } catch (error) {
    console.error("WhatsApp Error:", error);
  }
};
