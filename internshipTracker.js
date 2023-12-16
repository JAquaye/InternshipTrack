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

async function submit(companyName, hourlyWage, location, role, info) {
    const client = new MongoClient(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverApi: ServerApiVersion.v1 
    });
    try {
        await client.connect();
        let application = 
        {
            companyName: companyName,
            hourlyWage: hourlyWage,
            location: location,
            role: role,
            additionalInfo: info
        };
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(application);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function reviewInternship(companyName) {
    const client = new MongoClient(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverApi: ServerApiVersion.v1 
    });
    try {
        await client.connect();
        let filter = {companyName: companyName};
        let search = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).findOne(filter);
        if(search) {
            return search;
        }
        else {
            let application =
            {
                companyName: "NONE",
                hourlyWage: "NONE",
                location: "NONE",
                role: "NONE",
                additionalInfo: "NONE"
            };
            return application;
        }
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

async function removeAllApplications() {
    const client = new MongoClient(uri, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverApi: ServerApiVersion.v1 
    });
    try {
        await client.connect();
        let erased = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany({});
        return erased.deletedCount;
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

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
    let application = {
        companyName: companyName, 
        hourlyWage: hourlyWage, 
        location: location, 
        role: role , 
        additionalInfo: additionalInfo
    };
    try {
        await submit(application.companyName, application.hourlyWage, application.location, application.role, application.additionalInfo);
    } catch(e) {
        console.log("ERROR: " + e);
    }
    response.render("afterAppSubmit", application);
});

app.get("/reviewApplication", async(request, response) => {
    response.render("reviewApplication");
});

app.post("/processReview", async(request, response) => {
    let variables;
    //TODO: get application from database and render accordingly
    try {
        let search = await reviewInternship(request.body.companyName);
        variables = {
            companyName: search.companyName,
            hourlyWage: search.hourlyWage,
            location: search.location,
            role: search.role,
            additionalInfo: search.additionalInfo
        };
    } catch (e) {
        console.log("ERROR: " + e);
    }
    response.render("afterReviewApps", variables);
});

app.get("/allApplications", async(request, response) => {
    response.render("allApplications");
});

app.get("/applicationWages", async(request, response) => {
    response.render("applicationWages");
});

app.post("/processWages", async(request, response) => {
    let variables;
    //TODO: get application from database and render accordingly
    try {
        let search = await reviewInternship(request.body.hourlyWage);
        variables = {
            companyName: search.companyName,
            hourlyWage: search.hourlyWage,
            location: search.location,
            role: search.role,
            additionalInfo: search.additionalInfo
        };
    } catch (e) {
        console.log("ERROR: " + e);
    }
    response.render("afterReviewApps", variables);
});

app.get("/removeApps", async(request, response) => {
    response.render("removeApps");
});

app.post("/processRemove", async(request, response) => {
    //TODO: remove all application from database
    let removed;
    try {
        let count = await removeAllApplications();
        removed = count;
    } catch (e){
        console.log("ERROR: " + e);
    }
    response.render("afterRemoveAll", removed);
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