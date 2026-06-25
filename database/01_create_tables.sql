USE ShopDB;
GO

-- =========================================
-- Users: anyone in the system (can buy, sell, or both)
-- =========================================
CREATE TABLE Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

-- =========================================
-- Addresses: a user can have multiple addresses
-- =========================================
CREATE TABLE Addresses (
    AddressId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Line1 NVARCHAR(100) NOT NULL,
    Line2 NVARCHAR(100) NULL,
    City NVARCHAR(50) NOT NULL,
    County NVARCHAR(50) NULL,
    PostalCode NVARCHAR(20) NULL,
    Country NVARCHAR(50) NOT NULL,
    AddressType NVARCHAR(20) NOT NULL DEFAULT 'Home',  -- Home, Shipping, Billing
    CONSTRAINT FK_Addresses_Users FOREIGN KEY (UserId)
        REFERENCES Users(UserId)
        ON DELETE CASCADE
);
GO

-- =========================================
-- Products: each product is listed by a user (the seller)
-- =========================================
CREATE TABLE Products (
    ProductId INT IDENTITY(1,1) PRIMARY KEY,
    SellerId INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0),
    StockQuantity INT NOT NULL DEFAULT 0 CHECK (StockQuantity >= 0),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Products_Seller FOREIGN KEY (SellerId)
        REFERENCES Users(UserId)
);
GO

-- =========================================
-- Orders: a user (the buyer) places an order
-- =========================================
CREATE TABLE Orders (
    OrderId INT IDENTITY(1,1) PRIMARY KEY,
    BuyerId INT NOT NULL,
    OrderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',  -- Pending, Paid, Shipped, Delivered, Cancelled
    ShippingAddressId INT NULL,
    CONSTRAINT FK_Orders_Buyer FOREIGN KEY (BuyerId)
        REFERENCES Users(UserId),
    CONSTRAINT FK_Orders_Address FOREIGN KEY (ShippingAddressId)
        REFERENCES Addresses(AddressId)
);
GO

-- =========================================
-- OrderItems: line items on an order (an order can contain multiple products)
-- =========================================
CREATE TABLE OrderItems (
    OrderItemId INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    ProductId INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    PriceAtPurchase DECIMAL(10, 2) NOT NULL,  -- snapshot of price when ordered
    CONSTRAINT FK_OrderItems_Order FOREIGN KEY (OrderId)
        REFERENCES Orders(OrderId)
        ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Product FOREIGN KEY (ProductId)
        REFERENCES Products(ProductId)
);
GO

-- RefreshTokens: tracks active refresh tokens (hashed) for sessions
CREATE TABLE RefreshTokens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    TokenHash NVARCHAR(255) NOT NULL UNIQUE,
    ExpiresAt DATETIME2 NOT NULL,
    RevokedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId)
        REFERENCES Users(UserId)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_RefreshTokens_TokenHash ON RefreshTokens(TokenHash);
GO

CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
GO