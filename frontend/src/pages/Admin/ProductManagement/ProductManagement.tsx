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
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import styles from "./ProductManagement.module.css";
import productService from "../../../services/product.service";
import categoryService, { Category } from "../../../services/category.service";

const { Title } = Typography;
const { TextArea } = Input;
const { Search } = Input;

interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: Category;
  restaurant: string;
  is_active: boolean;
  available: boolean;
  average_rating: number | null;
  total_ratings: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [totalCount, setTotalCount] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          productService.getAdminProducts({
            page: currentPage,
            page_size: pageSize,
            search: searchText || undefined,
            category: categoryFilter || undefined,
            include_deleted: false,
          }),
          categoryService.getCategories(),
        ]);

        setProducts(productsData.results);
        setFilteredProducts(productsData.results);
        setTotalCount(productsData.count);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, searchText, categoryFilter, refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  // === PRODUCT CRUD ===
  const handleAddEditProduct = async (values: any) => {
    try {
      if (editingProduct) {
        // Update existing product
        await productService.updateProduct(
          editingProduct.category.slug_name,
          editingProduct.id,
          {
            name: values.name,
            description: values.description,
            price: values.price,
            category: values.category,
            restaurant: values.restaurant,
            is_active: values.is_active,
            available: values.available,
          }
        );
        message.success("Product updated successfully!");
      } else {
        // Create new product
        await productService.createProduct({
          name: values.name,
          description: values.description,
          price: values.price,
          category: values.category,
          restaurant: values.restaurant,
          is_active: true,
          available: true,
        });
        message.success("Product added successfully!");
      }
      setIsModalOpen(false);
      form.resetFields();
      setFileList([]);
      setEditingProduct(null);
      refetch(); // Refresh data
    } catch (error: any) {
      console.error("Error saving product:", error);
      message.error(error.response?.data?.detail || "Failed to save product");
    }
  };

  const handleDeleteProduct = async (product: AdminProduct) => {
    try {
      await productService.deleteProduct(
        product.category.slug_name,
        product.id
      );
      message.success("Product deleted successfully");
      refetch(); // Refresh data
    } catch (error: any) {
      console.error("Error deleting product:", error);
      message.error(error.response?.data?.detail || "Failed to delete product");
    }
  };

  const handleToggleStatus = async (
    product: AdminProduct,
    field: "is_active" | "available"
  ) => {
    try {
      await productService.updateProduct(
        product.category.slug_name,
        product.id,
        {
          [field]: !product[field],
        }
      );
      message.success(`Product ${field} updated successfully`);
      refetch(); // Refresh data
    } catch (error: any) {
      console.error(`Error updating ${field}:`, error);
      message.error(
        error.response?.data?.detail || `Failed to update ${field}`
      );
    }
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
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    { title: "Product Name", dataIndex: "name", key: "name" },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: Category) => category?.name || "-",
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
      title: "Rating",
      key: "rating",
      render: (_: any, record: AdminProduct) => (
        <span>
          {record.average_rating ? record.average_rating.toFixed(1) : "N/A"} ⭐
          {record.total_ratings > 0 && ` (${record.total_ratings})`}
        </span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 200,
      render: (_: any, record: AdminProduct) => (
        <Space>
          <Switch
            checked={record.is_active}
            onChange={() => handleToggleStatus(record, "is_active")}
            size="small"
          />
          <span style={{ width: 70, display: "inline-block" }}>
            {record.is_active ? "Active" : "Inactive"}
          </span>

          <Switch
            checked={record.available}
            onChange={() => handleToggleStatus(record, "available")}
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
      render: (_: any, record: AdminProduct) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingProduct(record);
              form.setFieldsValue({
                name: record.name,
                description: record.description,
                price: record.price,
                category: record.category.id,
                restaurant: record.restaurant,
                is_active: record.is_active,
                available: record.available,
              });
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete this product?"
            onConfirm={() => handleDeleteProduct(record)}
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
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="id"
            pagination={false}
          />
        </Spin>
        <Pagination
          current={currentPage}
          total={totalCount}
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
