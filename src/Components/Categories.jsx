import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const Categories = ({ className }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch categories
  const fetchCategories = async (isLoadMore = false) => {
    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const response = await fetch(`http://localhost:3001/categories?_page=${currentPage}&_limit=20`);
      const data = await response.json();
      const total = parseInt(response.headers.get('X-Total-Count') || '0');

      setCategories(isLoadMore ? [...categories, ...data] : data);
      setPage(isLoadMore ? currentPage : 1);
      setHasMore((isLoadMore ? categories.length + data.length : data.length) < total);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleCategoryClick = (category) => {
    setActiveCategory(category.id === activeCategory ? null : category.id);
    const url = new URL(window.location);
    category.id === activeCategory ? url.searchParams.delete('cats') : url.searchParams.set('cats', category.id);
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className={`${className} my-[50px]`}>
      <h2 className="text-2xl font-bold mb-6">Store Categories</h2>
      <InfiniteScroll
        dataLength={categories.length}
        next={() => fetchCategories(true)}
        hasMore={hasMore}
        loader={<div className="text-center py-4">Loading...</div>}
      >
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          {categories.map(category => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`px-6 py-4 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors ${category.id === activeCategory ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-900">{category.name}</span>
                  <div className="text-sm text-gray-500">{category.store_count} stores</div>
                </div>
                {category.id === activeCategory && <span className="text-blue-600">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Categories;
