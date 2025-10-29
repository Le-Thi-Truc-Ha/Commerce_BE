import { prisma, ReturnData, OrderDash, SalesDataDash, CategoryDash, Product, Media } from "../interfaces/admin.interface";

/** Dashboard */
const getRecentOrders = async (): Promise<ReturnData> => {
    try {
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { orderDate: "desc"},
            include: { account: { select: { fullName: true }} },
        });

        const data: OrderDash[] = orders.map((o: OrderDash) => ({
            id: o.id,
            accountName: o.account?.fullName ?? "",
            total: o.total,
            orderDate: o.orderDate.toString(),
            currentStatus: o.currentStatus ?? 0,
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

        const data: SalesDataDash[] = result.map((r: SalesDataDash) => ({
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
                c."name" AS name,
                COALESCE(SUM(od."quantity"), 0) AS value
            FROM "Categories" c
            LEFT JOIN "Product" p ON c."id" = p."categoryId"
            LEFT JOIN "ProductVariant" pv ON p."id" = pv."productId"
            LEFT JOIN "OrderDetail" od ON pv."id" = od."productVariantId"
            GROUP BY c."id"
            ORDER BY value DESC;
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

        const result = products.map((p: Product) => {
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
                    } : undefined
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
                    neckline: normalizeStr(data.features.neckline || "unknown"),
                    sleeve: normalizeStr(data.features.sleeve || "unknown"),
                    pantLength: normalizeStr(data.features.pantLength || "unknown"),
                    pantShape: normalizeStr(data.features.pantShape || "unknown"),
                    dressLength: normalizeStr(data.features.dressLength || "unknown"),
                    dressShape: normalizeStr(data.features.dressShape || "unknown"),
                    skirtLength: normalizeStr(data.features.skirtLength || "unknown"),
                    skirtShape: normalizeStr(data.features.skirtShape || "unknown"),
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

export default {
    getRecentOrders, getSalesData, getCategoriesSale, 
    getAllProducts, getProductById, getProductCategories, createProduct, updateProduct, deleteProduct,
}
