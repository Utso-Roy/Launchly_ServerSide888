require("dotenv").config();

const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const stripe = require('stripe')(process.env.STRIPE_KEY);

const jwt = require("jsonwebtoken");
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

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden access" });

    req.user = decoded; 
    next();
  });
};


async function run() {
  try {
    await client.connect();
    const db = client.db("products");
    const userCollection = db.collection("users")
    const featured_Products = db.collection("featured_Products");
    const productsCollection = db.collection("productsCollection");
    const reviewsCollection = db.collection("reviewsCollection");
    const reportedProductsCollection = db.collection(
      "reportedProductsCollection"
    );
    // const myProfileCollection = db.collection('myProfileCollection')

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Payment Intent Error:", error);
    res.status(500).send({ error: error.message });
  }
});

    

app.post("/user", async (req, res) => {
  const user = req.body;
  user.role = "user";
  user.createdAt = Date.now();
  user.lastLogin = Date.now();

  const query = { email: user.email };
  console.log("Email", query)

  const alreadyExist = await userCollection.findOne(query);
  if (!!alreadyExist) {
    const result1 = await userCollection.updateOne(query, {
      $set: { lastLogin: Date.now() },
    });
    return res.send({ success: true, updated: true, result1 });
  }

  const result = await userCollection.insertOne(user);
  res.send({ success: true, created: true, data: result });
});
    //get manage user data 
    
    app.get('/mangeUser', async (req, res) => {
    
      const result = await userCollection.find({}).toArray()

      if (!result)
      {
        res.status(404).send({error:"user not found"})
      }
      res.send(result)

  })
      
    
    
    // PATCH make admin
app.patch('/users/admin/:id', async (req, res) => {
  const id = req.params.id;
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { role: "admin" } }
  );
  res.send(result);
});

// PATCH make moderator
app.patch('/users/moderator/:id', async (req, res) => {
  const id = req.params.id;
  const result = await userCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { role: "moderator" } }
  );
  res.send(result);
});



  
    
app.get("/users/:email", async (req, res) => {
  const email = req.params.email;
  const user = await userCollection.findOne({ email });
  res.send(user);
});



    
    
    

    // PUT or PATCH route to change status
