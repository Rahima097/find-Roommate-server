const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 3000

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_ROOMUSER}:${process.env.DB_ROOMPASS}@cluster0.j1rskl2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const roommateCollection = client.db('roommateDB').collection('roommates')
    const likesCollection = client.db('roommateDB').collection('likes');

    // for all roommate listing get based id
    app.get('/roommates', async (req, res) => {
      const result = await roommateCollection.find().toArray();
      res.send(result);
    })

    // available based get feature roommate for homepage
    app.get('/roommates/available', async (req, res) => {
      const limit = parseInt(req.query.limit) || 6;
      const result = await roommateCollection
        .find({ availability: "available" })
        .limit(limit)
        .toArray();
      res.send(result);
    });

    // get method for mylistings page based email
    app.get('/roommates/mylistings', async (req, res) => {
      const email = req.query.email;
      const result = await roommateCollection
        .find({ email: email })
        .toArray();
      res.send(result);
    });


    // for roommate details page get based id
    app.get('/roommates/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roommateCollection.findOne(query);
      res.send(result);
    });

    // for add to find roommate page post data
    app.post('/roommates', async (req, res) => {
      const newRoommate = req.body;
      console.log(newRoommate);
      const result = await roommateCollection.insertOne(newRoommate);
      res.send(result);
    });

    // delete method added for my listing delete button
    app.delete('/roommates/:id', async (req, res) => {
      const id = req.params.id;
      const result = await roommateCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // update put method added for my listing update button"
    app.put('/roommates/:id', async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const result = await roommateCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    // added patch method for handle like for details page
    app.patch('/roommates/:id/like', async (req, res) => {
      const { id } = req.params;
      const { likes } = req.body;
      const result = await roommateCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { likes } }
      );
      res.send(result);

    });

     // new patch route to handle like logic with tracking user email
    app.patch('/roommates/:id/like-tracked', async (req, res) => {
      const { id } = req.params;
      const { userEmail } = req.body;

      // check if user already liked this roommate
      const existingLike = await likesCollection.findOne({ listingId: id, userEmail });

      if (existingLike) {
        return res.status(200).send({ liked: true, message: "Already liked" });
      }

      // add to likes collection
      await likesCollection.insertOne({ listingId: id, userEmail });

      // increment like count in roommates collection
      const result = await roommateCollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { likes: 1 } }
      );

      res.send({ liked: true, result });
    });

    app.get('/roommates/:id/liked/:userEmail', async (req, res) => {
      const { id, userEmail } = req.params;
      const like = await likesCollection.findOne({ listingId: id, userEmail });
      res.send({ liked: !!like });
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('find roommate server running...')
});

app.listen(port, () => {
  console.log(`find roommate server running on port ${port}`)
});