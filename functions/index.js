const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();

// ─── Twilio + SendGrid setup ───────────────────────────────────────────────
const getTwilioClient = () => twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// ─── Send opt-in request to emergency contact ─────────────────────────────
// Called when user first enables emergency contact notifications
exports.sendOptInRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const { contactPhone, contactEmail, contactName, userName } = data;

  const smsBody =
    `${userName} added you as an emergency contact on AlergiAI. ` +
    `Reply ACCEPT to receive allergy alerts for them. ` +
    `Reply STOP at any time to unsubscribe.`;

  const results = await Promise.allSettled([
    // SMS opt-in
    contactPhone
      ? getTwilioClient().messages.create({
          body: smsBody,
          from: process.env.TWILIO_PHONE,
          to: contactPhone,
        })
      : Promise.resolve(),

    // Email opt-in
    contactEmail
      ? (() => {
          sgMail.setApiKey(process.env.SENDGRID_KEY);
          return sgMail.send({
            to: contactEmail,
            from: process.env.SENDGRID_SENDER,
            subject: 'AlergiAI Emergency Contact Request',
            text: smsBody,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;">
                <h2 style="color:#2e7d32;">AlergiAI Emergency Contact Request</h2>
                <p>${smsBody}</p>
                <p style="color:#888;font-size:12px;">
                  You received this because ${userName} listed you as their emergency contact.
                </p>
              </div>
            `,
          });
        })()
      : Promise.resolve(),
  ]);

  // Store pending opt-in status in Firestore
  await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .set({ emergencyContactOptInStatus: 'pending' }, { merge: true });

  return { success: true };
});

// ─── Handle incoming SMS replies (Twilio webhook) ─────────────────────────
// Set this URL as your Twilio number's incoming SMS webhook
exports.handleSmsReply = functions.https.onRequest(async (req, res) => {
  const from = req.body.From;   // emergency contact's phone number
  const body = (req.body.Body || '').trim().toUpperCase();

  if (!from) {
    res.status(400).send('Missing From number');
    return;
  }

  // Find the user whose emergency contact has this phone number
  const usersSnapshot = await admin.firestore().collection('users').get();
  let matchedUserId = null;

  for (const userDoc of usersSnapshot.docs) {
    const data = userDoc.data();
    const contactPhone = data.emergencyContact?.phone?.replace(/\D/g, '');
    const incomingPhone = from.replace(/\D/g, '');

    if (contactPhone && incomingPhone.endsWith(contactPhone) || contactPhone && contactPhone.endsWith(incomingPhone.slice(-10))) {
      matchedUserId = userDoc.id;
      break;
    }
  }

  if (matchedUserId) {
    if (body === 'ACCEPT') {
      await admin.firestore()
        .collection('users')
        .doc(matchedUserId)
        .set({ emergencyContactOptInStatus: 'accepted' }, { merge: true });
    } else if (body === 'STOP') {
      await admin.firestore()
        .collection('users')
        .doc(matchedUserId)
        .set({ emergencyContactOptInStatus: 'stopped' }, { merge: true });
    }
  }

  // Twilio expects an XML response
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');
});

// ─── Send emergency alert ─────────────────────────────────────────────────
// Called when a high-severity allergen or severe symptom is logged
exports.sendEmergencyAlert = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  }

  const { contactPhone, contactEmail, contactName, reason, userName, isSymptom } = data;

  // Check opt-in status before sending
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  const optInStatus = userDoc.data()?.emergencyContactOptInStatus;
  if (optInStatus !== 'accepted') {
    return { success: false, reason: 'Emergency contact has not opted in yet.' };
  }

  const subject  = isSymptom ? '🚨 Symptom Alert - AlergiAI' : '🚨 Allergen Alert - AlergiAI';
  const message  = isSymptom
    ? `SYMPTOM ALERT: ${userName} has logged a severe symptom (${reason}). Please check in on them.`
    : `ALLERGEN ALERT: ${userName} has logged a high-severity allergen (${reason}). Please check in on them.`;

  await Promise.allSettled([
    contactPhone
      ? getTwilioClient().messages.create({
          body: message,
          from: process.env.TWILIO_PHONE,
          to: contactPhone,
        })
      : Promise.resolve(),

    contactEmail
      ? (() => {
          sgMail.setApiKey(process.env.SENDGRID_KEY);
          return sgMail.send({
            to: contactEmail,
            from: process.env.SENDGRID_SENDER,
            subject,
            text: message,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:auto;">
                <h2 style="color:#c62828;">${subject}</h2>
                <p style="font-size:16px;">${message}</p>
                <p style="color:#888;font-size:12px;">
                  Sent via AlergiAI. Reply STOP to unsubscribe from alerts.
                </p>
              </div>
            `,
          });
        })()
      : Promise.resolve(),
  ]);

  return { success: true };
});
