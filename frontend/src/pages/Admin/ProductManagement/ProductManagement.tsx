import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Switch,
  Upload,
  message,
  Tag,
  Popconfirm,
  Image,
  Typography,
  InputNumber,
  Pagination,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import styles from "./ProductManagement.module.css";

const { Title } = Typography;
const { TextArea } = Input;
const { Search } = Input;

// Mock data
const mockCategories = [
  { id: 1, name: "Pizza", slug_name: "pizza", is_active: true },
  { id: 2, name: "Burger", slug_name: "burger", is_active: true },
  { id: 3, name: "Pasta", slug_name: "pasta", is_active: true },
  { id: 4, name: "Drinks", slug_name: "drinks", is_active: true },
  { id: 5, name: "Dessert", slug_name: "dessert", is_active: true },
];

const mockProducts = [
  {
    id: 1,
    name: "Margherita Pizza",
    description: "Phô mai mozzarella, cà chua, húng quế tươi", // Giữ nguyên - Mock Data
    price: 189000,
    category: 1,
    is_active: true,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1593504049359-74330189a345?w=400",
      "https://images.unsplash.com/photo-1571069043870-35d3c0c3e7a9?w=400",
    ],
  },
  {
    id: 2,
    name: "Pepperoni Pizza",
    description: "Pepperoni cay, phô mai tan chảy", // Giữ nguyên - Mock Data
    price: 219000,
    category: 1,
    is_active: true,
    available: true,
    images: [
      "https://images.unsplash.com/photo-1628840047417-5d2c1f2c3d38?w=400",
    ],
  },
  {
    id: 3,
    name: "Chocolate Lava Cake",
    description: "Bánh nóng chảy socola bên trong", // Giữ nguyên - Mock Data
    price: 89000,
    category: 5,
    is_active: true,
    available: false,
    images: [
      "https://images.unsplash.com/photo-1571115764595-704f44c598d6?w=400",
    ],
  },
  // Thêm vài món nữa để test phân trang -> Added a few more items for pagination test
  ...Array.from({ length: 25 }, (_, i) => ({
    id: 4 + i,
    name: `Món ăn mẫu ${i + 1}`, // Giữ nguyên - Mock Data
    description: "Mô tả món ăn ngon", // Giữ nguyên - Mock Data
    price: Math.floor(Math.random() * 300000) + 50000,
    category: (i % 5) + 1,
    is_active: Math.random() > 0.2,
    available: Math.random() > 0.3,
    images: [
      `https://images.unsplash.com/photo-1546069901-ba9599a7e63${i}c?w=400`,
    ],
  })),
];

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState(mockProducts);
  const [categories, setCategories] = useState(mockCategories);
  const [filteredProducts, setFilteredProducts] = useState(mockProducts);

  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(
    undefined
  );

  // Product Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [form] = Form.useForm();

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catForm] = Form.useForm();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter
  useEffect(() => {
    let filtered = products;
    if (searchText) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchText, categoryFilter, products]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // === PRODUCT CRUD ===
  const handleAddEditProduct = (values: any) => {
    const images = fileList
      .map((file) => (file as any).thumbUrl || file.url)
      .filter(Boolean);

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id ? { ...p, ...values, images } : p
        )
      );
      message.success("Product updated successfully!");
    } else {
      const newProduct = {
        id: Date.now(),
        ...values,
        images,
        is_active: true,
        available: true,
      };
      setProducts((prev) => [...prev, newProduct]);
      message.success("Product added successfully!");
    }
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    message.success("Product deleted successfully");
  };

  const handleToggleStatus = (id: number, field: "is_active" | "available") => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p))
    );
  };

  const handleAddEditCategory = (values: any) => {
    if (editingCategory) {
      // Cập nhật danh mục -> Update category
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: values.name,
                slug_name: values.name.toLowerCase().replace(/\s+/g, "-"),
              }
            : c
        )
      );
      message.success("Category updated successfully");
    } else {
      // Thêm mới: Tạo ID = lớn nhất hiện tại + 1 -> Add new: Create ID = current max + 1
      const maxId =
        categories.length > 0 ? Math.max(...categories.map((c) => c.id)) : 0;
      const newId = maxId + 1;

      const newCat = {
        id: newId,
        name: values.name,
        slug_name: values.name.toLowerCase().replace(/\s+/g, "-"),
        is_active: true,
      };

      setCategories((prev) => [...prev, newCat]);
      message.success(`Category added successfully (ID: ${newId})`);
    }

    setIsCategoryModalOpen(false);
    catForm.resetFields();
    setEditingCategory(null);
  };

  // handleDeleteCategory đã được dùng ở đây -> handleDeleteCategory has been used here
  const handleDeleteCategory = (id: number) => {
    const hasProducts = products.some((p) => p.category === id);
    if (hasProducts) {
      message.error("Cannot delete category with existing products!");
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    message.success("Category deleted successfully");
  };

  // Upload handlers
  const handlePreview = async (file: UploadFile) => {
    setPreviewImage((file as any).thumbUrl || file.url!);
    setPreviewOpen(true);
  };

  const handleChangeUpload = ({ fileList: newFileList }: any) => {
    const processed = newFileList.map((file: any) => {
      if (file.originFileObj && !file.thumbUrl) {
        return { ...file, thumbUrl: URL.createObjectURL(file.originFileObj) };
      }
      return file;
    });
    setFileList(processed);
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      render: (images: string[]) =>
        images[0] ? (
          <img src={images[0]} alt="product" className={styles.productImage} />
        ) : (
          <div style={{ width: 60, height: 60, background: "#f0f0f0" }} />
        ),
    },
    { title: "Product Name", dataIndex: "name", key: "name" },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (catId: number) => {
        const cat = categories.find((c) => c.id === catId);
        return cat ? cat.name : "-";
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(price),
    },
    {
      title: "Status",
      key: "status",
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Switch
            checked={record.is_active}
            onChange={() => handleToggleStatus(record.id, "is_active")}
            size="small"
          />
          <span style={{ width: 70, display: "inline-block" }}>
            {record.is_active ? "Active" : "Inactive"}
          </span>

          <Switch
            checked={record.available}
            onChange={() => handleToggleStatus(record.id, "available")}
            size="small"
          />
          <Tag
            color={record.available ? "green" : "red"}
            style={{ width: 80, textAlign: "center" }}
          >
            {record.available ? "In Stock" : "Out of Stock"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProduct(record);
              setFileList(
                record.images.map((url: string, i: number) => ({
                  uid: i.toString(),
                  name: `image-${i}.jpg`,
                  status: "done",
                  url,
                  thumbUrl: url,
                }))
              );
              form.setFieldsValue(record);
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this product?"
            onConfirm={() => handleDeleteProduct(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "Category Name", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug_name", key: "slug_name" },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "active",
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "Active" : "Hidden"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCategory(record);
              catForm.setFieldsValue({ name: record.name });
              setIsCategoryModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this category?"
            onConfirm={() => handleDeleteCategory(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Title level={2} className={styles.pageTitle}>
        Product & Category Management
      </Title>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.filters}>
          <Search
            placeholder="Search products..."
            allowClear
            onSearch={(value) => setSearchText(value)}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            className={styles.searchInput}
          />
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: 200 }}
            onChange={(value) => setCategoryFilter(value as number)}
          >
            {categories
              .filter((c) => c.is_active)
              .map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
          </Select>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles.addCateBtn}
            onClick={() => {
              setEditingCategory(null);
              catForm.resetFields();
              setIsCategoryModalOpen(true);
            }}
          >
            Add Category
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles.addBtn}
            onClick={() => {
              setEditingProduct(null);
              form.resetFields();
              setFileList([]);
              setIsModalOpen(true);
            }}
          >
            Add Product
          </Button>
        </Space>
      </div>

      {/* Products Table */}
      <div className={styles.tableWrapper}>
        <Table
          columns={columns}
          dataSource={paginatedProducts}
          rowKey="id"
          pagination={false}
        />
        <Pagination
          current={currentPage}
          total={filteredProducts.length}
          pageSize={pageSize}
          onChange={setCurrentPage}
          className={styles.pagination}
          showSizeChanger={false}
        />
      </div>

      {/* Category Section */}
      <div className={styles.categorySection}>
        <Title level={3} className={styles.categoryTitle}>
          Category List
        </Title>
        <div className={styles.tableWrapper}>
          <Table
            columns={categoryColumns}
            dataSource={categories}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>

      {/* Product Modal */}
      <Modal
        title={
          <span className={styles.modalTitle}>
            {editingProduct ? "Edit" : "Add"} Product
          </span>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setFileList([]);
          setEditingProduct(null);
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEditProduct}>
          <Form.Item
            name="name"
            label="Product Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price (VND)"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select category">
              {categories
                .filter((c) => c.is_active)
                .map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item label="Product Images">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChangeUpload}
              beforeUpload={() => false}
              multiple
            >
              {fileList.length >= 8 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <div className={styles.toggleWrapper}>
            <Space>
              <Switch defaultChecked /> <span>Active</span>
              <Switch defaultChecked /> <span>In Stock</span>
            </Space>
          </div>

          <Space style={{ justifyContent: "flex-end", width: "100%" }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingProduct ? "Update" : "Add New"}
            </Button>
          </Space>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title={
          <span className={styles.modalTitle}>
            {editingCategory ? "Edit" : "Add"} Category
          </span>
        }
        open={isCategoryModalOpen}
        onCancel={() => {
          setIsCategoryModalOpen(false);
          catForm.resetFields();
          setEditingCategory(null);
        }}
        onOk={() => catForm.submit()}
      >
        <Form form={catForm} layout="vertical" onFinish={handleAddEditCategory}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: "Please enter category name!" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Image
        style={{ display: "none" }}
        preview={{
          visible: previewOpen,
          onVisibleChange: setPreviewOpen,
          src: previewImage,
        }}
      />
    </div>
  );
};

export default ProductManagement;
