const express = require("express");
const app = express();
const cors = require('cors')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const CONFIG = require('./config');

app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(CONFIG.MONGODB_URI, {
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
    // Send a ping to confirm a successful connection
    await client.db("ipangram").command({ ping: 1 });
    console.log("successfully connected to MongoDB!");
  } catch {
    console.error
  };
}
run();

const db = client.db("ipangram");
const userColl = db.collection("users");
const departmentsColl = db.collection("departments")

// get all employee data
app.get('/employees', async (req, res) => {
  try {
    const employeesCursor = await userColl.find({ "usertype": 0 });
    const employees = await employeesCursor.toArray();
    res.status(200).json({status: true,  employees: employees })
} catch (error) {
    res.status(500).json({status: false, message: error.message });
}
})

// get single employee data 
app.get('/employees/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const objectId = new ObjectId(id);
    const employeeCursor = await userColl.find({ "_id": objectId });
    const employee = await employeeCursor.toArray();
    res.status(200).json({status: true,  employee: employee })
} catch (error) {
    res.status(500).json({status: false, message: error.message });
}
})

// get employees according to department
app.get('/departmentdetails/:department', async (req, res) => {
  try {
    const {department} = req.params;
    const employeesCursor = await userColl.find({ department: department });
    const employees = await employeesCursor.toArray();
    res.status(200).json({status: true,  employees: employees })
} catch (error) {
  console.log(error)
    res.status(500).json({status: false, message: error.message });
}
})

//Update employee details
app.put('/employees/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const data = req.body
      const result = await userColl.updateOne(
        { _id: objectId },
        { $set: { username: data.username, userpass:data.userpass, usertype:data.usertype, department: data.department, location:data.location } }
      );
      if (!result) return res.status(404).json({ message: `cannot find any user with ID: ${id}` });
      res.status(200).json({status: true, message: 'User details updated'});
  } catch (error) {
      res.status(500).json({ message: error.message })
  }
})

// delete an employee by their _id
app.delete('/employees/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const deleteResult = await userColl.deleteOne({"_id": objectId})
      if (!deleteResult) return res.status(404).json({ message: `cannot find any user with ID: ${id}` });
      const employeesCursor = await userColl.find({ "usertype": 0 });
      const employees = await employeesCursor.toArray();
      res.status(200).json({status: true, message: 'deleted employee successfully',  employees: employees })
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
})

// user login and authentication
app.post('/login', async (req, res) => {
  try {
    const { username, userpass } = req.body;
    if (username && userpass) {
      const auth = await userColl.findOne({ "username": username, "userpass": userpass });
      if (!auth) return res.status(200).json({ status: false, message: 'User not found, kindly check or register if new.' })
      res.status(200).json({ status: true, message: 'Authentication Successful', user: auth });
      return
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// register a user
app.post('/register', async (req, res) => {
  try {
    const data = req.body;
    if (data) {
      const authRegister = await userColl.findOne({ "username": data?.username , "usertype": data?.usertype });
            if (!authRegister) {
                const user = await userColl.insertOne({ "username": data?.username , "userpass": data?.userpass, "usertype": parseInt(data?.usertype), "department": data?.department, "location": data?.location });
                res.status(200).json({ status: true, message: 'Registered Sucessfully', user: user});
                return
            } else res.status(500).json({ status: false, message: 'User already exists' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// get all department data 
app.get('/departments', async (req, res) => {
  try {
    const departmentsCursor = await departmentsColl.find({});
    const departments = await departmentsCursor.toArray();
    res.status(200).json({status: true,  departments: departments })
} catch (error) {
    res.status(500).json({status: false, message: error.message });
}
})

// get single department data 
app.get('/departments/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const objectId = new ObjectId(id);
    const departmentCursor = await departmentsColl.find({ "_id": objectId });
    const department = await departmentCursor.toArray();
    res.status(200).json({status: true,  department: department })
} catch (error) {
    res.status(500).json({status: false, message: error.message });
}
})

// add a department
app.post('/departments', async (req, res) => {
  try {
    const data = req.body;
    if (data) {
      const authDepartment = await departmentsColl.findOne({ "name": data?.name });
            if (!authDepartment) {
                const department = await departmentsColl.insertOne({ "name": data?.name });
                res.status(200).json({ status: true, message: 'Added Sucessfully'});
                return
            } else res.status(500).json({ status: false, message: 'Department already exists' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

//Update department details
app.put('/departments/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const data = req.body
      const result = await departmentsColl.updateOne(
        { _id: objectId },
        { $set: { name: data.name } }
      );
      if (!result) return res.status(404).json({ message: `cannot find any department with ID: ${id}` });
      res.status(200).json({status: true, message: 'Updated successfully'});
  } catch (error) {
      res.status(500).json({ message: error.message })
  }
})

// delete an department by their _id
app.delete('/departments/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const deleteResult = await departmentsColl.deleteOne({"_id": objectId})
      if (!deleteResult) return res.status(404).json({ message: `cannot find any user with ID: ${id}` });
      const departmentsCursor = await departmentsColl.find({});
      const departments = await departmentsCursor.toArray();
      res.status(200).json({status: true, message: 'deleted employee successfully',  departments: departments })
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
})


// started listening to server on defined port
app.listen(CONFIG.PORT, () => {
  console.log(`Server is running on port ${CONFIG.PORT}.`)
});

