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
    <section className="py-24 max-w-7xl mx-auto px-6 flex flex-col gap-16">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-5xl md:text-6xl font-normal tracking-tighter leading-[1.05] text-zinc-950">
          Everything you need <br />
          <span className="text-zinc-400">to manage your money.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
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
