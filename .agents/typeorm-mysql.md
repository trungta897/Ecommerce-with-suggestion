---
description: "Best practices for TypeORM with MySQL in NestJS backend"
globs: "backend/**/*.ts"
---

# TypeORM + MySQL Best Practices — NestJS Backend

## Entity Design

- Define entities in `backend/src/modules/<module>/entities/`.
- Use decorators: `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()`, `@CreateDateColumn()`, `@UpdateDateColumn()`.
- Use `uuid` for primary keys when appropriate, or auto-increment for simpler cases.
- Define relations explicitly: `@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinColumn`, `@JoinTable`.
- Use `enum` columns for status fields (e.g., OrderStatus, PaymentStatus).

### Example Entity

```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Repository Pattern

- Use TypeORM's Repository pattern via `@InjectRepository()` in services.
- Use `Repository<Entity>` for simple CRUD operations.
- Use QueryBuilder for complex queries with joins, aggregations, and subqueries.
- Never write raw SQL unless absolutely necessary — use QueryBuilder instead.

## Query Optimization

- **Select only needed fields:** Use `.select()` to avoid loading unnecessary columns.
- **Eager vs Lazy loading:** Prefer explicit `relations` option over eager loading to control query performance.
- **Pagination:** Always paginate list queries. Use `skip` and `take` for offset-based pagination.
- **Indexes:** Add `@Index()` on columns used in WHERE, JOIN, and ORDER BY clauses.
- **N+1 Problem:** Use `leftJoinAndSelect` or `relations` option to load related entities in a single query.

```typescript
// Good: Single query with join
const products = await this.productRepo.find({
  relations: ['category', 'reviews'],
  where: { category: { id: categoryId } },
  take: 20,
  skip: (page - 1) * 20,
  order: { createdAt: 'DESC' },
});

// Bad: N+1 queries
const products = await this.productRepo.find();
for (const p of products) {
  p.reviews = await this.reviewRepo.find({ where: { productId: p.id } });
}
```

## Migrations

- Use TypeORM CLI for migrations: `npx typeorm migration:generate` and `npx typeorm migration:run`.
- Never modify production database schema manually.
- Name migrations descriptively: `CreateProductsTable`, `AddStockColumnToProducts`.
- Keep migrations small and focused — one migration per schema change.

## MySQL-Specific

- Use `utf8mb4` charset for full Unicode support (emoji, Vietnamese characters).
- Use `InnoDB` engine (default) for transaction support.
- Column types: `VARCHAR` for short strings, `TEXT` for long content, `DECIMAL` for prices, `DATETIME` for timestamps.
- Use `ENUM` type for status fields with limited values.

## Transactions

- Use `DataSource.transaction()` or `QueryRunner` for operations that must be atomic.
- Always wrap order creation + payment + stock update in a transaction.

```typescript
await this.dataSource.transaction(async (manager) => {
  const order = manager.create(Order, orderData);
  await manager.save(order);
  await manager.decrement(Product, { id: productId }, 'stock', quantity);
});
```

## Connection & Performance

- Use connection pooling (TypeORM default with MySQL).
- Set appropriate pool size in `TypeOrmModule.forRoot()` config.
- Use Redis for caching frequently accessed data (recommendations, popular products).
- Monitor slow queries in development with `logging: true` in TypeORM config.
