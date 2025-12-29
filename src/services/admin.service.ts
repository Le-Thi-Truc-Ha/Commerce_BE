import axios from "../configs/axios";
import { prisma, ReturnData, CategoryDash, Product, Media, Variant, Promotion, Voucher, Category } from "../interfaces/admin.interface";
import dayjs from "dayjs";

/** Dashboard */
const getRecentOrders = async (): Promise<ReturnData> => {
    try {
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { orderDate: "desc"},
            select: {
                id: true,
                total: true,
                orderDate: true,
                orderStatus: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                account: { select: { fullName: true } }
            }
        });

        const data = orders.map(o => ({
            id: o.id,
            accountName: o.account?.fullName,
            total: o.total,
            orderDate: o.orderDate.toString(),
            currentStatus: o.orderStatus?.name,
        }));
        return { 
            message: "Lấy danh sách đơn hàng gần đây thành công!",
            code: 0,
            data: data
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách đon hàng gần đây!",
            code: -1,
            data: false
        };
    }
};

const getSalesData = async (): Promise<ReturnData> =>{
    try {
        const result = await prisma.$queryRaw<
            { month: number; revenue: number; orders: number }[]
        >`
            SELECT 
                EXTRACT(MONTH FROM "orderDate") AS month,
                SUM("total") AS revenue,
                COUNT(*) AS orders
            FROM "Order"
            WHERE EXTRACT(YEAR FROM "orderDate") = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY month
            ORDER BY month;
        `;

        const months = [
            "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
            "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
            "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
        ];

        const data = result.map(r => ({
            month: months[Number(r.month) - 1],
            revenue: Number(r.revenue),
            orders: Number(r.orders),
        }));

        return { 
            message: "Lấy doanh thu bán hàng thành công!",
            code: 0,
            data: data
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy doanh thu bán hàng!",
            code: -1,
            data: false
        };
    }
};

const getCategoriesSale = async (): Promise<ReturnData> => {
    try {
        const result = await prisma.$queryRaw<
            { name: string; value: number }[]
        >`
            SELECT
                c."id",
                c."name" AS name,
                COALESCE(SUM(o."total"), 0) AS value
            FROM "Categories" c
            LEFT JOIN "Product" p ON c."id" = p."categoryId"
            LEFT JOIN "ProductVariant" pv ON p."id" = pv."productId"
            LEFT JOIN "OrderDetail" od ON pv."id" = od."productVariantId"
            LEFT JOIN "Order" o ON od."orderId" = o."id"
            WHERE o."currentStatus" = 6
            GROUP BY c."id", c."name"
            LIMIT 10;
        `;

        const data: CategoryDash[] = result.map((r: CategoryDash) => ({
            name: r.name,
            value: Number(r.value),
        }));

        return { 
            message: "Lấy doanh thu bán hàng theo danh mục thành công!",
            code: 0,
            data: data
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy doanh thu bán hàng theo danh mục!",
            code: -1,
            data: false
        };
    }
};

/** Quản lý sản phẩm */
// Products
const normalizeStr = (str: string): string => {
    if (!str) return "unknown";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .replace(/[^0-9a-zA-Z\s]/g, "")
        .trim()
        .toLowerCase();
};

const getAllProducts = async ( page: number = 1, limit: number = 10, search: string = "", category?: string, price?: string ): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;
        const where: any = {
            status: { not: 0 },
            name: {
                contains: search,
                mode: "insensitive"
            }
        };
        if (category) {
            where.category = {
                name: {
                    equals: category,
                    mode: "insensitive"
                }
            };
        }

        if (price === "low") {
            where.productVariants = { some: { price: { lt: 100000 } } };
        } else if (price === "mid") {
            where.productVariants = { some: { price: { gte: 100000, lt: 500000 } } };
        } else if (price === "high") {
            where.productVariants = { some: { price: { gte: 500000 } } };
        }
        
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: { id: "asc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    category: { select: { name: true } },
                    productVariants: { select: { price: true, quantity: true, status: true } }
                }
            }),
            prisma.product.count({ where })
        ]);

        const result = products.map((p) => {
            const minPrice = p.productVariants.length > 0 ? Math.min(...p.productVariants.map((v) => v.price)) : 0;
            const totalQuantity = p.productVariants.filter(v => v.status !== 0).reduce((sum, v) => sum + v.quantity, 0);
            return {
                id: p.id,
                name: p.name,
                categoryName: p.category.name,
                price: minPrice,
                quantity: totalQuantity
            };
        });

        return { 
            message: "Lấy danh sách sản phẩm thành công!",
            code: 0,
            data: { products: result, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách sản phẩm!",
            code: -1,
            data: false
        };
    }
};

const getProductById = async (id: number): Promise<ReturnData> => {
    try {
        const product = await prisma.product.findFirst({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                category: { select: { name: true }},
                medias: { select: { url: true, type: true }}
            }
        });
        if (!product) {
            return {
                message: "Không tìm thấy sản phẩm!",
                code: 1,
                data: false
            };
        }
        return {
            message: "Lấy thông tin sản phẩm thành công!",
            code: 0,
            data: product
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin sản phẩm!",
            code: -1,
            data: false
        };
    }
};

