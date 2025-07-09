require('dotenv').config(); 
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

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

// Connect to MongoDB
async function run() {
  try {
      await client.connect();
      


      console.log(" You successfully connected to MongoDB!");
      

  } catch (error) {
    console.error(" MongoDB connection failed:", error);
  }
}
run();




app.get('/', (req, res) => {
  res.send('Server Running Port 3000');
});

app.listen(port, () => {
  console.log(` Server listening on port ${port}`);
});
