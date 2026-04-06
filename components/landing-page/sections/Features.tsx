import { VirtualCardsCard } from "./features/VirtualCardsCard";
import { FamilyAccountsCard } from "./features/FamilyAccountsCard";
import { LiveActivityCard } from "./features/LiveActivityCard";
import { SpendingOverviewCard } from "./features/SpendingOverviewCard";
import { InstantTransfersCard } from "./features/InstantTransfersCard";
import { LoansCard } from "./features/LoansCard";
import { ExchangeRatesCard } from "./features/ExchangeRatesCard";
import { MoreFeaturesCard } from "./features/MoreFeaturesCard";

export default function Features() {
  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 md:px-6 flex flex-col gap-10 md:gap-16">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Features</p>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-normal tracking-tighter leading-tight text-foreground">
          Everything you need <br className="hidden sm:block" />
          <span className="text-muted-foreground">to manage your money.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-3 md:gap-4">
        {/* Row 1 */}
        <VirtualCardsCard />
        <FamilyAccountsCard />

        {/* Row 2 */}
        <LiveActivityCard />
        <SpendingOverviewCard />

        {/* Row 3 */}
        <InstantTransfersCard />
        <LoansCard />

        {/* Row 4 */}
        <ExchangeRatesCard />
        <MoreFeaturesCard />
      </div>
    </section>
  );
}
