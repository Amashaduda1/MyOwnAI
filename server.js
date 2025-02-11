const express = require("express");
const twilio = require("twilio");

const app = express();
app.use(express.urlencoded({ extended: true }));

// Twilio credentials
const accountSid = "ACc83495347b9a784aaa788615b1d36e47";
const authToken = "7ca90395e21b3aef620dfeba4ebc1fde";
const twilioNumber = "+12524270185";
const userNumber = "+995591033247";

const client = twilio(accountSid, authToken);

// Function to start an outbound call
function makeCall() {
    console.log("[DEBUG] Starting outbound call...");

    client.calls.create({
        url: "https://maybewillwork-dawn-bird-9903.fly.dev/voice-response",
        to: userNumber,
        from: twilioNumber
    }).then(call => console.log(`[DEBUG] Call started: ${call.sid}`))
      .catch(err => console.error(`[ERROR] Failed to start call: ${err.message}`));
}

// Webhook to handle initial call
app.post("/voice-response", (req, res) => {
    console.log("[DEBUG] Received webhook for voice-response:", req.body);

    const twiml = new twilio.twiml.VoiceResponse();
    const gather = twiml.gather({
        input: "speech",
        action: "/process-response",
        timeout: 5
    });

    gather.say("Hello! I’m calling to provide information. What would you like to know?");

    res.type("text/xml").send(twiml.toString());
});

// Webhook to process user speech
app.post("/process-response", (req, res) => {
    console.log("[DEBUG] Received speech response:", req.body);

    const userSpeech = req.body.SpeechResult ? req.body.SpeechResult.toLowerCase() : "";
    const twiml = new twilio.twiml.VoiceResponse();

    // Log processing time
    console.time("[DEBUG] AI Response Time");

    if (userSpeech.includes("price") || userSpeech.includes("cost")) {
        twiml.say("Our service costs ninety-nine dollars per month.");
    } else if (userSpeech.includes("support")) {
        twiml.say("You can contact support at support@example.com.");
    } else if (userSpeech.includes("hours")) {
        twiml.say("We are open from 9 AM to 5 PM, Monday to Friday.");
    } else {
        twiml.say("I'm sorry, I didn't understand that. Can you repeat?");
    }

    console.timeEnd("[DEBUG] AI Response Time");

    // Log full response
    console.log("[DEBUG] Sending response:", twiml.toString());

    // Redirect back for more questions instead of hanging up
    twiml.pause({ length: 2 });
    twiml.redirect("/voice-response");

    res.type("text/xml").send(twiml.toString());
});

// Start the server
app.listen(8080, () => {
    console.log("[DEBUG] Server is running on port 8080");
    makeCall(); // Start the outbound call
});
