-- CreateTable
CREATE TABLE "public"."Account" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "password" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "status" INTEGER,
    "roleId" INTEGER,
    "isLoginGoogle" INTEGER NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "roleId" INTEGER,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Industries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industryId" INTEGER,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "status" INTEGER NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductAttribute" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "tittle" TEXT NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AttributeValue" (
    "id" SERIAL NOT NULL,
    "productAttributeId" INTEGER,
    "value" TEXT NOT NULL,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "price" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VariantAttribute" (
    "id" SERIAL NOT NULL,
    "productVariantId" INTEGER,
    "attributeValueId" INTEGER,

    CONSTRAINT "VariantAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ViewHistory" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER,
    "productId" INTEGER,
    "viewDate" TIMESTAMP(3) NOT NULL,
    "isLike" INTEGER NOT NULL,

    CONSTRAINT "ViewHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Media" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "type" INTEGER NOT NULL,
    "productId" INTEGER,
    "feedbackId" INTEGER,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Voucher" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "type" INTEGER NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoucherCategory" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER,
    "categoryId" INTEGER,

    CONSTRAINT "VoucherCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Promotion" (
    "id" SERIAL NOT NULL,
    "percent" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPromotion" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER,
    "promotionId" INTEGER,

    CONSTRAINT "ProductPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShoppingCart" (
    "id" SERIAL NOT NULL,
    "productVariantId" INTEGER,
    "accountId" INTEGER,
    "status" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "ShoppingCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER,
    "total" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "currentStatus" INTEGER,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderStatus" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "OrderStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderStatusHistory" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER,
    "statusId" INTEGER,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderVoucher" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER,
    "voucherId" INTEGER,

    CONSTRAINT "OrderVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderDetail" (
    "id" SERIAL NOT NULL,
    "productVariantId" INTEGER,
    "orderId" INTEGER,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoucherOrderDetail" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER,
    "orderDetailId" INTEGER,

    CONSTRAINT "VoucherOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Feedback" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER,
    "productId" INTEGER,
    "content" TEXT NOT NULL,
    "feeedbackDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bill" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER,
    "shippingFeeId" INTEGER,
    "status" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "invoiceTime" TIMESTAMP(3) NOT NULL,
    "paymentTime" TIMESTAMP(3) NOT NULL,
    "total" INTEGER NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingFee" (
    "id" SERIAL NOT NULL,
    "maxDistance" INTEGER NOT NULL,
    "minDistance" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,

    CONSTRAINT "ShippingFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "public"."Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_url_key" ON "public"."Permission"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Industries_name_key" ON "public"."Industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_key" ON "public"."Categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "public"."Voucher"("code");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Categories" ADD CONSTRAINT "Categories_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "public"."Industries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AttributeValue" ADD CONSTRAINT "AttributeValue_productAttributeId_fkey" FOREIGN KEY ("productAttributeId") REFERENCES "public"."ProductAttribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariantAttribute" ADD CONSTRAINT "VariantAttribute_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "public"."AttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariantAttribute" ADD CONSTRAINT "VariantAttribute_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewHistory" ADD CONSTRAINT "ViewHistory_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewHistory" ADD CONSTRAINT "ViewHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "public"."Feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Media" ADD CONSTRAINT "Media_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoucherCategory" ADD CONSTRAINT "VoucherCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoucherCategory" ADD CONSTRAINT "VoucherCategory_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPromotion" ADD CONSTRAINT "ProductPromotion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPromotion" ADD CONSTRAINT "ProductPromotion_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "public"."Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShoppingCart" ADD CONSTRAINT "ShoppingCart_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShoppingCart" ADD CONSTRAINT "ShoppingCart_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_currentStatus_fkey" FOREIGN KEY ("currentStatus") REFERENCES "public"."OrderStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "public"."OrderStatus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderVoucher" ADD CONSTRAINT "OrderVoucher_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderVoucher" ADD CONSTRAINT "OrderVoucher_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderDetail" ADD CONSTRAINT "OrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderDetail" ADD CONSTRAINT "OrderDetail_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoucherOrderDetail" ADD CONSTRAINT "VoucherOrderDetail_orderDetailId_fkey" FOREIGN KEY ("orderDetailId") REFERENCES "public"."OrderDetail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoucherOrderDetail" ADD CONSTRAINT "VoucherOrderDetail_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "public"."VoucherCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_shippingFeeId_fkey" FOREIGN KEY ("shippingFeeId") REFERENCES "public"."ShippingFee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
