import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).parent / "qpilot_dev.db"


def create_database():
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.executescript("""
        DROP TABLE IF EXISTS order_items;
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS categories;
        DROP TABLE IF EXISTS customers;

        CREATE TABLE customers (
            customer_id INTEGER PRIMARY KEY,
            customer_name TEXT NOT NULL,
            country TEXT NOT NULL,
            signup_date TEXT NOT NULL
        );

        CREATE TABLE categories (
            category_id INTEGER PRIMARY KEY,
            category_name TEXT NOT NULL
        );

        CREATE TABLE products (
            product_id INTEGER PRIMARY KEY,
            product_name TEXT NOT NULL,
            category_id INTEGER NOT NULL,
            price REAL NOT NULL,
            discontinued INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories(category_id)
        );

        CREATE TABLE orders (
            order_id INTEGER PRIMARY KEY,
            customer_id INTEGER NOT NULL,
            order_date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        );

        CREATE TABLE order_items (
            order_item_id INTEGER PRIMARY KEY,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id)
        );
    """)

    cursor.executemany(
        "INSERT INTO customers VALUES (?, ?, ?, ?)",
        [
            (1, "Aarav Sharma", "India", "2025-01-15"),
            (2, "Emma Wilson", "UK", "2025-02-20"),
            (3, "Liam Brown", "USA", "2025-03-05"),
            (4, "Sophia Garcia", "USA", "2025-03-18"),
            (5, "Noah Martin", "France", "2025-04-10"),
            (6, "Olivia Taylor", "UK", "2025-05-22"),
            (7, "Arjun Mehta", "India", "2025-06-01"),
            (8, "Mia Anderson", "Canada", "2025-06-15"),
        ],
    )

    cursor.executemany(
        "INSERT INTO categories VALUES (?, ?)",
        [
            (1, "Electronics"),
            (2, "Home & Kitchen"),
            (3, "Books"),
            (4, "Sports"),
        ],
    )

    cursor.executemany(
        "INSERT INTO products VALUES (?, ?, ?, ?, ?)",
        [
            (1, "Wireless Headphones", 1, 80.00, 0),
            (2, "Mechanical Keyboard", 1, 120.00, 0),
            (3, "Smart Watch", 1, 200.00, 0),
            (4, "Coffee Maker", 2, 90.00, 0),
            (5, "Air Fryer", 2, 150.00, 0),
            (6, "Python Programming", 3, 45.00, 0),
            (7, "Data Science Handbook", 3, 60.00, 0),
            (8, "Running Shoes", 4, 110.00, 0),
            (9, "Yoga Mat", 4, 35.00, 0),
            (10, "Old Fitness Tracker", 4, 70.00, 1),
        ],
    )

    cursor.executemany(
        "INSERT INTO orders VALUES (?, ?, ?, ?)",
        [
            (101, 1, "2025-07-03", "completed"),
            (102, 2, "2025-07-10", "completed"),
            (103, 1, "2025-08-12", "completed"),
            (104, 3, "2025-08-20", "completed"),
            (105, 4, "2025-09-05", "completed"),
            (106, 5, "2025-09-15", "cancelled"),
            (107, 6, "2025-10-01", "completed"),
            (108, 7, "2025-10-12", "completed"),
            (109, 3, "2025-10-20", "completed"),
            (110, 8, "2025-11-02", "completed"),
            (111, 1, "2025-11-18", "completed"),
            (112, 2, "2025-12-01", "completed"),
        ],
    )

    cursor.executemany(
        "INSERT INTO order_items VALUES (?, ?, ?, ?, ?)",
        [
            (1, 101, 1, 2, 80.00),
            (2, 101, 6, 1, 45.00),
            (3, 102, 2, 1, 120.00),
            (4, 102, 4, 2, 90.00),
            (5, 103, 3, 1, 200.00),
            (6, 103, 7, 1, 60.00),
            (7, 104, 8, 1, 110.00),
            (8, 104, 9, 2, 35.00),
            (9, 105, 5, 1, 150.00),
            (10, 105, 1, 1, 80.00),
            (11, 106, 10, 1, 70.00),
            (12, 107, 6, 2, 45.00),
            (13, 107, 3, 1, 200.00),
            (14, 108, 2, 2, 120.00),
            (15, 108, 9, 1, 35.00),
            (16, 109, 1, 1, 80.00),
            (17, 109, 8, 1, 110.00),
            (18, 110, 4, 1, 90.00),
            (19, 110, 7, 2, 60.00),
            (20, 111, 3, 1, 200.00),
            (21, 111, 5, 1, 150.00),
            (22, 112, 6, 1, 45.00),
            (23, 112, 1, 2, 80.00),
        ],
    )

    connection.commit()
    connection.close()

    print(f"Database created successfully: {DB_PATH}")


if __name__ == "__main__":
    create_database()