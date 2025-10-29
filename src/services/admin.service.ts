import { prisma, ReturnData, OrderDash, SalesDataDash, CategoryDash } from "../interfaces/admin.interface";

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

export default {
    getRecentOrders, getSalesData, getCategoriesSale, 
}
