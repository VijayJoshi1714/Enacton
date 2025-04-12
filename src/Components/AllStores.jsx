// src/Components/AllStores.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';

const SORT_OPTIONS = {
  NAME: { value: 'name-asc', label: 'Name (A-Z)', params: { _sort: 'name', _order: 'asc' } },
  FEATURED: { value: 'featured-desc', label: 'Featured', params: { _sort: 'featured', _order: 'desc' } },
  POPULARITY: { value: 'clicks-desc', label: 'Most Popular', params: { _sort: 'clicks', _order: 'desc' } },
  CASHBACK: {
    value: 'cashback-desc',
    label: 'Highest Cashback',
    params: { _sort: 'amount_type,cashback_amount', _order: 'asc,desc' }
  }
};

const AllStores = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'name-asc');
  const [filters, setFilters] = useState({
    _page: 1,
    _limit: 20,
    ...Object.fromEntries(searchParams)
  });
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites')) || []);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCashback, setShowCashback] = useState(false);
  const [showPromoted, setShowPromoted] = useState(false);
  const [showSharable, setShowSharable] = useState(false);
  const [storeStatus, setStoreStatus] = useState('publish');

  const fetchStores = async (currentFilters = filters, isLoadMore = false) => {
    setLoading(true);
    const currentPage = isLoadMore ? page + 1 : 1;
    const queryParams = new URLSearchParams({
      _page: currentPage.toString(),
      _limit: '20'
    });

    if (currentFilters.cats) queryParams.set('cats', currentFilters.cats);
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (value && key !== 'cats') queryParams.set(key, value);
    });

    const response = await fetch(`http://localhost:3001/stores?${queryParams}`);
    const data = await response.json();
    const totalCount = parseInt(response.headers.get('X-Total-Count') || '0');

    setStores(isLoadMore ? [...stores, ...data] : data);
    setPage(currentPage);
    setHasMore(data.length === 20 && (isLoadMore ? stores.length + data.length : data.length) < totalCount);
    setLoading(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) fetchStores(filters, true);
  };

  const handleSort = (e) => {
    const selectedSort = e.target.value;
    setSortOption(selectedSort);
    const sortConfig = SORT_OPTIONS[Object.keys(SORT_OPTIONS).find(key =>
      SORT_OPTIONS[key].value === selectedSort
    )];
    if (sortConfig) {
      const newFilters = { ...filters, ...sortConfig.params };
      setFilters(newFilters);
      setSearchParams(new URLSearchParams(newFilters));
      fetchStores(newFilters);
    }
  };

  const toggleFavorite = (storeId) => {
    const updatedFavorites = favorites.includes(storeId)
      ? favorites.filter(id => id !== storeId)
      : [...favorites, storeId];
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const handleAlphabetFilter = (letter) => {
    setActiveFilter(letter);
    let newFilters = { ...filters };

    if (letter === '#') {
      newFilters = { ...newFilters, name_like: '^[0-9]', _page: 1 };
    } else if (letter !== 'All') {
      newFilters = { ...newFilters, name_like: `^${letter.toLowerCase()}`, _page: 1 };
    } else {
      const { name_like, ...restFilters } = newFilters;
      newFilters = { ...restFilters, _page: 1 };
    }

    setFilters(newFilters);
    setStores([]);
    setPage(1);
    setHasMore(true);
    fetchStores(newFilters);
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    let newFilters = { ...filters };
    if (query) newFilters.name_like = query;
    else delete newFilters.name_like;
    setFilters(newFilters);
    fetchStores(newFilters);
  };

  const handleCashbackFilter = (e) => {
    const checked = e.target.checked;
    setShowCashback(checked);
    let newFilters = { ...filters };
    if (checked) {
      newFilters = {
        ...newFilters,
        cashback_enabled: 1,
        _sort: 'amount_type,cashback_amount',
        _order: 'asc,desc'
      };
    } else {
      const { cashback_enabled, ...restFilters } = newFilters;
      newFilters = restFilters;
    }
    setFilters(newFilters);
    fetchStores(newFilters);
  };

  const handlePromotedFilter = (e) => {
    const checked = e.target.checked;
    setShowPromoted(checked);
    let newFilters = { ...filters };
    if (checked) newFilters.is_promoted = 1;
    else delete newFilters.is_promoted;
    setFilters(newFilters);
    fetchStores(newFilters);
  };

  const handleSharableFilter = (e) => {
    const checked = e.target.checked;
    setShowSharable(checked);
    let newFilters = { ...filters };
    if (checked) newFilters.is_sharable = 1;
    else delete newFilters.is_sharable;
    setFilters(newFilters);
    fetchStores(newFilters);
  };

  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStoreStatus(status);
    let newFilters = { ...filters };
    newFilters.status = status;
    setFilters(newFilters);
    fetchStores(newFilters);
  };

  useEffect(() => {
    fetchStores();
  }, [filters._sort, filters._order]);

  useEffect(() => {
    const categoryId = searchParams.get('cats');
    const newFilters = { ...filters };
    if (categoryId) newFilters.cats = categoryId;
    else delete newFilters.cats;
    setFilters(newFilters);
    setStores([]);
    setPage(1);
    setHasMore(true);
    fetchStores(newFilters);
  }, [searchParams.get('cats')]);

  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location);
      const categoryId = url.searchParams.get('categoryId');
      const newFilters = { ...filters };
      if (categoryId) newFilters.categoryId = categoryId;
      else delete newFilters.categoryId;
      setFilters(newFilters);
      fetchStores(newFilters);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="space-y-6">
      {/* Filter and Search Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 text-sm overflow-x-auto">
            {['All', '#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(letter => (
              <span
                key={letter}
                className={`cursor-pointer ${activeFilter === letter ? 'text-blue-600' : ''}`}
                onClick={() => handleAlphabetFilter(letter)}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search stores..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full rounded-lg border-gray-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>

          <div className="relative w-48">
            <select
              className="w-full rounded-lg border-gray-300 pr-10 py-2 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={sortOption}
              onChange={handleSort}
            >
              {Object.values(SORT_OPTIONS).map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cashback"
              checked={showCashback}
              onChange={handleCashbackFilter}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="cashback" className="text-sm text-gray-700">Show Stores With Cashback</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="promoted"
              checked={showPromoted}
              onChange={handlePromotedFilter}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="promoted" className="text-sm text-gray-700">Promoted Stores</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sharable"
              checked={showSharable}
              onChange={handleSharableFilter}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sharable" className="text-sm text-gray-700">Sharable Stores</label>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={storeStatus}
              onChange={handleStatusFilter}
              className="rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="publish">Active</option>
              <option value="draft">Coming Soon</option>
              <option value="trash">Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      <InfiniteScroll
        dataLength={stores.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<div className="text-center">Loading...</div>}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="bg-white rounded-xl shadow-lg p-8 relative">
              <div className="flex flex-col items-center">
                <img src={store.logo} alt={store.name} className="h-10 w-auto mb-6 object-contain" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{store.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  {store.cashback_enabled ? (
                    <>
                      <span className="inline-block">
                        <img src="https://laraback.enactweb.com/img/money-back-guarantee.png" className="w-6 h-6" alt="cashback icon" />
                      </span>
                      <p className="text-orange-500 font-medium">
                        {`${store.rate_type === 'upto' ? 'Upto' : 'Flat'} ${store.amount_type === 'fixed' ?
                          `$${store.cashback_amount.toFixed(2)}` :
                          `${store.cashback_amount.toFixed(2)}%`} cashback`}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-500">No cashback available</p>
                  )}
                </div>
                <a href={store.url} className="w-full bg-gray-900 text-white py-2 px-4 rounded-full hover:bg-gray-800 transition-colors text-center">
                  Shop Now
                </a>
                <button onClick={() => toggleFavorite(store.id)} className="absolute top-4 right-4 p-2">
                  {favorites.includes(store.id) ? '❤️' : '🤍'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default AllStores;