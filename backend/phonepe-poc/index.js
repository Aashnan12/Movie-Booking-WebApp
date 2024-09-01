// importing modules
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const sha256 = require("sha256");
const uniqid = require("uniqid");

// creating express application
const app = express();

// UAT environment
const MERCHANT_ID = "PGTESTPAYUAT";
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const SALT_INDEX = 1;
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const APP_BE_URL = "http://localhost:4002"; // our application

// setting up middleware
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// Defining a test route
app.get("/", (req, res) => {
  res.send("PhonePe Integration APIs!");
});

// Function to handle retries with exponential backoff
async function axiosRetryRequest(config, retries = 3) {
  let retryCount = 0;
  let response;
  while (retryCount < retries) {
    try {
      response = await axios(config);
      return response;
    } catch (error) {
      if (error.response && error.response.status === 429) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`429 Error: Retrying request... Attempt ${retryCount}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed after ${retries} retries.`);
}

// endpoint to initiate a payment
app.get("/pay", async function (req, res, next) {
  // Initiate a payment

  // Transaction amount
  const amount = +req.query.amount;

  // User ID is the ID of the user present in our application DB
  let userId = "MUID123";

  // Generate a unique merchant transaction ID for each transaction
  let merchantTransactionId = uniqid();

  // redirect url => phonePe will redirect the user to this url once payment is completed. It will be a GET request, since redirectMode is "REDIRECT"
  let normalPayLoad = {
    merchantId: MERCHANT_ID,
    merchantTransactionId: merchantTransactionId,
    merchantUserId: userId,
    amount: amount * 100, // converting to paise
    redirectUrl: `${APP_BE_URL}/payment/validate/${merchantTransactionId}`,
    redirectMode: "REDIRECT",
    mobileNumber: "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };

  // make base64 encoded payload
  let bufferObj = Buffer.from(JSON.stringify(normalPayLoad), "utf8");
  let base64EncodedPayload = bufferObj.toString("base64");

  // X-VERIFY => SHA256(base64EncodedPayload + "/pg/v1/pay" + SALT_KEY) + ### + SALT_INDEX
  let string = base64EncodedPayload + "/pg/v1/pay" + SALT_KEY;
  let sha256_val = sha256(string);
  let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

  const config = {
    method: "post",
    url: `${PHONE_PE_HOST_URL}/pg/v1/pay`,
    headers: {
      "Content-Type": "application/json",
      "X-VERIFY": xVerifyChecksum,
      accept: "application/json",
    },
    data: {
      request: base64EncodedPayload,
    },
  };

  try {
    const response = await axiosRetryRequest(config);
    console.log("response->", JSON.stringify(response.data));
    res.redirect(response.data.data.instrumentResponse.redirectInfo.url);
  } catch (error) {
    console.error("Request failed:", error.message);
    res.status(500).send("Payment request failed. Please try again later.");
  }
});

// endpoint to check the status of payment
app.get("/payment/validate/:merchantTransactionId", async function (req, res) {
  const { merchantTransactionId } = req.params;
  // check the status of the payment using merchantTransactionId
  if (merchantTransactionId) {
    let statusUrl =
      `${PHONE_PE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/` +
      merchantTransactionId;

    // generate X-VERIFY
    let string =
      `/pg/v1/status/${MERCHANT_ID}/` + merchantTransactionId + SALT_KEY;
    let sha256_val = sha256(string);
    let xVerifyChecksum = sha256_val + "###" + SALT_INDEX;

    const config = {
      method: "get",
      url: statusUrl,
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerifyChecksum,
        "X-MERCHANT-ID": merchantTransactionId,
        accept: "application/json",
      },
    };

    try {
      const response = await axiosRetryRequest(config);
      console.log("response->", response.data);
      if (response.data && response.data.code === "PAYMENT_SUCCESS") {
        res.send(response.data);
      } else {
        res.send("Payment failed or is pending. Please try again.");
      }
    } catch (error) {
      console.error("Request failed:", error.message);
      res.status(500).send("Failed to validate payment. Please try again later.");
    }
  } else {
    res.status(400).send("Invalid merchant transaction ID.");
  }
});

// Starting the server
const port = 4002;
app.listen(port, () => {
  console.log(`PhonePe application listening on port ${port}`);
});
