# MongoDB Setup & Optimization Guide

## Database Connection Setup

1. **Set your MongoDB connection string in `.env.local`:**
   ```
   MONGODB_URI=mongodb://localhost:27017/vedika_organics
   # For MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vedika_organics?retryWrites=true&w=majority
   ```

2. **Required Collections:**
   - `addresses`
   - `offers`
   - `orders`
   - `products`
   - `productvariants`
   - `reviews`
   - `rewards`
   - `session`
   - `staffs`
   - `users`

## Database Indexes for Optimal Performance

Run these commands in your MongoDB shell or via MongoDB Compass:

```javascript
// Orders collection indexes
db.orders.createIndex({ "createdAt": -1 })
db.orders.createIndex({ "orderStatus": 1, "createdAt": -1 })
db.orders.createIndex({ "userId": 1 })
db.orders.createIndex({ "utmParams.utm_source": 1, "utmParams.utm_medium": 1 })

// Users collection indexes
db.users.createIndex({ "createdAt": -1 })
db.users.createIndex({ "phoneNumber": 1 }, { unique: true })
db.users.createIndex({ "phoneNumberVerified": 1 })

// Reviews collection indexes
db.reviews.createIndex({ "createdAt": -1 })
db.reviews.createIndex({ "isApproved": 1, "createdAt": -1 })
db.reviews.createIndex({ "productId": 1 })
db.reviews.createIndex({ "userId": 1 })

// Products collection indexes
db.products.createIndex({ "id": 1 }, { unique: true })
db.products.createIndex({ "updatedAt": -1 })

// Product variants collection indexes
db.productvariants.createIndex({ "productId": 1 })
db.productvariants.createIndex({ "id": 1 }, { unique: true })

// Offers collection indexes
db.offers.createIndex({ "id": 1 }, { unique: true })
db.offers.createIndex({ "isUserOffer": 1 })

// Staff collection indexes
db.staffs.createIndex({ "email": 1 }, { unique: true })
db.staffs.createIndex({ "isActive": 1 })
```

## Performance Optimization

### Connection Pool Settings
The MongoDB connection is optimized with:
- **maxPoolSize**: 10 connections
- **serverSelectionTimeoutMS**: 5 seconds
- **socketTimeoutMS**: 45 seconds

### Caching Strategy
- **Dashboard data**: 5 minutes cache
- **Orders**: 2 minutes cache
- **Products**: 10 minutes cache
- **Reviews**: 3 minutes cache
- **Offers**: 10 minutes cache
- **Campaigns**: 8 minutes cache
- **Staff**: 15 minutes cache

### Query Optimization Tips

1. **Use aggregation pipelines** for complex queries instead of multiple find operations
2. **Limit results** with pagination to avoid loading large datasets
3. **Project only needed fields** to reduce network transfer
4. **Use compound indexes** for queries with multiple filters

### Sample Data Import

If you need to import sample data, use the structure from `mongo_schema.json`:

```bash
# Import sample data (replace with your actual data files)
mongoimport --db vedika_organics --collection orders --file orders.json --jsonArray
mongoimport --db vedika_organics --collection users --file users.json --jsonArray
mongoimport --db vedika_organics --collection products --file products.json --jsonArray
# ... repeat for all collections
```

## API Endpoints

All endpoints are now available at:
- `GET /api/dashboard` - Overview metrics
- `GET /api/orders?page=1&limit=50&status=PENDING` - Orders with pagination
- `GET /api/products` - Products with variants and reviews
- `GET /api/users?page=1&limit=50` - Users with analytics
- `GET /api/reviews?page=1&limit=50&approved=true` - Reviews with moderation
- `GET /api/offers` - Offers with usage statistics
- `GET /api/campaigns` - UTM campaign analytics
- `GET /api/staff` - Staff management

## Monitoring

Use these queries to monitor your database performance:

```javascript
// Check collection sizes
db.stats()

// Monitor slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()

// Check index usage
db.orders.getIndexes()
db.orders.aggregate([{ $indexStats: {} }])
```

## Troubleshooting

**Connection issues:**
- Verify MongoDB is running
- Check firewall settings
- Ensure connection string is correct

**Slow queries:**
- Check if proper indexes are created
- Use `explain()` to analyze query performance
- Consider adding compound indexes for complex queries

**Memory issues:**
- Implement pagination for large datasets
- Use projection to limit returned fields
- Monitor connection pool usage