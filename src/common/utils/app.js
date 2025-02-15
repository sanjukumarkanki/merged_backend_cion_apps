// --- Written By Tejas --- //
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const app = express();
const server = createServer(app);
const path = require("path");
const { upload } = require("./src/common/utils/filesFunctions.js");
const { convertIntoJson } = require("./src/common/utils/excelToJson.js");

// Importing Router
const { coachRouter } = require("./src/common/routes/coach/coach.routes.js");
const {
  webhookPatientRouter,
} = require("./src/app1/routes/patient/webhook.routes.js");
const {
  patientRouter,
} = require("./src/app1/routes/patient/patient.routes.js");
const {
  patientRouter: crmPatientRouter,
} = require("./src/app2/routes/patient/patient.routes.js");
const { pagesRouter } = require("./src/common/routes/pages/pages.routes.js");
const { initSocketServer } = require("./src/common/utils/socketIo.js");

// Enabling Cors
app.use(cors());
app.use(express.json());

// SQL DB
const {
  connectSqlDBAndExecute,
  connectMongoDB,
  createPool,
} = require("./src/common/utils/connectDB.js");
const {
  messageRouter,
} = require("./src/app1/routes/message/message.routes.js");

createPool();

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

connectMongoDB("Mongo Db").catch((err) => {
  console.log(err.message);
});

const bindDb = async (req, res, next) => {
  try {
    let mongoDB = await connectMongoDB("MongoDb Again Connected");
    if (!mongoDB) return res.status(500).json({ msg: "Internal Server Error" });

    req.mongoDB = mongoDB;
    req.connectSqlDBAndExecute = connectSqlDBAndExecute;

    next();
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "Something went wrong", status: 500 });
  }
};

const io = initSocketServer(server);
app.use((req, res, next) => {
  res.io = io;
  console.log("Io included in response");
  next(); // Ensure the request continues through the middleware chain
});

// Defining Router App1

// all the url for frontend
app.use("/", pagesRouter); // app.use("/app1/coach", bindDb, coachRouter); // Mount coachRouter under /app1
app.use("/common/user", bindDb, coachRouter); // Mount coachRouter under /app1
app.use(bindDb, webhookPatientRouter); // Mount patientRouter //
app.use("/app1/patient", bindDb, patientRouter);
app.use("/", messageRouter);

// Defining Router App2
app.use("/app2/patient", bindDb, crmPatientRouter);

// app.use((req, res, next) => {
//   req.sqlDB.release();
//   next()
// });


let token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InBhd2FuIiwicGFzc3dvcmQiOiIxMjM0NSIsImVtYWlsIjoicGF3YW5AZ21haWwuY29tIiwiaWF0IjoxNzE4MTA1NDk1fQ.BZ1XYpFxplx1zQGXfqnFUbSPzFRcUQI5ZXvtN8T10BA";
async function addData(data) {
  console.log(data);
  try {
    console.log("upload step 1");
    const url =
      "https://merged-backend-cion-apps.onrender.com/app2/patient/add-lead";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    };
    const response = await fetch(url, options);
    console.log("upload step 2");
    const resdata = await response.json();
    if (response.ok) {
      console.log("Lead Added From Excel");
      console.log("upload step 1");
      res.send({ msg: "Success" });
    } else {
      console.log(response);
      console.log("upload step 1");
      console.log("Something went wrong in adding lead");
      res.status(400).json({ msg: "Something went wrong" });
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

app.post(
  "/add-data",
  (req, res) => {
    res.send({ msg: "Not able" });
  },
  upload.single("file"),
  async (req, res) => {
    try {
      const result = await convertIntoJson(req?.file?.path);
      console.log(req?.file?.path);
      let leads = result["Sheet1"];
      let row1 = leads[0];
      let keys = Object.values(row1);
      leads = leads?.slice(1)?.map((each) => {
        return {
          phoneNumber: each["B"],
          // [keys[2]]: each['C'],
          callerName: each["D"],
          patientName: each["E"],
          dateOfContact: each["F"],
          leadChannel: each["G"],
          campaign: each["I"],
          leadSource: each["J"],
          coachName: each["K"],
          age: each["L"],
          gender: each["M"],
          typeOfCancer: each["N"],
          location: each["O"],
          email: each["P"],
          relationsToPatient: each["Q"],
          coachNotes: each["R"],
          inboundOutbound: each["S"],
          relevant: each["T"],
          interested: each["U"],
          conv: each["V"],
          preOP: each["W"] || "",
        };
      });

      await addData(leads[0]);
      console.log("Successfully added");
      w;
      res.send({ msg: "Okay", result: leads[0], data: result });
    } catch (err) {
      console.log(err.message, "add lead err");
      res.status(400).send({ msg: err.message, status: 400 });
    }
  }
);

module.exports = server;
// --- Written By Tejas --- //
