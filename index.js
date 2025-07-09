require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Client
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("products");
    const featured_Products = db.collection("featured_Products");
    const trending_products = db.collection("trending_products");

    app.get("/featured_products", async (req, res) => {
      try {
        const result = await featured_Products
          .find({})
          .sort({ timestamp: -1 })
          .limit(7)
          .toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch featured products" });
      }
    });

    app.get("/trending_products", async (req, res) => {
      const trending = await featured_Products
        .find({})
        .sort({ votes: -1 })
        .limit(8)
        .toArray();
      res.send(trending);
    });

    app.patch("/featured_products/upvote/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const { userId } = req.body;

        // Check if user already voted
        const product = await featured_Products.findOne({ _id: productId });

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        if (product.upvotedUsers?.includes(userId)) {
          return res.status(400).json({ message: "You already voted" });
        }

        const result = await featured_Products.updateOne(
          { _id: productId },
          {
            $inc: { votes: 1 },
            $push: { upvotedUsers: userId },
          }
        );

        res.send({ success: true, updated: result.modifiedCount > 0 });
      } catch (error) {
        console.error("Upvote error:", error);
        res.status(500).json({ message: "Upvote failed" });
      }
    });

    console.log(" You successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection failed ", error);
  }
}

run();

app.get("/", (req, res) => {
  res.send("Server Running on Port 5000");
});

app.listen(port, () => {
  console.log(` Server listening on port ${port}`);
});
