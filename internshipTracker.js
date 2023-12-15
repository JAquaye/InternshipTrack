const path = require("path");
const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config({ path: path.resolve(__dirname, 'creds/.env') })

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://${userName}:${password}@cluster0.instoab.mongodb.net/?retryWrites=true&w=majority`;

let portNumber = process.argv[2];

process.stdout.write(`Web server started and running at http://localhost:${portNumber}\n`);

const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);
process.stdin.on("readable", function () {
    let input = process.stdin.read();
    if (input !== null) {
        let command = input.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        } else {
            process.stdout.write(`Invalid command: ${command}\n`);
        }
        process.stdout.write(prompt);
        process.stdin.resume();
    }
})

app.set("views", path.resolve(__dirname, 'ejs_file_templates'));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'ejs_file_templates')));

app.use(bodyParser.urlencoded({extended:false}));

app.get("/", async(request, response) => {
    //TODO: connect to MongoDB Client
    response.render("index");
});

app.get("/newApplication", async(request, response) => {
    response.render("newApplication");
});

app.post("/processApplication", async(request, response) => {
    let {companyName, hourlyWage, location, role, additionalInfo} = request.body;
    let application = {companyName: companyName, hourlyWage: hourlyWage, location: location, role: role , additionalInfo: additionalInfo};
    //TODO: add application to database
    response.render("afterAppSubmit", application);
});

app.get("/reviewApplication", async(request, response) => {
    response.render("reviewApplication");
});

app.post("/processReview", async(request, response) => {
    let companyName = request.body.companyName;
    //TODO: get application from database and render accordingly
    const variables = {
        companyName: "temp",
        hourlyWage: "temp",
        location: "temp",
        role: "temp",
        additionalInfo: "temp"
    };
    response.render("afterReviewApps", variables);
});

app.get("/allApplications", async(request, response) => {
    response.render("allApplications");
});

app.get("/applicationWages", async(request, response) => {
    response.render("applicationWages");
});

app.post("/processWages", async(request, response) => {
    let hourlyWage = request.body.hourlyWage;
    //TODO: get application from database and render accordingly
    response.render("afterReviewApps");
});

app.get("/removeApps", async(request, response) => {
    response.render("removeApps");
});

app.post("/processRemove", async(request, response) => {
    //TODO: remove all application from database
    response.render("afterRemoveAll");
});

async function connectToMongoDB() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    try{
        await client.connect();
        return client;
    } catch (e) {
        console.error("Couldn't connect to MongoDB:", e);
        throw e;
    }
}

app.listen(portNumber);