const getProductCategories = async (): Promise<ReturnData> => {
    try {
        const categories = await prisma.categories.findMany({
            orderBy: { id: "asc" },
            select: {
                id: true,
                name: true,
                parent: true
            }
        });

        return {
            message: "Lấy danh sách danh mục thành công!",
            code: 0,
            data: categories
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách danh mục!",
            code: -1,
            data: false
        };
    }
};

const createProduct = async (data: Product): Promise<ReturnData> => {
    try {
        const result = await axios.get("/rs/feature-extraction");
        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                categoryId: Number(data.categoryId),
                status: 1,
                saleFigure: 0,
                medias: data.medias && data.medias.length > 0
                    ? {
                        createMany: {
                            data: data.medias.map((m) => ({
                                url: m.url,
                                type: m.type,
                            })),
                        },
                    } : undefined,
                featureVector: Buffer.from("abcd", "utf-8")
            }
        });

        if (data.variants && data.variants.length > 0) {
            const variantRecords = data.variants.map((variant: any) => ({
                productId: product.id,
                color: variant.color,
                size: variant.size,
                quantity: variant.quantity ? Number(variant.quantity) : 0,
                price: Number(variant.price) || 0,
                status: 1
            }));

            await prisma.productVariant.createMany({
                data: variantRecords,
            });
        }

        if (data.variants && data.variants.length > 0) {
            const priceLevel =
                data.price < 100000 ? "thap" :
                data.price <= 400000 ? "vua" : "cao";

            const featureRecords = data.variants.map((variant: any) => {
                const color = normalizeStr(variant.color || "unknown");
                const size = normalizeStr(variant.size || "unknown");

                return {
                    productId: product.id,
                    fit: normalizeStr(data.fit) || "unknown",
                    material: normalizeStr(data.material) || "unknown",
                    occasion: normalizeStr(data.occasion) || "unknown",
                    season: normalizeStr(data.season) || "unknown",
                    color,
                    size,
                    price: priceLevel,
                    style: normalizeStr(data.style) || "unknown",
                    age: normalizeStr(data.age) || "unknown",
                    // neckline: normalizeStr(data.features.neckline || "unknown"),
                    // sleeve: normalizeStr(data.features.sleeve || "unknown"),
                    // pantLength: normalizeStr(data.features.pantLength || "unknown"),
                    // pantShape: normalizeStr(data.features.pantShape || "unknown"),
                    // dressLength: normalizeStr(data.features.dressLength || "unknown"),
                    // dressShape: normalizeStr(data.features.dressShape || "unknown"),
                    // skirtLength: normalizeStr(data.features.skirtLength || "unknown"),
                    // skirtShape: normalizeStr(data.features.skirtShape || "unknown"),
                };
            });

            await prisma.productFeature.createMany({
                data: featureRecords,
            });
        }

        return {
            code: 0,
            message: "Tạo sản phẩm thành công!",
            data: true,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi tạo sản phẩm!",
            data: false,
        };
    }
};

const updateProduct = async (id: number, data: Product): Promise<ReturnData> => {
    try {
        const existProduct = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: { medias: true }
        });
        if (!existProduct || existProduct.status == 0) {
            return {
                message: "Không tìm thấy sản phẩm!",
                code: 1,
                data: false
            };
        }

        const currentUrls = existProduct.medias.map((m: Media) => m.url);
        const newUrls = data.medias.map(m => m.url);
        const mediasToDelete = existProduct.medias.filter((m: Media) => !newUrls.includes(m.url));

        if (mediasToDelete.length > 0) {
            await prisma.media.deleteMany({
                where: { id: { in: mediasToDelete.map((m: Media) => m.id) } },
            });
        }

        const mediasToAdd = data.medias.filter(m => !currentUrls.includes(m.url));
        if (mediasToAdd.length > 0) {
            await prisma.media.createMany({
                data: mediasToAdd.map((m) => ({
                    url: m.url,
                    type: m.type,
                    productId: Number(id),
                })),
            });
        }

        const update = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                description: data.description,
                categoryId: Number(data.categoryId)
            }
        });

        return {
            message: "Cập nhật sản phẩm thành công!",
            code: 0,
            data: update
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi cập nhật sản phẩm!",
            code: -1,
            data: false
        };
    }
};

const deleteProduct = async (id: number): Promise<ReturnData> => {
    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return {
                message: "Không tìm thấy sản phẩm!",
                code: 1,
                data: false
            }
        }
        const deleted = await prisma.product.update({
            where: { id },
            data: { status: 0 },
        });
        return {
            message: "Xóa sản phẩm thành công!",
            code: 0,
            data: deleted
        }
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi xóa sản phẩm!",
            code: -1,
            data: false
        }
    }
};

// Variants
const getProdctDetail = async (id: number): Promise<ReturnData> => {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                name: true,
                description: true,
                saleFigure: true,
                rateStar: true,
                medias: true,
                category: { select: { name: true }}
            }
        });

        if (!product) {
            return {
                message: "Không tìm thấy san phẩm!",
                code: 1,
                data: false
            };
        }

        return {
            message: "Lấy thông tin sản phẩm thành công!",
            code: 0,
            data: product
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin chi tiết sản phẩm!",
            code: -1,
            data: false
        };
    }
};

