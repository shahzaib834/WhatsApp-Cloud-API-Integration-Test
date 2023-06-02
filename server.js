require('dotenv').config();
const express = require('express');
const axios = require('axios');
const util = require('util');

const app = express();

// Define your predefined templates
const templates = {
  greeting: {
    templateName: 'greeting',
    templateBody: 'Welcome to our chatbot! How can I assist you today?',
  },
  orderStatus: {
    templateName: 'order_status',
    templateBody: 'Your order status is: {{orderStatus}}',
  },
  shippingDetails: {
    templateName: 'shipping_details',
    templateBody:
      'Your shipping details are as follows:\nAddress: {{address}}\nCity: {{city}}\nCountry: {{country}}',
  },
  developer: {
    templateName: 'developer',
    templateBody: 'I am owned by SHAHZAIB',
  },
};

// Handle incoming WhatsApp messages
app.use(express.json());

app.get('/', (req, res) => {
  res.send('app is running');
});

app.get('/webhook', (req, res) => {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == 'shahzaib'
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/webhook', (req, res) => {
  console.log('Call from WhatsApp ClOUD API');
  // req.body.entry[0].changes[0].value.contacts[0].profile.name - sender name
  // req.body.entry[0].changes[0].value.contacts[0].wa_id - sender number
  // req.body.entry[0].changes[0].value.messages[0].from - sender number same as above
  // req.body.entry[0].changes[0].value.messages[0].id - message id
  // req.body.entry[0].changes[0].value.messages[0].text.body - message text

  if (req.body.entry.length) {
    const baseVariable = req.body.entry[0].changes[0].value.messages[0];
    //const senderName = baseVariable.profile.name;
    const from = baseVariable.from;
    const body = baseVariable.text.body;
    let response;

    if (body.toLowerCase().includes('order status')) {
      response = fillTemplate(templates.orderStatus.templateBody, {
        orderStatus: 'In progress',
      });
    } else if (body.toLowerCase().includes('shipping details')) {
      response = fillTemplate(templates.shippingDetails.templateBody, {
        address: '123 Main St',
        city: 'Exampleville',
        country: 'Exampleland',
      });
    } else if (body.toLowerCase().includes('made you')) {
      response = templates.developer.templateBody;
    } else {
      response = templates.greeting.templateBody;
    }

    sendWhatsAppMessage(from, response)
      .then(() => {
        res.status(200).send();
      })
      .catch((error) => {
        console.error('Failed to send WhatsApp message:', error);
        res.status(500).send();
      });
  } else {
    res.status(400).send();
  }
});

// Utility function to fill template variables
function fillTemplate(template, variables) {
  let response = template;
  Object.keys(variables).forEach((key) => {
    response = response.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
  });
  return response;
}

// Function to send WhatsApp message
function sendWhatsAppMessage(recipient, message) {
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: false,
      body: message,
    },
  };

  return axios.post(`${process.env.WHATSAPP_API_BASE_URL}/messages`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    },
  });
}

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server is running on ${process.env.PORT}`);
});

// Response Example from Whatsapp API CLOUD when message is recieve to our number
// body: {
//     "object":"whatsapp_business_account",
//     "entry":[{
//       "id":"115505198226936",
//       "changes":[{
//         "value":{
//           "messaging_product":"whatsapp",
//           "metadata":{
//             "display_phone_number":"15550176924",
//             "phone_number_id":"105572659227276"
//           },
//           "contacts":[{"
//             profile":{"name":"Shahzaib"},
//             "wa_id":"923035207015"}],
//             "messages":[{
//               "from":"923035207015",
//               "id":"wamid.HBgMOTIzMDM1MjA3MDE1FQIAEhggNzU3QzM2NTMwMzAzQUIxNzU3RUJGMDY5QkU2NDM0REMA",
//               "timestamp":"1685648527",
//               "text":{"body":"Test"},
//               "type":"text"}]},"field":"messages"

//       }
//           ]

//     }
//               ]}
