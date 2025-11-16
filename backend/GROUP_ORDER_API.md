# Group Order API Documentation

## Overview

The Group Order feature allows multiple users to collaborate on a single order. One user creates a group order, shares a code with others, and everyone can add items. The creator then places the entire order and pays for everyone.

## Base URL

All group order endpoints are under `/api/group-orders/`

## Endpoints

### 1. Create Group Order

**POST** `/api/group-orders/`

Creates a new group order and automatically adds the creator as the first member.

**Authentication Required:** Yes

**Response:**

```json
{
  "id": 1,
  "creator": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  },
  "code": "ABC12345",
  "status": "PENDING",
  "created_at": "2024-11-16T10:00:00Z",
  "updated_at": "2024-11-16T10:00:00Z",
  "members": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "username": "john"
      },
      "joined_at": "2024-11-16T10:00:00Z"
    }
  ],
  "items": [],
  "total_items": 0
}
```

### 2. Join Group Order

**POST** `/api/group-orders/join/`

Join an existing group order using the code.

**Authentication Required:** Yes

**Request Body:**

```json
{
  "code": "ABC12345"
}
```

**Response:**

```json
{
  "message": "Successfully joined group order",
  "group_order": {
    // Group order details
  }
}
```

**Error Cases:**

- Code not found (404)
- Group order already placed (400)
- Already a member (400)

### 3. Get Group Order Details

**GET** `/api/group-orders/{id}/`

Get details of a specific group order including all members and items.

**Authentication Required:** Yes (must be a member)

**Response:** Same structure as Create Group Order

### 4. List Group Members

**GET** `/api/group-orders/{id}/members/`

List all members in the group order.

**Authentication Required:** Yes (must be a member)

**Response:**

```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "username": "john",
      "email": "john@example.com"
    },
    "joined_at": "2024-11-16T10:00:00Z"
  }
]
```

### 5. Add Item to Group Order

**POST** `/api/group-orders/{id}/items/`

Add a product to the group order.

**Authentication Required:** Yes (must be a member)

**Request Body:**

```json
{
  "product_id": 5,
  "quantity": 2
}
```

**Response:**

```json
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "john"
  },
  "product": {
    "id": 5,
    "name": "Burger"
  },
  "product_name": "Burger",
  "unit_price": "5.99",
  "quantity": 2,
  "line_total": "11.98",
  "created_at": "2024-11-16T10:05:00Z"
}
```

**Error Cases:**

- Group order already placed (400)
- Not a member (403)
- Product not found (404)
- Product not available (400)

### 6. List Group Order Items

**GET** `/api/group-orders/{id}/items/`

List all items in the group order.

**Authentication Required:** Yes (must be a member)

**Response:**

```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "username": "john"
    },
    "product": {
      "id": 5,
      "name": "Burger"
    },
    "product_name": "Burger",
    "unit_price": "5.99",
    "quantity": 2,
    "line_total": "11.98",
    "created_at": "2024-11-16T10:05:00Z"
  }
]
```

### 7. Update Group Order Item

**PATCH** `/api/group-orders/{id}/items/{item_id}/`

Update the quantity of an item (only by the user who added it).

**Authentication Required:** Yes (must be item owner)

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response:** Updated item details

**Error Cases:**

- Group order already placed (400)
- Not the item owner (404)

### 8. Delete Group Order Item

**DELETE** `/api/group-orders/{id}/items/{item_id}/`

Remove an item from the group order (soft delete - only by the user who added it).

**Authentication Required:** Yes (must be item owner)

**Response:**

```json
{
  "message": "Item removed successfully"
}
```

**Error Cases:**

- Group order already placed (400)
- Not the item owner (404)

### 9. Place Group Order

**POST** `/api/group-orders/{id}/place/`

Creator places the group order, converting it to a regular order. This creates an Order with status='PAID' and payment_status='SUCCEEDED'. All group order items are copied to order items.

**Authentication Required:** Yes (must be creator)

**Request Body:**

```json
{
  "address_id": 1,
  "payment_method": "CASH",
  "type": "DELIVERY",
  "delivery_fee": "2.00",
  "discount": "1.00"
}
```

