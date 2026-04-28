import { mockDailyBriefData } from "../../data";
import CriticalAlertsToday from "./components/CriticalAlertsToday";
import DailyBriefVideoPlaceholder from "./components/DailyBriefVideoPlaceholder";
import OverallStatusBand from "./components/OverallStatusBand";
import OverallStatusHeroCard from "./components/OverallStatusHeroCard";
import RisksAndWinsBoard from "./components/RisksAndWinsBoard";
import TrendCards from "./components/TrendCards";
import UpcomingDeadlines from "./components/UpcomingDeadlines";

function DailyBrief() {
  const organizationStatus = mockDailyBriefData.organizationStatus;

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)]">
        <DailyBriefVideoPlaceholder />
        <OverallStatusHeroCard status={organizationStatus} />
      </section>

      <TrendCards />

      <section id="total-score" className="scroll-mt-28">
        <OverallStatusBand status={organizationStatus} />
      </section>

      <section id="critical-alerts" className="scroll-mt-28">
        <CriticalAlertsToday alerts={mockDailyBriefData.criticalAlertsToday} />
      </section>

      <section id="risks-opportunities" className="scroll-mt-28">
        <RisksAndWinsBoard
          risks={mockDailyBriefData.topRisks}
          wins={mockDailyBriefData.opportunitiesAndWins}
        />
      </section>

      <section id="due-today" className="scroll-mt-28">
        <UpcomingDeadlines
          deadlines={mockDailyBriefData.upcomingDeadlines}
          day={mockDailyBriefData.meta.generatedAt}
        />
      </section>
    </div>
  );
}

export default DailyBrief;
