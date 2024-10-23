const express = require("express");

const router = express.Router();

const catchAsync = require("../utils/catchAsync");

const {
  createProductsDetails,
  listProductsDetails,
  listProductsDetailsByParams,
  getProductsDetails,
  updateProductsDetails,
  removeProductsDetails,
  listProductByCategory,
  getProductByID,
  CategoryProductList,
  brandCount,
  getUniquefilters,
  downloadPDF,
  getFilteredProducts,
  getLastSKUNo,
  downloadPDFFromFrontend,
  getProducts,
  deleteFile,
  listProductsDetailsFromFrontendByParams,
  sendQuotationMail
} = require("../controllers/Products/ProductsDetails");
const multer = require("multer");
const path= require('path')
const fs= require('fs')


const directories = ["uploads/Products"];

directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, "uploads/Products");

    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const upload = multer({ storage: multerStorage });



router.post("/auth/create/product-details",upload.single("myFile"),catchAsync(createProductsDetails)
);

router.get("/auth/list/product-details", catchAsync(listProductsDetails));

router.post("/auth/list-by-params/product-details",catchAsync(listProductsDetailsByParams)
);

router.get("/auth/get/product-details/:_id", catchAsync(getProductsDetails));

router.put("/auth/update/product-details/:_id",upload.single("myFile"),catchAsync(updateProductsDetails)
);

router.delete("/auth/remove/product-details/:_id",catchAsync(removeProductsDetails)
);

// NEWWWW
router.post("/auth/get/category-product/:option/:categoryid",catchAsync(CategoryProductList)
);



// APPLICATION
router.get("/auth/list/product-by-category/:categoryId",catchAsync(listProductByCategory)
);

router.post("/auth/list/product-by-id/:productId", catchAsync(getProductByID));

router.get("/auth/list/brand-count", catchAsync(brandCount));

router.get("/auth/list/get-filters", catchAsync(getUniquefilters));

router.post('/auth/downloadCatalogue',catchAsync(downloadPDF))

router.post("/auth/list/get-filtered-products", catchAsync(getFilteredProducts));

router.get("/auth/list/last-SKU", catchAsync(getLastSKUNo));
 
router.post('/auth/downloadCatalogueFromFrontend',catchAsync(downloadPDFFromFrontend))

router.post('/auth/getProducts', catchAsync(getProducts))

router.post('/auth/delete-catalogue', catchAsync(deleteFile));

router.post("/auth/list-by-params/product-details-from-frontend", catchAsync(listProductsDetailsFromFrontendByParams)
);

router.post("/auth/sendQuotationMail", catchAsync(sendQuotationMail));

module.exports = router;