**Response:**

```json
{
  "message": "Group order placed successfully",
  "order": {
    "id": 10,
    "user": {
      "id": 1,
      "username": "john"
    },
    "restaurant_id": 1,
    "type": "DELIVERY",
    "group_order_id": 1,
    "subtotal": "25.50",
    "delivery_fee": "2.00",
    "discount": "1.00",
    "total": "26.50",
    "status": "PAID",
    "payment_method": "CASH",
    "payment_status": "SUCCEEDED",
    "items": [
      // All group order items
    ],
    "created_at": "2024-11-16T10:30:00Z"
  }
}
```

**Error Cases:**

- Not the creator (403)
- Group order already placed (400)
- No items in group order (400)
- Address not found or not active (404)

## Business Rules

1. **Group Order Status Flow:**

   - Created: `PENDING`
   - After placing: `PAID`

2. **Membership:**

   - Cannot leave a group once joined
   - No time limit on group orders
   - Members can only add/edit/delete their own items

3. **Item Management:**

   - Items can only be added/edited/deleted when status is `PENDING`
   - Items are soft-deleted (is_active flag)
   - Items stay in database for history after order is placed

4. **Placing Order:**

   - Only creator can place the order
   - Creator pays for the entire group
   - Creates a regular Order with status='PAID'
   - Group order status changes to 'PAID'
   - All active group order items are copied to order items

5. **Permissions:**
   - Must be a member to view group details, add items, or see items
   - Must be item owner to edit or delete items
   - Must be creator to place the order

## Testing Checklist

- [ ] Create a group order → Verify code is generated and unique
- [ ] Join group order with valid code → Verify member is added
- [ ] Try to join with invalid code → Verify 404 error
- [ ] Try to join again → Verify "already a member" error
- [ ] Add items as different users → Verify items are tracked per user
- [ ] Try to add unavailable product → Verify error
- [ ] Update own item → Verify quantity and line_total update
- [ ] Try to update someone else's item → Verify 404 error
- [ ] Delete own item → Verify soft delete (is_active=False)
- [ ] View items list → Verify only active items shown
- [ ] Place order as creator → Verify Order is created with correct totals
- [ ] Verify group order status changed to PAID
- [ ] Try to add items after placing → Verify "already placed" error
- [ ] Try to place order as non-creator → Verify 403 error

## Example Flow

```bash
# User 1: Create group order
POST /api/group-orders/
# Returns: code="ABC12345"

# User 1: Add item
POST /api/group-orders/1/items/
{
  "product_id": 5,
  "quantity": 2
}

# User 2: Join group
POST /api/group-orders/join/
{
  "code": "ABC12345"
}

# User 2: Add item
POST /api/group-orders/1/items/
{
  "product_id": 7,
  "quantity": 1
}

# User 1: View all items
GET /api/group-orders/1/items/
# Returns items from both users

# User 2: Update their item
PATCH /api/group-orders/1/items/2/
{
  "quantity": 3
}

# User 1: Place order (creator pays for everyone)
POST /api/group-orders/1/place/
{
  "address_id": 1,
  "payment_method": "CASH",
  "type": "DELIVERY",
  "delivery_fee": "2.00",
  "discount": "0.00"
}
# Returns: Regular Order with status='PAID', payment_status='SUCCEEDED'
```

## Database Schema

### group_orders

- id (PK)
- creator_id (FK to users)
- restaurant_id (default: 1)
- code (unique, 8 characters)
- status (PENDING → PAID)
- created_at
- updated_at

### group_order_members

- id (PK)
- group_order_id (FK to group_orders)
- user_id (FK to users)
- joined_at
- UNIQUE(group_order_id, user_id)

### group_order_items

- id (PK)
- group_order_id (FK to group_orders)
- user_id (FK to users - who added this item)
- product_id (FK to products)
- product_name (snapshot)
- unit_price (snapshot)
- quantity
- line_total
- is_active (for soft delete)
- created_at
- updated_at
- deleted_at
