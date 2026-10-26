"use client";

import { useState } from "react";
import { loadWhop, type Appearance } from "@whop/elements";
import {
  Checkout,
  CheckoutElement,
  WhopElements,
} from "@whop/elements-react";

const appearance: Appearance = {
  theme: {
    appearance: "dark",
    accentColor: "gray",
    grayColor: "slate",
  },
};

export function WhopPlanCheckout({
  planId,
  affiliateCode,
  returnUrl,
  sandbox,
}: {
  planId: string;
  affiliateCode: string | null;
  returnUrl: string;
  sandbox: boolean;
}) {
  const [loadError, setLoadError] = useState<(() => void) | null>(null);

  return (
    <WhopElements
      elements={loadWhop()}
      environment={sandbox ? "sandbox" : "production"}
      appearance={appearance}
      onLoadError={(_error, retry) => setLoadError(() => retry)}
    >
      {loadError ? (
        <div className="flex min-h-[38rem] flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-silver/65">
            Secure checkout couldn’t load. Please try again.
          </p>
          <button
            type="button"
            onClick={() => {
              const retry = loadError;
              setLoadError(null);
              retry();
            }}
            className="rounded-full border border-silver/20 px-5 py-2 text-sm font-medium text-chrome transition hover:border-silver/40"
          >
            Try again
          </button>
        </div>
      ) : (
        <Checkout
          plan={planId}
          affiliateCode={affiliateCode ?? undefined}
          returnUrl={returnUrl}
          fallback={
            <div className="flex min-h-[38rem] items-center justify-center text-sm text-silver/55">
              Loading secure checkout…
            </div>
          }
        >
          <CheckoutElement />
        </Checkout>
      )}
    </WhopElements>
  );
}
