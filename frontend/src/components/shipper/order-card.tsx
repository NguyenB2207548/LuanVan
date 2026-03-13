import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone } from "lucide-react";

export function ShipperOrderCard({ order }: any) {
  return (
    <Card className="mb-4 overflow-hidden border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm text-muted-foreground">
            Mã: {order.orderNumber}
          </CardTitle>
          <span className="text-sm font-bold text-blue-600">
            {order.totalAmount.toLocaleString()}đ
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <p className="line-clamp-2">{order.shippingAddress}</p>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <p>{order.phoneNumber}</p>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 p-3">
        <Button className="w-full bg-blue-600 hover:bg-blue-700">
          Nhận giao đơn này
        </Button>
      </CardFooter>
    </Card>
  );
}
