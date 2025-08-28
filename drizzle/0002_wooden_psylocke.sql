ALTER TABLE "orders" DROP CONSTRAINT "payment_status_check";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "delivery_status_check";--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "discount" SET DATA TYPE numeric(7, 2);--> statement-breakpoint
ALTER TABLE "order_offers" ALTER COLUMN "discount" SET DATA TYPE numeric(7, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "payment_status_check" CHECK ("orders"."payment_status" IN ('CREATED', 'ATTEMPTED', 'PAID', 'PENDING', 'FAILED', 'CASH_ON_DELIVERY'));--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "delivery_status_check" CHECK ("orders"."delivery_status" IN ('PENDING', 'PREPARING', 'PREPARING_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'));