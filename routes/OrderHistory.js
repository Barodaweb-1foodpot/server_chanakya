const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
    createOrderHistory,
    getOrderHistoryById,
    listOrderHistoryByParams
} = require("../controllers/orderHistory/OrderHistory");
const multer = require("multer");
const path= require('path')
const fs= require('fs')

router.post('/auth/create/order-history', catchAsync(createOrderHistory));

router.get('/auth/get/order-history/:_id', catchAsync(getOrderHistoryById) )

router.post("/auth/list-by-params/order-history-details",   catchAsync(listOrderHistoryByParams)
  );
module.exports = router;
