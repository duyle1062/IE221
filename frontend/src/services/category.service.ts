import axiosInstance from "./axios.instance";

export interface Category {
  id: number;
  name: string;
  slug_name: string;
  is_active: boolean;
}

class CategoryService {
  /**
   * Get all categories
   * GET /api/category/
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await axiosInstance.get<Category[]>("/api/category/");
      return response.data;
    } catch (error: any) {
      console.error("Get categories error:", error);
      throw error;
    }
  }

  /**
   * Get category detail by slug
   * GET /api/category/{slug}/
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    try {
      const response = await axiosInstance.get<Category>(
        `/api/category/${slug}/`
      );
      return response.data;
    } catch (error: any) {
      console.error("Get category detail error:", error);
      throw error;
    }
  }
}

const categoryService = new CategoryService();
export default categoryService;
