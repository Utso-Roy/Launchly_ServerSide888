require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Client Setup
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
      const productsCollection = db.collection('productsCollection')

    // All Products Route
    app.get("/all_products", async (req, res) => {
      try {
        const result = await featured_Products.find().toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching all_products:", err);
        res.status(500).send({ message: "Failed to fetch all products" });
      }
    });

    // Featured Products Route
    app.get("/featured_products", async (req, res) => {
      try {
        const result = await featured_Products
          .find({ isFeatured: true })
          .sort({ createdAt: -1 })
          .limit(4)
          .toArray();
        res.json(result);
      } catch (err) {
        res.status(500).json({ message: "Failed to fetch featured products" });
      }
    });

    // Trending Products Route
    app.get("/trending_products", async (req, res) => {
      try {
        const trending = await featured_Products
          .find({})
          .sort({ votes: -1 })
          .limit(6)
          .toArray();
        res.send(trending);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch trending products" });
      }
    });
//

// add-products data 
app.post('/add_products_data', async (req, res) => {
  try {
      const product = req.body;

        product.status = "pending";     // default status
    product.upvotes = 0;            // default vote count

      console.log(product)
    const result = await productsCollection.insertOne(product);
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to insert product" });
  }
});
      // get products
      
      
     app.get('/add_products_data', async (req, res) => {
  try {
    const getProducts = await productsCollection.find({}).toArray();
    res.send(getProducts);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).send({ message: "Server Error", error: error.message });
  }
});








      

    // Upvote Route
    app.patch("/featured_products/upvote/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const { userId } = req.body;

        const query = ObjectId.isValid(productId)
          ? { _id: new ObjectId(productId) }
          : { _id: productId };

        const product = await featured_Products.findOne(query);

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        if (product.upvotedUsers?.includes(userId)) {
          return res.status(400).json({ message: "Already voted" });
        }

        const result = await featured_Products.updateOne(query, {
          $inc: { votes: 1 },
          $push: { upvotedUsers: userId },
        });

        res.send({ success: true, updated: result.modifiedCount > 0 });
      } catch (err) {
        console.error("Upvote error:", err);
        res.status(500).json({ message: "Upvote failed" });
      }
    });

    console.log(" Successfully connected to MongoDB!");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}

run().catch((err) => console.error(" MongoDB Run Error:", err));

// Default Route
app.get("/", (req, res) => {
  res.send(" Server is running on port 5000");
});

app.listen(port, () => {
  console.log(` Server listening on port ${port}`);
});
