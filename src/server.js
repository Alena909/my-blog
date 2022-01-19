import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

//Db install and insert data

// const mongo = require("mongodb");
// const MongoClient = require("mongodb").MongoClient;
// const url = "mongodb://localhost:27017/mydb";

// MongoClient.connect(url, function (err, db) {
//   if (err) throw err;
//   const dbo = db.db("my-blog");
//   const articlesInfo = [
//     {
//       name: "learn-react",
//       upvotes: 0,
//       comments: [],
//     },

//     {
//       name: "learn-node",
//       upvotes: 0,
//       comments: [],
//     },

//     {
//       name: "my-thoughts-on-resumes",
//       upvotes: 0,
//       comments: [],
//     },
//   ];

//   dbo.createCollection("articles", function (err, res) {
//     if (err) throw err;
//     console.log("Database created!");
//     db.close();
//   });

//   dbo.collection("articles").insertMany(articlesInfo, function (err, res) {
//     if (err) throw err;
//     console.log("Number of documents inserted " + res.insertedCount);
//     db.close();
//   });
// });

const app = express();

app.use(express.static(path.join(__dirname, "/build")));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-blog");

    await operations(db);
    client.close();
  } catch (err) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

app.get("/api/articles/:name", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post("/api/articles/:name/upvote", async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    console.log(articleInfo);
    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: {
          upvotes: articleInfo.upvotes + 1,
        },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post("/api/articles/:name/add-comment", async (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;
  withDB(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });
    await db
      .collection("articles")
      .updateOne(
        { name: articleName },
        { $set: { comments: articleInfo.comments.concat({ username, text }) } }
      );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

// app.post("/api/articles/:name/upvote", (req, res) => {
//   const articleName = req.params.name;
//   articlesInfo[articleName].upvotes += 1;
//   res
//     .status(200)
//     .send(
//       `${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`
//     );
// });

// app.get("/hello", (req, res) => {
//   res.send("Hello");
// });
// app.get("/hello/:name", (req, res) => {
//   res.send(`Hello ${req.params.name}`);
// });

// app.post("/hello", (req, res) => {
//   res.send(`Hello ${req.body.name}`);
// });

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));
