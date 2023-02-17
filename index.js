const openai = require('openai');
const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

// import dotenv from 'dotenv';


// f-mastiff-9776.twil.io/demo-reply
require("dotenv").config();
// Set up OpenAI API credentials
openai.apiKey = process.env.OPENAI_API_KEY;

// Set up Twilio API credentials
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Function to generate responses using OpenAI's GPT-3
async function generateResponse(prompt) {
  const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
    prompt: prompt,
    max_tokens: 50,
    n: 2,
    stop: null,
    temperature: 0.5,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openai.apiKey}`
    }
  });

  return response.data.choices[0].text;
}

// Function to send a message to a user on WhatsApp
async function sendMessage(phoneNumber, message) {
  const response = await client.messages.create({
    body: message,
    from: 'whatsapp:' + TWILIO_PHONE_NUMBER,
    to: 'whatsapp:' + phoneNumber
  });

  return response;
}

// Function to handle incoming messages from users
// async function onMessageReceived(req, res) {
//   const message = req.body.Body;
// //   const phoneNumber = req.body.From;
// const phoneNumber = req.body.From.substring(9);
//   console.log("The number is: " + phoneNumber);
//   const response = await generateResponse(message);
//   await sendMessage(phoneNumber, response);
//   res.send();
// }


async function onMessageReceived(req, res) {
    const message = req.body.Body;
    const phoneNumber = req.body.From.substring(9);
    console.log("The number is: " + phoneNumber);
    let response;
  
    // check if the message is a greeting or a question
    if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
      response = "Hello, how can I assist you today?";
    } else {
      // generate a response from OpenAI
      response = await generateResponse(message);
  
      // if the response is empty or undefined, send a default message
      if (!response) {
        response = "I'm sorry, I didn't understand your question. Can you please rephrase it?";
      }
    }
  
    // send the response to the user
    await sendMessage(phoneNumber, response);
  
    res.send();
  }
  
  
  
  
app.post('/incoming', onMessageReceived);

app.listen(8080, function() {
  console.log('Twilio server listening on port 8080');
});
