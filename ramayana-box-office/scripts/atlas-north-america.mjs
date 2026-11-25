export function northAmericanMarket(days, asOf, byId) {
  const source = byId.get('numbers');
  const previews = byId.get('boxoffy');
  let cumulative = 0;
  const rows = days.filter(day => day.date <= asOf).map(day => {
    cumulative += day.naUsd;
    const row = {date:day.date, daily:day.naUsd, cumulative};
    if (day.naStatus === 'preview') {
      row.preview = true;
      row.status = 'Estimated paid previews';
      row.sourceName = previews.name;
      row.sourceUrl = previews.url;
    } else if (day.naStatus === 'allocated') {
      row.status = 'Opening day after preview allocation';
    } else if (day.naStatus === 'estimate') {
      row.status = 'Estimate';
    }
    return row;
  });

  return {
    name:'US and Canada',
    members:['US','CA'],
    unit:'USD',
    cadence:'daily',
    sourceName:source.name,
    sourceUrl:source.url,
    notes:'The domestic chart covers the US and Canada together. The dashboard assigns the estimated US$2 million in paid previews to November 4 and the balance of the published opening-day gross to November 5. Both amounts enter the running total once.',
    rows
  };
}