const getAllVariants = async (id: number, page: number = 1, limit: number = 5): Promise<ReturnData> => {
    try {
        const product = await prisma.product.findUnique({ where: {id: Number(id)} });
        if (!product) {
            return {
                message: "Không tìm thấy sản phẩm!",
                code: 1,
                data: false
            };
        }

        const skip = (page - 1) * limit;
        const [ variants, total ] = await Promise.all([
            prisma.productVariant.findMany({
                where: { productId: id, status: { not: 0 } },
                orderBy: { id: "asc" },
                skip,
                take: limit
            }),
            prisma.productVariant.count({ where: { productId: id, status: { not: 0 } }})
        ]);
        
        return {
            message: "Lấy danh sách biến thể thành công!",
            code: 0,
            data: { variants, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách biến thể!",
            code: -1,
            data: false
        };
    }
};

const getVariantById = async (id: number): Promise<ReturnData> => {
    try {
        const variant = await prisma.productVariant.findUnique({
            where: {id}
        });
        if (!variant) {
            return {
                message: "Không tìm thấy biến thể!",
                code: 1,
                data: false
            };
        }

        return {
            code: 0,
            message: "Lấy thông tin biến thể thành công!",
            data: variant,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi lấy thông tin biến thể!",
            data: false,
        };
    }
};

const createVariant = async (data: Variant, productId: number): Promise<ReturnData> => {
    try {
        const product = await prisma.product.findUnique({where: {id: Number(productId)}});
        if (!product) {
            return {
                message: "Không tìm thấy sản phẩm!",
                code: 1,
                data: false
            };
        }

        const variant = await prisma.productVariant.create({
            data: {
                productId: Number(productId),
                size: data.size,
                color: data.color,
                price: Number(data.price),
                quantity: Number(data.quantity),
                status: 1
            }
        });

        return {
            code: 0,
            message: "Tạo biến thể thành công!",
            data: variant,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi tạo biến thể!",
            data: false,
        };
    }
};

const updateVariant = async (data: Variant): Promise<ReturnData> => {
    try {
        const variant = await prisma.productVariant.update({
            where: { id: Number(data.id) },
            data: {
                size: data.size,
                color: data.color,
                price: Number(data.price),
                quantity: Number(data.quantity),
                status: 1
            }
        });
        if (!variant) {
            return {
                message: "Không tìm thấy biến thể!",
                code: 1,
                data: false
            };
        }

        return {
            code: 0,
            message: "Cập nhật biến thể thành công!",
            data: variant,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi cập nhật biến thể!",
            data: false,
        };
    }
};

const deleteVariant = async (id: number): Promise<ReturnData> => {
    try {
        const variant = await prisma.productVariant.update({
            where: { id },
            data: {
                status: 0
            }
        });
        if (!variant) {
            return {
                message: "Không tìm thấy biến thể!",
                code: 1,
                data: false
            };
        }
        const existInCart = await prisma.shoppingCart.findMany({
            where: { productVariantId: Number(id) }
        });
        if (existInCart) {
            await prisma.shoppingCart.updateMany({
                where: { id, productVariantId: id },
                data: {
                    status: 5
                }
            });
        }

        return {
            code: 0,
            message: "Xóa biến thể thành công!",
            data: variant,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi xóa biến thể!",
            data: false,
        };
    }
};

/** Quản lý đơn hàng */
const getStatus = async (): Promise<ReturnData> => {
    try {
        const status = await prisma.orderStatus.findMany({ where: {} });
        return {
            message: "Lấy danh sách trạng thái đơn hàng thành công!",
            code: 0,
            data: status
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách trạng thái đơn hàng!",
            code: -1,
            data: false
        };
    }
};

const getAllOrders = async (page: number, limit: number, search: string, fromDate: string, toDate: string, status: number): Promise<ReturnData> => {
    try {
        const where: any ={};
        if (search && search !== "undefined" && search !== "\"\"" && search !== "") {
            if (!Number.isNaN(Number(search))) {
                where.id = Number(search);
            } else {
                where.account = {
                    fullName: {
                        contains: search,
                        mode: "insensitive",
                    },
                };
            }
        }

        if (fromDate && fromDate !== "undefined" && dayjs(fromDate).isValid()) {
            where.orderDate = { ...(where.orderDate || {}), gte: dayjs(fromDate).startOf("day").toDate() };
        }

        if (toDate && toDate !== "undefined" && dayjs(toDate).isValid()) {
            where.orderDate = { ...(where.orderDate || {}), lte: dayjs(toDate).endOf("day").toDate() };
        }

        if (status !== undefined && status !== -1) {
            where.currentStatus = status;
        }

        const total = await prisma.order.count({ where });

        const orders = await prisma.order.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { orderDate: "desc" },
            select: {
                id: true,
                total: true,
                orderDate: true,
                orderStatus: true,
                address: { select: { address: true }},
                account: { select: { fullName: true }}
            }
        });
        return {
            message: "Lấy danh sách đơn hàng thành công!",
            code: 0,
            data: { orders, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách đơn hàng!",
            code: -1,
            data: false
        };
    }
};

