import Link from "next/link";
import { type MarketplaceProduct, formatPrice, categoryLabel } from "./types";

export function ProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <Link
      href={`/marketplace/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12121A] transition-all hover:border-[#00E5FF]/20 hover:shadow-lg hover:shadow-[#00E5FF]/5"
    >
      {/* Cover image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0A0A0F]">
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-[#5A5A72]/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25m0 0L12 17.25l-5.571-3m11.142 0L22 16.5l-9.75 5.25L2.25 16.5l4.179-2.25"
              />
            </svg>
          </div>
        )}
        {/* Category badge */}
        <span className="absolute left-3 top-3 rounded-lg bg-[#0A0A0F]/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#00E5FF] backdrop-blur-sm">
          {categoryLabel(product.category)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold text-white line-clamp-2 group-hover:text-[#00E5FF] transition-colors">
          {product.title}
        </h3>
        <p className="text-[13px] text-[#8B8BA3] line-clamp-2">
          {product.description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-[#5A5A72]">
            por {product.trainer_name}
          </span>
          <span className="text-lg font-black text-[#00E5FF]">
            {formatPrice(product.price_cents, product.currency)}
          </span>
        </div>

        {product.downloads > 0 && (
          <span className="text-[11px] text-[#5A5A72]">
            {product.downloads} {product.downloads === 1 ? "descarga" : "descargas"}
          </span>
        )}
      </div>
    </Link>
  );
}
