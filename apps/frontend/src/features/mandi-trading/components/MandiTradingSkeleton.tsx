import React from "react";

const blockClassName = "tw-animate-pulse tw-rounded-2xl tw-bg-slate-800/80";

const MandiTradingSkeleton: React.FC = () => (
  <div className="render-smooth-section tw-rounded-[30px] tw-border tw-border-slate-800 tw-bg-slate-950 tw-p-4 md:tw-p-6 tw-shadow-terminal">
    <div className="tw-space-y-4">
      <div className="tw-h-8 tw-w-72 tw-rounded-full tw-bg-slate-800/80" />
      <div className="tw-h-4 tw-w-full tw-max-w-3xl tw-rounded-full tw-bg-slate-800/60" />
    </div>
    <div className="tw-mt-6 tw-grid tw-gap-4 xl:tw-grid-cols-[280px_minmax(0,1fr)_320px]">
      <div className="tw-space-y-4">
        <div className={`${blockClassName} tw-h-24`} />
        <div className={`${blockClassName} tw-h-24`} />
        <div className={`${blockClassName} tw-h-24`} />
        <div className={`${blockClassName} tw-h-40`} />
      </div>
      <div className="tw-space-y-4">
        <div className={`${blockClassName} tw-h-40`} />
        <div className={`${blockClassName} tw-h-[420px]`} />
        <div className={`${blockClassName} tw-h-40`} />
      </div>
      <div className="tw-space-y-4">
        <div className={`${blockClassName} tw-h-56`} />
        <div className={`${blockClassName} tw-h-56`} />
      </div>
    </div>
  </div>
);

export default MandiTradingSkeleton;
