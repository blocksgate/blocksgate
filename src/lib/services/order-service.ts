export interface Order {
  id: string;
  userId: string;
  market: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  type: "MARKET" | "LIMIT";
  status: "PENDING" | "FILLED" | "CANCELLED";
  timestamp: Date;
}

export interface OrderRequest {
  userId: string;
  market: string;
  side: "buy" | "sell";
  size: number;
  price: number;
  type: "MARKET" | "LIMIT";
}

export class OrderService {
  private orders: Map<string, Order> = new Map();
  private orderIdCounter = 1;

  async placeOrder(request: OrderRequest): Promise<Order> {
    const order: Order = {
      id: this.generateOrderId(),
      ...request,
      status: "PENDING",
      timestamp: new Date()
    };

    this.orders.set(order.id, order);
    await this.processOrder(order);

    return order;
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (order && order.status === "PENDING") {
      order.status = "CANCELLED";
      return true;
    }
    return false;
  }

  private generateOrderId(): string {
    return `ORDER_${this.orderIdCounter++}`;
  }

  private async processOrder(order: Order): Promise<void> {
    // Simulate order processing
    setTimeout(() => {
      order.status = "FILLED";
    }, 100);
  }
}