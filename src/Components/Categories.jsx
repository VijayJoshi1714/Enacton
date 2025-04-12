import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

const Categories = ({ className }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCategories = async (isLoadMore = false) => {
    try {
      const currentPage = isLoadMore ? page + 1 : 1;
      const response = await fetch(`http://localhost:3001/categories?_page=${currentPage}&_limit=20`);

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');

      if (isLoadMore) {
        setCategories(prevCategories => [...prevCategories, ...data]);
        setPage(currentPage);
      } else {
        setCategories(data);
        setPage(1);
      }

      // Check if we have more categories to load
      const currentTotal = isLoadMore ? categories.length + data.length : data.length;
      setHasMore(currentTotal < totalCount);

    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchCategories(true);
    }
  };

  // src/Components/Categories.jsx
  const handleCategoryClick = (category) => {
    setActiveCategory(category.id === activeCategory ? null : category.id);

    const url = new URL(window.location);
    if (category.id === activeCategory) {
      url.searchParams.delete('categoryId');
    } else {
      url.searchParams.set('categoryId', category.id);
      // Remove the line that sets 'category.id' parameter
      if (category.store_count === 0) {
        url.searchParams.set('forceEmpty', 'true');
      } else {
        url.searchParams.delete('forceEmpty');
      }
    }

    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    fetchCategories();

    // Set initial active category from URL if present
    const url = new URL(window.location);
    const categoryId = url.searchParams.get('categoryId');
    if (categoryId) {
      setActiveCategory(Number(categoryId));
    }
  }, []);

  if (error) {
    return <div className={`${className} text-red-500`}>Error: {error}</div>;
  }

  return (
    <div className={`${className} my-[50px]`}>
      <h2 className="text-2xl font-bold mb-6">Store Categories</h2>
      <InfiniteScroll
        dataLength={categories.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className="text-center py-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          </div>
        }
        endMessage={
          <div className="text-center py-4 text-gray-500">
            No more categories to load
          </div>
        }
        scrollThreshold={0.8}
      >
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          {categories.map(category => (
            <div
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className={`px-6 py-4 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors ${category.id === activeCategory
                ? 'bg-blue-50 hover:bg-blue-100'
                : 'hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">

                  <div>
                    <span className="text-gray-900">{category.name}</span>
                    <div className="text-sm text-gray-500">
                      {category.store_count} stores
                    </div>
                  </div>
                </div>
                {category.id === activeCategory && (
                  <span className="text-blue-600 text-sm">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Categories;
