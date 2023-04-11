const { v4 } = require('uuid');
const router = require('express').Router(); 
const jwt = require('jsonwebtoken');
const conn = require('../db/connection');
const authenticateSuperUser = require('../middleware/authsuper');



// Define a route for supervisor login
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    // Authenticate the user and generate a JWT
    const token = jwt.sign({ email, type: 'supervisor' }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  });
  
  // Define a route for getting all products for the assigned warehouse
  router.get('/products', authenticateSuperUser, (req, res) => {
    const { user } = req;
    // Get all products for the warehouse assigned to the supervisor
    const products = db.getProductsByWarehouseId(user.warehouseId);
    res.json(products);
  });
  
  // Define a route for getting a specific product for the assigned warehouse
  router.get('/products/:id', authenticateSuperUser, (req, res) => {
    const { id } = req.params;
    const { user } = req;
    // Get the product with the specified id for the warehouse assigned to the supervisor
    const product = db.getProductByIdAndWarehouseId(id, user.warehouseId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  });
  
  // Define a route for sending a stock request for a specific product
  router.post('/stock-requests', authenticateSuperUser, (req, res) => {
    const { user } = req;
    const { productId, quantity } = req.body;
    // Create a new stock request for the specified product and warehouse assigned to the supervisor
    const stockRequest = db.createStockRequest({
      supervisorId: user.id,
      productId,
      warehouseId: user.warehouseId,
      quantity,
      status: 'pending',
    });
    res.json(stockRequest);
  });
  
  // Define a route for getting all stock requests for the supervisor
  router.get('/stock-requests', authenticateSuperUser, (req, res) => {
    const { user } = req;
    // Get all stock requests for the supervisor
    const stockRequests = db.getStockRequestsBySupervisorId(user.id);
    res.json(stockRequests);
  });
  // Define a route for adding a new sale for a specific product
  router.post('/sales', authenticateSuperUser, (req, res) => {
    const { user } = req;
    const { customerId, productId, quantity, totalPrice } = req.body;
    // Create a new sale for the specified product and warehouse assigned to the supervisor
    const sale = db.createSale({
      supervisorId: user.id,
      customerId ,
      productId,
      warehouseId: user.warehouseId,
      quantity,
      totalPrice,
      date: new Date().toISOString()})});
   
  //    Define a route to retrieve a list of all supervisors:
router.get('/', async (req, res) => {
  try {
    const supervisors = await Supervisor.find().exec();
    return res.json(supervisors);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Define a route for supervisors to send a stock request to the admin:

router.post('/stock-requests', async (req, res) => {
  try {
    const { supervisorId, productId, quantity } = req.body;

    // Check if the supervisor and product exist and belong to the same warehouse
    const supervisor = await Supervisor.findById(supervisorId).exec();
    const product = await Product.findById(productId).exec();
    const warehouse = await Warehouse.findById(product.warehouseId).exec();
    if (!supervisor || !product || !warehouse || warehouse.supervisorId !== supervisor._id.toString()) {
      return res.status(400).json({ error: 'Invalid supervisor or product' });
    }
  

    // Create a new stock request and save to the database
    const request = await StockRequests.create({
      supervisorId,
      productId,
      warehouseId: product.warehouseId,
      quantity,
      status: 'pending'
    });

    return res.status(201).json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// Define a route for admins to view and approve/deny supervisor requests for changing the stock of a specific product:

router.get('/stock-requests', async (req, res) => {
  try {
    const requests = await StockRequests.find().exec();
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});
 // update
router.put('/stock-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Update the status of the stock request and update the stock quantity if approved
    const request = await StockRequests.findById(id).exec();
    if (!request) {
      return res.status(404).json({ error: 'Stock request not found' });
    }
    if (status === 'approved') {
      const product = await Product.findById(request.productId).exec();
      if (!product) {
        return res.status(400).json({ error: 'Invalid product' });
      }
      product.stock += request.quantity;
      await product.save();
    }
    request.status = status;
    await request.save();

    return res.json(request);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});


// Define a route for supervisors to view their request history:

router.get('/:supervisorId/requests', async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const requests = await StockRequest.find({ supervisorId }).populate('productId').exec();
    return res.json(requests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});
  
  module.exports = router;
