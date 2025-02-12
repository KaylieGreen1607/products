import moment from 'moment';
import { useRouter } from 'next/router';
import React, { FormEvent, useEffect } from 'react';
import ReactGA from 'react-ga-gtm';
import styled from 'styled-components';
import { IProduct } from '../../model/substance';
import { docSearch, ISearchResult } from '../../services/azure-search';
import substanceLoader from '../../services/substance-loader';
import { baseSpace, mobileBreakpoint } from '../../styles/dimensions';
import DrugIndex, { index } from '../drug-index';
import MipText from '../mip-text';
import Search from '../search';
import SearchResults, { IDocument } from '../search-results';
import YellowCard from '../yellow-card';

const StyledMip = styled.div`
  width: 100%;
  padding: 1.25rem 0.625rem 0 1.25rem;
  .search {
    background-color: rgba(10, 50, 150, 0.1);
    margin-bottom: 20px;
    padding: ${baseSpace} calc(${baseSpace} / 2);
  }

  @media ${mobileBreakpoint} {
    padding: 1.25rem;

    .search {
      padding: 1.25rem;
    }
  }
`;

const sanitizeTitle = (title: string | null): string => {
  let name: string;
  if (!title) return 'Unknown';

  try {
    name = decodeURIComponent(title);
  } catch {
    name = title;
  }
  return name;
};

const Mip: React.FC = () => {
  const [pageNumber, setPageNumber] = React.useState(1);
  const [hasIntro, setHasIntro] = React.useState(true);
  const [resultCount, setResultCount] = React.useState(0);
  const pageSize = 10;
  const [results, setResults] = React.useState<IDocument[]>([]);
  const [search, setSearch] = React.useState('');
  const [showingResultsForTerm, setShowingResultsForTerm] = React.useState('');
  const [products, setProducts] = React.useState<IProduct[] | null>(null);

  const router = useRouter();

  const {
    query: { search: searchTerm, page, substance },
  } = router;

  const handleSearchChange = (e: FormEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value);
  };

  const fetchSearchResults = async (searchTerm: string, page: number) => {
    const searchResults = await docSearch(searchTerm, page, pageSize);
    const results = searchResults.results.map((doc: ISearchResult) => {
      return {
        activeSubstances: doc.substance_name,
        product: doc.product_name,
        context: doc['@search.highlights']?.content.join(' … ') || '',
        docType: doc.doc_type?.toString().substr(0, 3) || '',
        fileSize: Math.ceil(
          (doc.metadata_storage_size ? doc.metadata_storage_size : 0) / 1000,
        ).toLocaleString('en-GB'),
        created: doc.created
          ? moment(doc.created).format('D MMMM YYYY')
          : 'Unknown',
        name: sanitizeTitle(doc.title),
        url: doc.metadata_storage_path,
      };
    });
    setResults(results);
    setResultCount(searchResults.resultCount);
    setShowingResultsForTerm(searchTerm);
    setProducts([]);
  };

  const handleSearchSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (search.length > 0) {
      rerouteSearchResults(1);
    }

    ReactGA.event({
      category: 'Search',
      action: `Searched for '${search}'`,
    });
  };

  const rerouteSearchResults = (pageNo: number) => {
    router.push({
      pathname: router.route,
      query: { search: search.trim(), page: pageNo },
    });
  };

  useEffect(() => {
    if (searchTerm && page) {
      if (typeof searchTerm === 'string') {
        (async () => {
          setHasIntro(false);
          const trimmedTerm = searchTerm.trim();
          setSearch(trimmedTerm);
          let parsedPage = Number(page);
          if (!parsedPage || parsedPage < 1) {
            parsedPage = 1;
          }
          setPageNumber(parsedPage);
          await fetchSearchResults(trimmedTerm, parsedPage);
        })();
      }
    } else if (substance) {
      if (typeof substance === 'string') {
        (async () => {
          setHasIntro(false);
          setResults([]);
          setSearch('');
          setShowingResultsForTerm('');
          const ss = await substanceLoader.load(substance.charAt(0));
          const products = ss.find(s => s.name === substance);
          if (products) {
            setProducts(products.products);
          } else {
            setProducts(ss);
          }
        })();
      }
    } else {
      setHasIntro(true);
      setResults([]);
      setSearch('');
      setShowingResultsForTerm('');
      setProducts(null);
    }
    window.scrollTo(0, 0);
  }, [page, searchTerm, substance]);

  return (
    <StyledMip>
      <section className="search">
        <Search
          search={search}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
        />
        <DrugIndex
          title="or find by active substance:"
          items={index}
          horizontal
        />
      </section>
      <YellowCard />
      {showingResultsForTerm.length === 0 ? (
        <>
          {hasIntro && <MipText />}
          {products == null ? (
            <></>
          ) : products.length > 0 ? (
            <DrugIndex title={`${substance || '...'}`} items={products} />
          ) : (
            <p>Nothing found for "{substance}"</p>
          )}
        </>
      ) : (
        <SearchResults
          drugs={results}
          showingResultsForTerm={showingResultsForTerm}
          resultCount={resultCount}
          page={pageNumber}
          pageSize={pageSize}
          searchTerm={search}
        />
      )}
    </StyledMip>
  );
};

export default Mip;
