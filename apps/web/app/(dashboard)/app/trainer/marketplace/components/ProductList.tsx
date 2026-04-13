import { type TrainerProduct, STATUS_LABELS } from "./types";
import {
  formatPrice,
  categoryLabel,
} from "@/app/marketplace/components/types";

interface ProductListProps {
  products: TrainerProduct[];
  onNewProduct: () => void;
}

export function ProductList({ products, onNewProduct }: ProductListProps) {
  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#12121A] py-16">
          <svg
            className="mb-4 h-16 w-16 text-[#5A5A72]/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l4.059-4.059A1.5 1.5 0 0 1 4.94 0h14.12a1.5 1.5 0 0 1 1.06.44l4.059 4.06a3.004 3.004 0 0 1-.621 4.72"
            />
          </svg>
          <p className="text-sm text-[#5A5A72]">
            No tienes productos en el marketplace
          </p>
          <button
            onClick={onNewProduct}
            className="mt-4 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-sm font-semibold text-[#0A0A0F] transition-opacity hover:opacity-90"
          >
            Publicar mi primera rutina
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const statusInfo = STATUS_LABELS[product.status] ?? {
              label: product.status,
              color: "text-[#8B8BA3]",
            };
            return (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#12121A] p-4"
              >
                {/* Cover thumbnail */}
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#0A0A0F]">
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-6 w-6 text-[#5A5A72]/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0L22 12l-4.179 2.25"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-white">
                    {product.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className={`font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <span className="text-[#5A5A72]">
                      {categoryLabel(product.category)}
                    </span>
                    <span className="text-[#5A5A72]">
                      {product.downloads}{" "}
                      {product.downloads === 1 ? "descarga" : "descargas"}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <span className="text-lg font-black text-[#00E5FF]">
                  {formatPrice(product.price_cents, product.currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
