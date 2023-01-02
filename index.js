const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.yce8pf3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

// const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.3exxtfz.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
    try {
        const products = client.db('rentUsBd').collection('productCollection');
        const usersCollection = client.db('rentUsBd').collection('users');

        // get data from server:
        app.get('/productCollection', async (req, res) => {
            const query = {}
            const sortProduct = products.find(query).sort({ _id: -1 });;
            const result = await sortProduct.toArray();
            res.send(result);
        });


        app.post('/productCollection', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await products.insertOne(user);
            res.send(result);
        });

        // User Information Post in Database :
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // Get Users From Database:
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });


        // Get Who is Admin : 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });


        // Get Who is Seller : 
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        });




        app.get('/dashboard/allsellers', async (req, res) => {
            const role = req.query.role;
            console.log(req.query.role);
            const users = await usersCollection.find({}).toArray()
            const result = users.filter(product => product.role === role)
            console.log("jsx".result);
            res.send(result)

        })

        app.get('/dashboard/allbuyers', async (req, res) => {
            const role = req.query.role;
            console.log(req.query.role);
            const users = await usersCollection.find({}).toArray()
            const result = users.filter(product => product.role === role)
            console.log("jsx".result);
            res.send(result)

        });


        // Delete Users :
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            console.log(result)
            res.send(result)
        });

    }
    finally {

    }
}
run().catch(console.log);



app.get('/', async (req, res) => {
    res.send('Home Rent server is running');
})

app.listen(port, () => console.log(`Home Rent running on ${port}`))