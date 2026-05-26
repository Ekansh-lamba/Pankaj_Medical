const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to calculate cart totals
const calculateCartTotals = (cart) => {
  let subtotal = 0;
  let hasRxItems = false;
  let hasOtcItems = false;
  let itemCount = 0;

  cart.items.forEach((item) => {
    subtotal += item.sellingPrice * item.quantity;
    itemCount += item.quantity;
    if (item.rxType === 'H' || item.rxType === 'NRX') {
      hasRxItems = true;
    } else {
      hasOtcItems = true;
    }
  });

  const deliveryCharge = itemCount === 0 ? 0 : subtotal >= 500 ? 0 : 50;
  const grandTotal = subtotal + deliveryCharge;

  return {
    items: cart.items,
    subtotal,
    hasRxItems,
    hasOtcItems,
    itemCount,
    deliveryCharge,
    grandTotal
  };
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = await Cart.create({ customer: req.user._id, items: [] });
    }

    const cartTotals = calculateCartTotals(cart);
    return res.status(200).json({
      success: true,
      data: cartTotals
    });
  } catch (err) {
    console.error('Get cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching cart' });
  }
};

// POST /api/cart/add
exports.addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid product or quantity parameter' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive || product.isHidden) {
      return res.status(404).json({ success: false, message: 'Product not available' });
    }

    if (product.stock === 0) {
      return res.status(400).json({ success: false, message: 'Product out of stock' });
    }

    // Business rule: max limit per order (OTC/H1: 10, H/NRX: 2)
    const isRx = product.rxType === 'H' || product.rxType === 'NRX';
    const maxQty = isRx ? 2 : 10;

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    let targetQuantity = quantity;

    if (existingItemIndex > -1) {
      targetQuantity += cart.items[existingItemIndex].quantity;
    }

    if (targetQuantity > maxQty) {
      return res.status(400).json({
        success: false,
        message: `Maximum allowed limit for this medicine is ${maxQty} units per order.`
      });
    }

    if (product.stock < targetQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity = targetQuantity;
    } else {
      // Add new item with snapshot values
      cart.items.push({
        product: productId,
        name: product.name,
        mrp: product.mrp,
        sellingPrice: product.sellingPrice,
        rxType: product.rxType,
        image: product.image,
        quantity
      });
    }

    await cart.save();

    const cartTotals = calculateCartTotals(cart);
    return res.status(200).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cartTotals
    });
  } catch (err) {
    console.error('Add to cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error while adding to cart' });
  }
};

// PUT /api/cart/update
exports.updateCartItem = async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined || quantity < 1) {
    return res.status(400).json({ success: false, message: 'Invalid parameters provided' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const isRx = product.rxType === 'H' || product.rxType === 'NRX';
    const maxQty = isRx ? 2 : 10;

    if (quantity > maxQty) {
      return res.status(400).json({
        success: false,
        message: `Maximum allowed limit for this medicine is ${maxQty} units per order.`
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units available in stock.`
      });
    }

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const cartTotals = calculateCartTotals(cart);
    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: cartTotals
    });
  } catch (err) {
    console.error('Update cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error while updating cart' });
  }
};

// DELETE /api/cart/remove/:productId
exports.removeCartItem = async (req, res) => {
  const { productId } = req.params;

  try {
    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    const cartTotals = calculateCartTotals(cart);
    return res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cartTotals
    });
  } catch (err) {
    console.error('Remove cart item error:', err);
    return res.status(500).json({ success: false, message: 'Server error while removing item' });
  }
};

// POST /api/cart/sync
exports.syncGuestCart = async (req, res) => {
  const { items } = req.body; // Array of { productId, quantity }

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Invalid cart format' });
  }

  try {
    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [] });
    }

    // Merge guest cart items into user's DB cart
    for (const guestItem of items) {
      const { productId, quantity } = guestItem;
      const product = await Product.findById(productId);

      if (!product || !product.isActive || product.isHidden || product.stock === 0) {
        continue; // Skip inactive/out of stock items
      }

      const isRx = product.rxType === 'H' || product.rxType === 'NRX';
      const maxQty = isRx ? 2 : 10;

      const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
      let newQty = quantity;

      if (existingIndex > -1) {
        newQty += cart.items[existingIndex].quantity;
      }

      // Caps to max allowable limits
      newQty = Math.min(newQty, maxQty, product.stock);

      if (newQty < 1) continue;

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = newQty;
      } else {
        cart.items.push({
          product: productId,
          name: product.name,
          mrp: product.mrp,
          sellingPrice: product.sellingPrice,
          rxType: product.rxType,
          image: product.image,
          quantity: newQty
        });
      }
    }

    await cart.save();

    const cartTotals = calculateCartTotals(cart);
    return res.status(200).json({
      success: true,
      message: 'Guest cart synced successfully',
      data: cartTotals
    });
  } catch (err) {
    console.error('Sync cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error while syncing cart' });
  }
};

// DELETE /api/cart/clear
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ customer: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items: [],
        subtotal: 0,
        hasRxItems: false,
        hasOtcItems: false,
        itemCount: 0,
        deliveryCharge: 0,
        grandTotal: 0
      }
    });
  } catch (err) {
    console.error('Clear cart error:', err);
    return res.status(500).json({ success: false, message: 'Server error while clearing cart' });
  }
};