app.patch('/products/:id/status', async (req, res) => {
  const productId = req.params.id;
  const { status } = req.body; 

  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { status: status } }
    );

    res.send(result);
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).send({ error: "Failed to update product status" });
  }
});

    




    
    
    
    // PATCH route to upvote a product

 app.patch("/upvote/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const { userId } = req.body;

        const query = { _id: new ObjectId(productId) };

        const product = await productsCollection.findOne(query);

        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        if (product.upvotedUsers?.includes(userId)) {
          return res.status(400).json({ message: "Already voted" });
        }

        const result = await productsCollection.updateOne(query, {
          $inc: {
            upvotes : 1,
          },
          $push: { upvotedUsers: userId },
        });

        res.send({ success: true, updated: result.modifiedCount > 0 });
      } catch (err) {
        console.error("Upvote error:", err);
        res.status(500).json({ message: "Upvote failed" });
      }
    });

    
    
    // get all isFeaturedProducts - true
    
  app.get("/featured", async (req, res) => {
  try {
    const featuredProducts = await productsCollection.find({ 
isFeatured : true }).sort({ createdAt: -1 }).limit(4).toArray();
    res.json(featuredProducts);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
    

    
    
    // GET Single Product by ID
    
app.get("/product/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = { _id: new ObjectId(id) };
    const product = await productsCollection.findOne(query);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

    
    
    // PATCH route to mark a product as featured


app.patch('/products/:id/feature', async (req, res) => {
  const productId = req.params.id;

  try {
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: { isFeatured: true } }
    );

    res.send(result);
  } catch (err) {
    console.error("Feature update error:", err);
    res.status(500).send({ error: "Failed to mark product as featured" });
  }
});



    // All Products Route
    // app.get("/all_products", async (req, res) => {
    //   try {
    //     const result = await featured_Products.find().toArray();
    //     res.send(result);
    //   } catch (err) {
    //     console.error("Error fetching all_products:", err);
    //     res.status(500).send({ message: "Failed to fetch all products" });
    //   }
    // });





//pagination 

app.get("/all_products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const result = await featured_Products
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await featured_Products.estimatedDocumentCount();

    res.send({
      success: true,
      total,
      page,
      limit,
      products: result,
    });
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

    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "7d" });
     

      res.send({ token });
    });

    // add-products data

    app.post("/add_products_data", async (req, res) => {
      try {
        const product = req.body;

        product.status = "pending";
        product.upvotes = 0;
        product.isFeatured = false;
       product.upvotedUsers = ["uid1", "uid2"]

        const result = await productsCollection.insertOne(product);
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ error: "Failed to insert product" });
      }
    });
    // get products

  app.get("/add_products_data/:email", verifyJWT, async (req, res) => {
  const decodedEmail = req.user.email;
    const paramEmail = req.params.email;

  if (decodedEmail !== paramEmail) {
    return res.status(403).json({ message: "Forbidden - Email mismatch" });
  }
  try {
    const userProducts = await productsCollection
      .find({ "data.ownerEmail": paramEmail }) 
      .toArray();
    res.send(userProducts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch data" });
  }
});



    
    
    

    // DELETE a product by ID

    app.delete("/add_products_data/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await productsCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).send({ error: "Failed to delete product" });
      }
    });

    //update products data

    app.put("/add_products_data/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;

      try {
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              "data.name": updatedProduct.data.name,
              "data.image": updatedProduct.data.image,
              status: updatedProduct.status,
            },
          }
        );

        res.send(result);
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send({ error: "Failed to update product." });
      }
    });

    // reviews data

    app.post("/reviews", async (req, res) => {
      try {
        const review = req.body;
        console.log(review);
        const result = await reviewsCollection.insertOne(review);
        res.send(result);
      } catch (err) {
        console.log("Error inserting review", err);
        res.status(500).send({ error: "Failed to insert review" });
      }
    });



// reviews fetch by productId


app.get('/reviews/product', async (req, res) => {
  try {
  
    const reviews = await reviewsCollection.find().toArray();

    res.send(reviews);
  } catch (err) {
    console.error("Error fetching reviews by name:", err);
    res.status(500).send({ error: "Failed to fetch reviews" });
  }
});


    //reported products

    app.post("/reported", async (req, res) => {
      try {
        const review = req.body;
        console.log(review);
        const result = await reportedProductsCollection.insertOne(review);
        res.send(result);
      } catch (err) {
        console.log("Error inserting review", err);
        res.status(500).send({ error: "Failed to insert review" });
      }
    });

    //  delete route
    app.delete("/reported", async (req, res) => {
      try {
        // Step 1: Delete from reportedProductsCollection where isFeatured: true
        const reportedDeleteResult = await reportedProductsCollection.deleteOne(
          { isFeatured: true }
        );

        // Step 2: Delete from featured_Products where isFeatured: true
        const productDeleteResult = await featured_Products.deleteOne({
          isFeatured: true,
        });

        const success =
          reportedDeleteResult.deletedCount > 0 ||
          productDeleteResult.deletedCount > 0;

        if (success) {
          res.json({
            success: true,
            message: "Deleted from one or both collections based on isFeatured",
            reportedDeleted: reportedDeleteResult.deletedCount,
            featuredDeleted: productDeleteResult.deletedCount,
          });
        } else {
          res.status(404).json({
            success: false,
            error:
              "No matching document with isFeatured: true found in either collection",
          });
        }
      } catch (error) {
        console.error("Delete error:", error);
        res
          .status(500)
          .json({ success: false, error: "Internal Server Error" });
      }
    });

    app.get("/reported", async (req, res) => {
      try {
        const getProducts = await reportedProductsCollection.find({}).toArray();
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