const getBill = async ( orderId: number ): Promise<ReturnData> => {
    try {
        const bill = await prisma.order.findUnique({
            where: { id: Number(orderId)},
            select: {
                id: true,
                total: true,
                orderDate: true,
                orderStatus: { select: { id: true, name: true }},
                address: { select: { address: true, name: true }},
                orderVouchers: {
                    select: {
                        voucher: {
                            select: { 
                                code: true,
                                type: true, 
                                discountPercent: true 
                            }
                        }
                    }
                },
                orderDetails: {
                    select: {
                        id: true,
                        quantity: true,
                        productVariant: {
                            select: {
                                price: true,
                                size: true,
                                color: true,
                                product: { 
                                    select: { 
                                        name: true,
                                        productPromotions: { 
                                            select: { 
                                                promotion: { 
                                                    select: { 
                                                        percent: true,
                                                        endDate: true,
                                                        startDate: true,
                                                        status: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        voucherOrderDetails: {
                            select: {
                                voucherCategory: {
                                    select: {
                                        voucher: { 
                                            select: { 
                                                code: true,
                                                type: true, 
                                                discountPercent: true 
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                bills: {
                    select: {
                        id: true,
                        paymentMethod: true,
                        shippingFee: { select: { cost: true }},
                        total: true,
                        invoiceTime: true,
                        paymentTime: true
                    }
                }
            }
        });

        if (!bill) {
            return {
                message: "Không tìm thấy đơn hàng",
                code: 1,
                data: null
            };
        }

        let totalVoucher = 0;

        // Voucher áp dụng trên hóa đơn hoặc phí ship
        for (const vo of bill.orderVouchers) {
            if (!vo.voucher) continue;

            if (vo.voucher.type === 1) {
                // Voucher áp dụng toàn hóa đơn
                totalVoucher += (vo.voucher.discountPercent / 100) * bill.total;
            } else if (vo.voucher.type === 2) {
                // Voucher áp dụng phí ship
                totalVoucher += (vo.voucher.discountPercent / 100) * (bill.bills[0]?.shippingFee?.cost ?? 0);
            }
        }

        // Voucher áp dụng cho sản phẩm (VoucherOrderDetail)
        const orderDetailsWithPrice = bill.orderDetails.map((od: any) => {
            let finalPrice = od.productVariant?.price ?? 0;
            const promotions = od.productVariant?.product?.productPromotions ?? [];

            // Áp dụng promotion hợp lệ
            for (const pp of promotions) {
                const promo = pp.promotion;
                if (
                    promo &&
                    promo.status === 1 &&
                    bill.orderDate >= promo.startDate &&
                    bill.orderDate <= promo.endDate
                ) {
                    finalPrice -= (promo.percent / 100) * finalPrice;
                }
            }

            // Áp dụng voucher theo danh mục
            for (const vod of od.voucherOrderDetails) {
                const voucher = vod.voucherCategory?.voucher;
                if (voucher?.type === 3) {
                    totalVoucher += (voucher.discountPercent / 100) * finalPrice;
                }
            }

            return {
                ...od,
                priceAfterPromotion: Math.round(finalPrice)
            };
        });

        const result = { ...bill, totalVoucher, orderDetails: orderDetailsWithPrice };

        return {
            message: "Lấy thông tin hóa đơn thành công!",
            code: 0,
            data: result
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin hóa đơn!",
            code: -1,
            data: false
        };
    }
};

const getOrderHistories = async (id: number): Promise<ReturnData> => {
    try {
        const order = await prisma.order.findUnique({ where: { id: Number(id) } });
        if(!order) {
            return {
                message: "Không tìm thấy đơn hàng!",
                code: 1,
                data: false
            };
        }
        const histories = await prisma.orderStatusHistory.findMany({
            where: { orderId: Number(id) },
            select:{
                id: true,
                date: true,
                orderStatus: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                note: true
            }
        });

        return {
            message: "Lấy danh sách trạng thái đơn hàng thành công!",
            code: 0,
            data: histories
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách trạng thái đơn hàng!",
            code: -1,
            data: false
        };
    }
};

const updateStatus = async (id: number, status: number, note?: string): Promise<ReturnData> => {
    try {
        const order = await prisma.order.findUnique({ where: { id: Number(id) }, include: { bills: true }});
        if (!order) {
            return {
                message: "Không tìm thấy đơn hàng!",
                code: 1,
                data: false
            }
        }

        const update = await prisma.order.update({
            where: { id: Number(id) },
            data: { currentStatus: status }
        });

        await prisma.orderStatusHistory.create({
            data: {
                orderId: Number(id),
                statusId: Number(status),
                date: new Date(),
                note: note || null
            }
        });

        if (Number(status) === 4 && order.bills.length > 0) {
            await prisma.bill.update({
                where: { id: order.bills[0].id },
                data: { invoiceTime: new Date() }
            });
        } 

        if (order.bills[0].paymentMethod === 2) {
            await prisma.bill.update({
                where: { id: order.bills[0].id },
                data: { 
                    paymentTime: new Date(),
                    status: 1 
                }
            });
        }

        
        return {
            message: "Cập nhật trạng thái đơn hàng thành công!",
            code: 0,
            data: update
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi cập nhật trạng thái đơn hàng!",
            code: -1,
            data: false
        };
    }
};

/** Quản lý khách hàng */
const getAllCustomers =  async (page: number, limit: number, search: string): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;

        let searchCondi: any = { roleId: 2 };

        if (search) {
            const isPhoneSearch = /^\d+$/.test(search.trim());

            if (isPhoneSearch) {
                const matchedAddresses = await prisma.address.findMany({
                    where: {
                        phoneNumber: { contains: search, mode: "insensitive" },
                    },
                    select: { id: true },
                });

                const matchedAddressIds = matchedAddresses.map((a: any) => a.id);

                searchCondi = {
                    roleId: 2,
                    defaultAddress: { in: matchedAddressIds },
                };
            } else {
                searchCondi = {
                    roleId: 2,
                    OR: [
                        { fullName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ],
                };
            }
        }

        const customers = await prisma.account.findMany({
            where: searchCondi,
            orderBy: { id: "asc" },
            skip,
            take: limit,
            select: {
                id: true,
                fullName: true,
                email: true,
                gender: true,
                dob: true,
                status: true,
                defaultAddress: true,
            },
        });

        const defaultAddressIds = customers.map((c: any) => c.defaultAddress).filter((id: number) => id !== null);

        const addresses = await prisma.address.findMany({
            where: { id: { in: defaultAddressIds } },
            select: { id: true, phoneNumber: true },
        });

        const result = customers.map((c: any) => ({
            ...c,
            phoneNumber: addresses.find((a: any) => a.id === c.defaultAddress)?.phoneNumber || null,
        }));

        const total = await prisma.account.count({ where: searchCondi });

        return {
            message: "Lấy danh sách khách hàng thành công!",
            code: 0,
            data: { result, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách khách hàng!",
            code: -1,
            data: false
        };
    }
};

const getCustomerDetail = async (id: number): Promise<ReturnData> => {
    try {
        const customer = await prisma.account.findUnique({
            where: { id: Number(id), roleId: 2 },
            select: {
                id: true,
                addresses: {
                    where: { status: 1 },
                    select: {
                        id: true,
                        address: true,
                        name: true,
                        phoneNumber: true
                    }
                }
            }
        });
        
        if (!customer) {
            return {
                message: "Không tìm thấy khách hàng!",
                code: 1,
                data: false
            };
        }

        const defaultAddress = await prisma.account.findUnique({
            where: { id: customer.id },
            select: { defaultAddress: true }
        });

        if (defaultAddress?.defaultAddress && customer.addresses.length > 0) {
            customer.addresses.sort((a: any, b: any) => {
                if (a.id === defaultAddress.defaultAddress) return -1;
                if (b.id === defaultAddress.defaultAddress) return 1;
                return 0;
            });
        }      

        return {
            message: "Lấy thông tin khách hàng thành công!",
            code: 0,
            data: customer
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin khách hàng!",
            code: -1,
            data: false
        };
    }
};

const getCustomerOrders = async (id: number, page: number, limit: number): Promise<ReturnData> => {
    try {
        const customer = await prisma.account.findUnique({where: {id: Number(id)}});
        if (!customer) {
            return {
                message: "Không tìm thấy khách hàng!",
                code: 1,
                data: false
            };
        }
        const skip = (page - 1) * limit;
        const orders = await prisma.account.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                orders: {
                    orderBy: { orderDate: 'desc' },
                    skip,
                    take: limit,
                    select: {
                        id: true,
                        orderDate: true,
                        orderStatus: true,
                        bills: { select: { total: true }}
                    }
                }
            }
        });

        const total = await prisma.order.count({
            where: { accountId: Number(id) }
        });
        
        return {
            message: "Lấy danh sách đơn hàng của khách hàng thành công!",
            code: 0,
            data: { orders, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách đơn hàng của khách hàng!",
            code: -1,
            data: false
        };
    }
};

/** Quản lý chương trình ưu đãi */
const getAllPromotions = async (page: number, limit: number, search: string, fromDate: string, toDate: string ): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;

        const where: any = { status: 1};

        if (search && search.trim() !== "") {
            where.productPromotions = {
                some: {
                    product: {
                        name: {
                            contains: search.trim(),
                            mode: 'insensitive',
                        }
                    }
                }
            };
        }

        if (fromDate && toDate) {
            where.startDate = { gte: new Date(fromDate) };
            where.endDate = { lte: new Date(toDate) };
        } else if (fromDate) {
            where.startDate = { gte: new Date(fromDate) };
        } else if (toDate) {
            where.endDate = { lte: new Date(toDate) };
        }

        const promotions = await prisma.promotion.findMany({
            where,
            orderBy: { startDate: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                percent: true,
                endDate: true,
                startDate: true,
                productPromotions: {
                    select: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                productVariants: {
                                    select: { quantity: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const total = await prisma.promotion.count({ where });

        return {
            message: "Lấy danh sách chương trình ưu đãi thành công!",
            code: 0,
            data: { promotions, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách chương trình ưu đãi!",
            code: -1,
            data: false
        };
    }
};

const getPromotionProducts = async (id: number, page: number = 1, limit: number = 5, search: String): Promise<ReturnData> => {
    try {
        const promotion = await prisma.promotion.findUnique({ where: {id: Number(id)} });
        if (!promotion) {
            return {
                message: "Không tìm thấy chương trình ưu đãi!",
                code: 1,
                data: false
            };
        }

        const where: any = {
            promotionId: id,
            product: {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { category: { name: { contains: search, mode: "insensitive" } } },
                ],
            },
        };

        const skip = (page - 1) * limit;
        const products = await prisma.productPromotion.findMany({
            where,
            orderBy: { id: "asc" },
            skip,
            take: limit,
            select: {
                product: {
                    select: { 
                        id: true,
                        name: true,
                        category: true 
                    },
                },
            }
        });
        
        const total = await prisma.productPromotion.count({ where });

        return {
            message: "Lấy danh sách sản phẩm của chương trình ưu đãi thành công!",
            code: 0,
            data: { products, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi danh sách sản phẩm của chương trình ưu đãi thành công!",
            code: -1,
            data: false
        };
    }
};

const getPromotionById = async (id: number): Promise<ReturnData> => {
    try {
        const promotion = await prisma.promotion.findUnique({
            where: { id: Number(id), status: 1 },
            include: {
                productPromotions: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                category: {
                                    select: { id: true, name: true }
                                },
                            }
                        }
                    }
                }
            }
        });
        
        if (!promotion) {
            return {
                message: "Không tìm thấy chương trình ưu đãi!",
                code: 1,
                data: false
            };
        }    

        return {
            message: "Lấy thông tin chương trình ưu đãi thành công!",
            code: 0,
            data: promotion
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin chương trình ưu đãi!",
            code: -1,
            data: false
        };
    }
};

const getProductsByCategory = async (id: number, search: string): Promise<ReturnData> => {
    try {
        const category = await prisma.categories.findUnique({ where: { id: Number(id) }});
        if (!category) {
            return {
                message: "Không tìm thấy danh mục!",
                code: 1,
                data: false
            };
        }

        const getAllChildCategoryIds = async (parentId: number): Promise<number[]> => {
            const children = await prisma.categories.findMany({
                where: { parentId },
                select: { id: true }
            });

            if (!children.length) return [parentId];

            const subIds = await Promise.all(children.map((c: any) => getAllChildCategoryIds(c.id)));
            return [parentId, ...subIds.flat()];
        };

        const allCategoryIds = await getAllChildCategoryIds(Number(id));

        const products = await prisma.product.findMany({
            where: { 
                categoryId: { in: allCategoryIds }, 
                status: 1, 
                ...(search?.trim() && {
                    name: { contains: search.trim(), mode: "insensitive" }
                })
            },
            select: {
                id: true,
                name: true,
                category: {
                    select: { id: true, name: true }
                }
            }
        });   
        
        const result = products.map((p: any) => ({ product: p }));

        return {
            message: "Lấy danh sách sản phẩm theo danh mục thành công!",
            code: 0,
            data: result
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách sản phẩm theo danh mục!",
            code: -1,
            data: false
        };
    }
};

const createPromotion = async (data: Promotion): Promise<ReturnData> => {
    try {
        const promotion = await prisma.promotion.create({
            data: {
                percent: Number(data.percent),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                status: 1,
            }
        });
        const productIds = data.productIds;
        if (productIds) {
            const ids = Array.isArray(productIds) ? productIds : [productIds];
            await prisma.productPromotion.createMany({
                data: ids.map((proId: any) => ({
                    promotionId: Number(promotion.id),
                    productId: Number(proId),
                }))
            });
        }

        return {
            code: 0,
            message: "Tạo chương trình ưu đãi thành công!",
            data: promotion,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi tạo chương trình ưu đãi!",
            data: false,
        };
    }
};

const updatePromotion = async (id: number, data: Promotion): Promise<ReturnData> => {
    try {
        const promotion = await prisma.promotion.findUnique({ where: { id: Number(id) }});
        if (!promotion) {
            return {
                message: "Không tìm thấy chương trình ưu đãi!",
                code: 1,
                data: false
            }
        }

        const update = await prisma.promotion.update({
            where: { id: Number(id) },
            data: {
                percent: Number(data.percent),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate)
            }
        });
        const productIds = data.productIds;
        if (productIds) {
            const ids = Array.isArray(productIds) ? productIds : [productIds];

            await prisma.productPromotion.deleteMany({
                where: { promotionId: Number(id) }
            });

            await prisma.productPromotion.createMany({
                data: ids.map((proId: any) => ({
                    promotionId: Number(id),
                    productId: Number(proId)
                })),
            });
        }
        
        return {
            message: "Cập nhật chương trình ưu đãi thành công!",
            code: 0,
            data: update
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi cập nhật chương trình ưu đãi!",
            code: -1,
            data: false
        };
    }
};

const deletePromotion = async (id: number): Promise<ReturnData> => {
    try {
        const promotion = await prisma.promotion.findUnique({ where: { id: Number(id) } });
        if (!promotion) {
            return {
                message: "Không tìm thấy chương trình ưu đãi!",
                code: 1,
                data: false
            }
        }
        const deleted = await prisma.promotion.update({
            where: { id },
            data: { status: 0 },
        });

        return {
            message: "Xóa chương trình ưu đãi thành công!",
            code: 0,
            data: deleted
        }
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi xóa chương trình ưu đãi!",
            code: -1,
            data: false
        }
    }
};

/** Quản lý mã giảm giá */
const getAllVouchers =  async (page: number, limit: number, search: string, fromDate: string, toDate: string, type: number): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;

        const where: any = {
            ...({ status: 1 }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { code: { contains: search, mode: "insensitive" } },
                ],
            }),
            ...(fromDate && { startDate: { gte: new Date(fromDate) } }),
            ...(toDate && { endDate: { lte: new Date(toDate) } }),
            ...(type !== 0 && { type })
        };

        const vouchers = await prisma.voucher.findMany({
            where,
            orderBy: { id: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                code: true,
                name: true,
                discountPercent: true,
                startDate: true,
                endDate: true,
                quantity: true,
                type: true
            }
        });

        const total = await prisma.voucher.count({ where });

        return {
            message: "Lấy danh sách mã khuyến mãi thành công!",
            code: 0,
            data: { vouchers, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách mã khuyến mãi!",
            code: -1,
            data: false
        };
    }
};

const getVoucherDetail = async (id: number, page: number, limit: number): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;
        const voucher = await prisma.voucher.findUnique({
            where: { id: Number(id), status: 1 },
            select: {
                id: true,
                description: true,
                condition: true,
                type: true,
                voucherCategories: {
                    skip,
                    take: limit,
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        const total = await prisma.voucherCategory.count({
            where: { voucherId: Number(id) }
        });
        
        if (!voucher) {
            return {
                message: "Không tìm thấy mã giảm giá!",
                code: 1,
                data: false
            };
        }    

        return {
            message: "Lấy thông tin mã giảm giá thành công!",
            code: 0,
            data: { voucher, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin mã giảm giá!",
            code: -1,
            data: false
        };
    }
};

const getVoucherById = async (id: number): Promise<ReturnData> => {
    try {
        const voucher = await prisma.voucher.findUnique({
            where: { id: Number(id), status: 1 },
            include: {
                voucherCategories: {
                    select: {
                        category: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                } 
            }
        });
        
        if (!voucher) {
            return {
                message: "Không tìm thấy mã giảm giá!",
                code: 1,
                data: false
            };
        }    

        return {
            message: "Lấy thông tin mã giảm giá thành công!",
            code: 0,
            data: voucher
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy thông tin mã giảm giá!",
            code: -1,
            data: false
        };
    }
};

const getVoucherCategories = async (search: string): Promise<ReturnData> => {
    try {
        const where: any = search
            ? { name: { contains: search.trim(), mode: "insensitive" }, status: 1 }
            : { status: 1 };

        const categories = await prisma.categories.findMany({
            where,
            select: {
                id: true,
                name: true
            }
        });

        return {
            message: "Lấy danh sách danh mục thành công!",
            code: 0,
            data: categories
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách danh mục!",
            code: -1,
            data: false
        };
    }
};

const createVoucher = async (data: Voucher): Promise<ReturnData> => {
    try {
        const voucher = await prisma.voucher.create({
            data: {
                code: data.code,
                name: data.name,
                discountPercent: Number(data.discountPercent),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                quantity: Number(data.quantity),
                condition: Number(data.condition),
                type: Number(data.type),
                description: data.description,
                status: 1,
            }
        });
        const categoryIds = data.categoryIds;
        if (categoryIds) {
            const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
            await prisma.voucherCategory.createMany({
                data: ids.map((catId: any) => ({
                    voucherId: voucher.id,
                    categoryId: Number(catId),
                }))
            });
        }

        return {
            code: 0,
            message: "Tạo mã khuyến mãi thành công!",
            data: voucher,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi tạo mã khuyến mãi!",
            data: false,
        };
    }
};

const updateVoucher = async (id: number, data: Voucher): Promise<ReturnData> => {
    try {
        const voucher = await prisma.voucher.findUnique({ where: { id: Number(id) }});
        if (!voucher) {
            return {
                message: "Không tìm thấy mã khuyến mãi!",
                code: 1,
                data: false
            }
        }

        const update = await prisma.voucher.update({
            where: { id: Number(id) },
            data: {
                code: data.code,
                name: data.name,
                discountPercent: Number(data.discountPercent),
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                quantity: Number(data.quantity),
                condition: Number(data.condition),
                type: Number(data.type),
                description: data.description
            }
        });

        const categoryIds = data.categoryIds;
            if (categoryIds) {
            const ids = Array.isArray(categoryIds) ? categoryIds : [categoryIds];

            await prisma.voucherCategory.deleteMany({
                where: { voucherId: Number(id) }
            });

            await prisma.voucherCategory.createMany({
                data: ids.map((catId: any) => ({
                    voucherId: Number(id),
                    categoryId: Number(catId)
                })),
            });
        }
        
        return {
            message: "Cập nhật mã khuyến mãi thành công!",
            code: 0,
            data: update
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi cập nhật mã khuyến mãi!",
            code: -1,
            data: false
        };
    }
};

const deleteVoucher = async (id: number): Promise<ReturnData> => {
    try {
        const voucher = await prisma.voucher.findUnique({ where: { id: Number(id) } });
        if (!voucher) {
            return {
                message: "Không tìm thấy mã khuyến mãi!",
                code: 1,
                data: false
            }
        }
        const deleted = await prisma.voucher.update({
            where: { id },
            data: { status: 0 },
        });
        return {
            message: "Xóa mã khuyến mãi thành công!",
            code: 0,
            data: deleted
        }
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi xóa mã khuyến mãi!",
            code: -1,
            data: false
        }
    }
};

/** Quản lý danh mục */
const getAllCategories = async (page: number, limit: number, search: string): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;

        const allCategories = await prisma.categories.findMany({
            where: { status: 1 },
            select: {
                id: true,
                name: true,
                parentId: true,
                parent: { select: { id: true, name: true } },
                _count: { select: { products: true } }
            }
        });

        const categoryChildrenMap = new Map<number | null, number[]>();
        for (const cat of allCategories) {
            const children = categoryChildrenMap.get(cat.parentId) || [];
            children.push(cat.id);
            categoryChildrenMap.set(cat.parentId, children);
        }

        function countTotalProducts(categoryId: number): number {
            const cat = allCategories.find((c) => c.id === categoryId);
            let total = cat?._count.products || 0;
            const children = categoryChildrenMap.get(categoryId) || [];
            for (const childId of children) total += countTotalProducts(childId);
            return total;
        }

        const where: any = {
            status: 1,
            ...(search && {
                OR: [
                    { name: { contains: search.trim(), mode: "insensitive" } },
                    { parent: { name: { contains: search.trim(), mode: "insensitive" } } }
                ],
            })
        };

        const categories = await prisma.categories.findMany({
            where,
            orderBy: { id: 'asc' },
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                parent: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        const results = categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            parent: c.parent,
            totalProducts: countTotalProducts(c.id),
        }));

        const total = await prisma.categories.count({ where });

        return {
            message: "Lấy danh sách danh mục hàng thành công!",
            code: 0,
            data: { categories: results, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách danh mục hàng!",
            code: -1,
            data: false
        };
    }
};

const createCategory = async (data: Category): Promise<ReturnData> => {
    try {
        const category = await prisma.categories.create({
            data: {
                name: data.name,
                parentId: Number(data.parentId),
                status: 1,
            }
        });

        return {
            code: 0,
            message: "Tạo danh mục hàng thành công!",
            data: category,
        };
    } catch (e) {
        console.log(e);
        return {
            code: -1,
            message: "Lỗi server khi tạo danh mục hàng!",
            data: false,
        };
    }
};

const updateCategory = async (id: number, data: Category): Promise<ReturnData> => {
    try {
        const category = await prisma.categories.findUnique({ where: { id: Number(id) }});
        if (!category) {
            return {
                message: "Không tìm thấy danh mục hàng!",
                code: 1,
                data: false
            }
        }

        const update = await prisma.categories.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                parentId: Number(data.parentId)
            }
        });
        
        return {
            message: "Cập nhật danh mục hàng thành công!",
            code: 0,
            data: update
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi cập nhật danh mục hàng!",
            code: -1,
            data: false
        };
    }
};

const deleteCategory = async (id: number): Promise<ReturnData> => {
    try {
        const category = await prisma.categories.findUnique({ where: { id: Number(id) } });
        if (!category) {
            return {
                message: "Không tìm thấy mã khuyến mãi!",
                code: 1,
                data: false
            }
        }
        const deleted = await prisma.categories.update({
            where: { id },
            data: { status: 0 },
        });
        return {
            message: "Xóa danh mục hàng thành công!",
            code: 0,
            data: deleted
        }
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi xóa danh mục hàng!",
            code: -1,
            data: false
        }
    }
};

/** Quản lý phản hồi */
const getAllFeedbacks = async (page: number, limit: number, search: string, star: number, fromDate: string, toDate: string): Promise<ReturnData> => {
    try {
        const skip = (page - 1) * limit;

        const where: any = {
            status: 1,
            ...(star != null && { rating: star }),
            ...(fromDate && toDate && {
                feeedbackDate: {
                    gte: new Date(fromDate),
                    lte: new Date(toDate),
                }
            }),
            ...(search && {
                OR: [
                    { account: { fullName: { contains: search.trim(), mode: "insensitive" } } },
                    { productVariant: { product: { name: { contains: search.trim(), mode: "insensitive" } } } }
                ]
            })
        };

        const feedbacks = await prisma.feedback.findMany({
            where,
            orderBy: { feeedbackDate: 'desc' },
            skip,
            take: limit,
            include: {
                account: { select: { fullName: true }},
                productVariant: { 
                    select: {
                        color: true,
                        size: true,
                        product: { select: { name: true }}
                    }
                }
            }
        });

        const total = await prisma.feedback.count({ where });

        return {
            message: "Lấy danh sách phản hồi thành công!",
            code: 0,
            data: { feedbacks, total }
        };
    } catch (e) {
        console.log(e);
        return {
            message: "Lỗi khi lấy danh sách phản hồi!",
            code: -1,
            data: false
        };
    }
};

export default {
    getRecentOrders, getSalesData, getCategoriesSale, 
    getAllProducts, getProductById, getProductCategories, createProduct, updateProduct, deleteProduct,
    getProdctDetail, getAllVariants, getVariantById, createVariant, updateVariant, deleteVariant,
    getStatus, getAllOrders, getBill, getOrderHistories, updateStatus,
    getAllCustomers, getCustomerDetail, getCustomerOrders,
    getAllPromotions, getPromotionProducts, getPromotionById, getProductsByCategory, createPromotion, updatePromotion, deletePromotion,
    getAllVouchers, getVoucherDetail, getVoucherById, getVoucherCategories, createVoucher, updateVoucher, deleteVoucher,
    getAllCategories, createCategory, updateCategory, deleteCategory, getAllFeedbacks
}
