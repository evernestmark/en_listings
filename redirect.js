  const currentPath = window.location.pathname;
  const currentQuery = window.location.search;

  if (currentPath === '/location-homes-for-rent/listings' && 
      !currentQuery.includes('market=location')) {
    window.location.href = '/location-homes-for-rent/listings?market=location';
  }