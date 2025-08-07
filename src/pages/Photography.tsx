import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { galleries } from '../data/galleries';
import { FixedSizeGrid as Grid } from 'react-window';

const GUTTER = 48; // px, enlarged gap
const ITEM_HEIGHT = 340; // px, reduced height

function useResponsiveColumns() {
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    function onResize() {
      if (window.innerWidth < 768) setColumns(1);
      else if (window.innerWidth < 1024) setColumns(2);
      else setColumns(3);
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return columns;
}

const Photography: React.FC = () => {
  const columns = useResponsiveColumns();
  const gridRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    function updateWidth() {
      if (gridRef.current) {
        setWidth(gridRef.current.offsetWidth);
      }
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const itemWidth = columns > 0 ? Math.floor((width - GUTTER * (columns - 1)) / columns) : 400;
  const rowCount = Math.ceil(galleries.length / columns);

  /**
   * Calculate the full height so we don\'t need an internal scrollbar.
   * Each row takes ITEM_HEIGHT + GUTTER space, so the grid height should
   * cover ALL rows. The page itself will scroll instead of the grid.
   */
  const fullGridHeight = rowCount * (ITEM_HEIGHT + GUTTER);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
      <h1 className="font-cormorant font-bold text-4xl mb-12 text-center">
        Photography Collections
      </h1>
      <div ref={gridRef} style={{ width: '100%', overflowX: 'hidden' }} className="overflow-x-hidden">
        {width > 0 && (
          <Grid
            columnCount={columns}
            columnWidth={itemWidth + GUTTER}
            /**
             * Use the full height so no vertical scrollbar appears inside the grid.
             * The outer page will handle scrolling naturally.
             */
            height={fullGridHeight}
            rowCount={rowCount}
            rowHeight={ITEM_HEIGHT + GUTTER}
            width={width}
            itemData={{ galleries, columns, itemWidth }}
            style={{ overflowX: 'hidden' }}
          >
            {({ columnIndex, rowIndex, style, data }) => {
              const { galleries, columns, itemWidth } = data;
              const idx = rowIndex * columns + columnIndex;
              if (idx >= galleries.length) return null;
              const g = galleries[idx];
              const preview = g.hero || g.photos[0];
              return (
                <div
                  style={{
                    ...style,
                    left: style.left,
                    top: style.top,
                    width: itemWidth,
                    margin: '0 auto',
                    marginBottom: rowIndex !== rowCount - 1 ? GUTTER : 0,
                  }}
                >
                  <Link
                    to={`/photography/${g.slug}`}
                    className="group block relative overflow-hidden rounded-lg shadow-lg"
                    style={{ height: ITEM_HEIGHT }}
                  >
                    <img
                      src={preview.src + '?q_auto,f_auto,w_600'}
                      srcSet={
                        preview.src + '?q_auto,f_auto,w_300 300w, ' +
                        preview.src + '?q_auto,f_auto,w_600 600w, ' +
                        preview.src + '?q_auto,f_auto,w_900 900w'
                      }
                      sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 600px"
                      alt={g.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                      style={{ backgroundColor: preview.dominantColor, height: '100%' }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-end p-6 text-white">
                      <h2 className="font-cormorant text-2xl mb-2">{g.title}</h2>
                      <p className="text-sm opacity-80">{g.description}</p>
                    </div>
                  </Link>
                </div>
              );
            }}
          </Grid>
        )}
      </div>
    </div>
  );
};

export default Photography;