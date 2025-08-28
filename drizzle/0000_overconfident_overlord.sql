CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address_id" varchar(255),
	"user_id" uuid NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"mobile_number" varchar(20),
	"alternate_mobile_number" varchar(20),
	"email" varchar(255),
	"address_line1" text,
	"address_line2" text,
	"landmark" varchar(255),
	"pincode" varchar(10),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "addresses_address_id_unique" UNIQUE("address_id")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"discount" numeric(5, 2) NOT NULL,
	"is_user_offer" boolean DEFAULT false,
	"trigger_price" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "offers_offer_id_unique" UNIQUE("offer_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" varchar(255) NOT NULL,
	"product_id" varchar(255),
	"title" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(50),
	"size" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"offer_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"discount" numeric(5, 2) NOT NULL,
	"type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(255) NOT NULL,
	"user_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'INR',
	"order_status" varchar(20),
	"payment_status" varchar(20),
	"delivery_status" varchar(20),
	"time" timestamp with time zone,
	"cash_on_delivery" boolean DEFAULT false,
	"rewards" integer DEFAULT 0,
	"address_first_name" varchar(100),
	"address_last_name" varchar(100),
	"address_mobile_number" varchar(20),
	"address_alternate_mobile_number" varchar(20),
	"address_email" varchar(255),
	"address_line1" text,
	"address_line2" text,
	"address_landmark" varchar(255),
	"address_pincode" varchar(10),
	"address_city" varchar(100),
	"address_state" varchar(100),
	"address_country" varchar(100),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_term" varchar(255),
	"utm_content" varchar(255),
	"razorpay_order_id" varchar(255),
	"razorpay_receipt" varchar(255),
	"razorpay_status" varchar(50),
	"razorpay_payments" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "order_status_check" CHECK ("orders"."order_status" IN ('CONFIRMED', 'PENDING', 'DELIVERED', 'CANCELLED')),
	CONSTRAINT "payment_status_check" CHECK ("orders"."payment_status" IN ('PAID', 'PENDING', 'FAILED', 'CASH_ON_DELIVERY')),
	CONSTRAINT "delivery_status_check" CHECK ("orders"."delivery_status" IN ('PENDING', 'PREPARING', 'DISPATCHED', 'DELIVERED', 'CANCELLED'))
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variant_id" varchar(255) NOT NULL,
	"product_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"unit" varchar(50),
	"size" numeric(10, 2),
	"price" numeric(10, 2) NOT NULL,
	"mrp" numeric(10, 2),
	"cover_image" text,
	"cart_image" text,
	"other_images" text[] DEFAULT '{}',
	"variant_order" integer DEFAULT 0,
	"label" varchar(100),
	"type" varchar(100),
	"is_active" boolean DEFAULT true,
	"stock_quantity" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "product_variants_variant_id_unique" UNIQUE("variant_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"color_hex" varchar(7),
	"bullet_points" jsonb DEFAULT '[]',
	"main_variant" varchar(255),
	"sections" jsonb DEFAULT '[]',
	"badges" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "review_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" uuid,
	"author" varchar(255),
	"text" text NOT NULL,
	"is_staff_reply" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" varchar(255),
	"product_id" uuid NOT NULL,
	"user_id" uuid,
	"author" varchar(255) NOT NULL,
	"rating" integer NOT NULL,
	"text" text,
	"photos" text[] DEFAULT '{}',
	"is_approved" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "reviews_review_id_unique" UNIQUE("review_id"),
	CONSTRAINT "rating_check" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reward_id" varchar(255),
	"user_id" uuid NOT NULL,
	"reward_unit" varchar(50),
	"reward_value" numeric(10, 2),
	"source_type" varchar(50),
	"source_id" varchar(255),
	"claim_type" varchar(50),
	"claim_id" varchar(255),
	"is_claimed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "rewards_reward_id_unique" UNIQUE("reward_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(255),
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_session_id_unique" UNIQUE("session_id"),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"full_name" varchar(255),
	"role" varchar(50),
	"permissions" jsonb DEFAULT '[]',
	"is_active" boolean DEFAULT true,
	"last_login" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_staff_id_unique" UNIQUE("staff_id"),
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"phone_number_verified" boolean DEFAULT false,
	"email" varchar(255),
	"name" varchar(255),
	"avatar" text,
	"offers" text[] DEFAULT '{}',
	"no_of_orders" integer DEFAULT 0,
	"notes" text,
	"last_ordered_on" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_offers" ADD CONSTRAINT "order_offers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_addresses_user_id" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_default" ON "addresses" USING btree ("user_id","is_default");--> statement-breakpoint
CREATE INDEX "idx_offers_offer_id" ON "offers" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "idx_offers_is_active" ON "offers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_offers_is_user_offer" ON "offers" USING btree ("is_user_offer");--> statement-breakpoint
CREATE INDEX "idx_offers_validity" ON "offers" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_variant_id" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_offers_order_id" ON "order_offers" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_offers_offer_id" ON "order_offers" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_order_id" ON "orders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status_combo" ON "orders" USING btree ("order_status","payment_status","delivery_status");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_payment_status" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_orders_utm_campaign" ON "orders" USING btree ("utm_campaign");--> statement-breakpoint
CREATE INDEX "idx_orders_razorpay_order_id" ON "orders" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_pincode" ON "orders" USING btree ("address_pincode");--> statement-breakpoint
CREATE INDEX "idx_variants_variant_id" ON "product_variants" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_variants_product_id" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variants_price" ON "product_variants" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_variants_is_active" ON "product_variants" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_variants_stock" ON "product_variants" USING btree ("stock_quantity");--> statement-breakpoint
CREATE INDEX "idx_products_product_id" ON "products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_products_tags" ON "products" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_products_is_active" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_review_replies_review_id" ON "review_replies" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "idx_review_replies_created_at" ON "review_replies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_product_id" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_user_id" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_is_approved" ON "reviews" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_reviews_created_at" ON "reviews" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_rewards_user_id" ON "rewards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_rewards_is_claimed" ON "rewards" USING btree ("is_claimed");--> statement-breakpoint
CREATE INDEX "idx_rewards_source_type" ON "rewards" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "idx_rewards_source_id" ON "rewards" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_staff_email" ON "staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_staff_is_active" ON "staff" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_staff_role" ON "staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_phone_number" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_user_id" ON "users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_phone_verified" ON "users" USING btree ("phone_number_verified");