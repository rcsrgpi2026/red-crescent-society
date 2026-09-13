import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Test sendDonorRegistrationEmail and sendExistingBloodRequestAlertToNewDonor directly
import {
  sendDonorRegistrationEmail,
  sendExistingBloodRequestAlertToNewDonor,
} from "../lib/email/mailer";

async function run() {
  console.log("Calling sendDonorRegistrationEmail...");
  try {
    await sendDonorRegistrationEmail({
      name: "Mehedi",
      email: "iamehedihsn@gmail.com",
      phone: "01717171717",
      bloodGroup: "B+",
      area: "Upor vodra, Rajshahi",
      passcode: "1234",
      phonePublic: false,
      existingRequests: [
        {
          id: "924143fe-ad9e-455b-acb7-fb4bf2b33d01",
          patientName: "Pius",
          bloodGroup: "B+",
          units: 1,
          hospital: "Ibna Sinha Diagnostic Center",
          location: "7th floor, 735 room",
          requiredDate: "2026-08-17",
          emergencyLevel: "URGENT",
          contact: "01885187500",
          requesterName: "Minhajul",
          additionalInfo: null,
        },
      ],
    });
    console.log("sendDonorRegistrationEmail finished.");
  } catch (err) {
    console.error("sendDonorRegistrationEmail error:", err);
  }

  console.log("Calling sendExistingBloodRequestAlertToNewDonor...");
  try {
    await sendExistingBloodRequestAlertToNewDonor({
      donorName: "Mehedi",
      donorEmail: "iamehedihsn@gmail.com",
      donorBloodGroup: "B+",
      request: {
        id: "924143fe-ad9e-455b-acb7-fb4bf2b33d01",
        patientName: "Pius",
        bloodGroup: "B+",
        units: 1,
        hospital: "Ibna Sinha Diagnostic Center",
        location: "7th floor, 735 room",
        requiredDate: "2026-08-17",
        emergencyLevel: "URGENT",
        contact: "01885187500",
        requesterName: "Minhajul",
        additionalInfo: null,
      },
    });
    console.log("sendExistingBloodRequestAlertToNewDonor finished.");
  } catch (err) {
    console.error("sendExistingBloodRequestAlertToNewDonor error:", err);
  }
}

run();
