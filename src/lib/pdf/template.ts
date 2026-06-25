export function generatePDFHTML(data: any, branding: any, activities: any[] = []): string {
  const {
    package_code,
    name,
    total_nights,
    total_days,
    adults,
    children,
    infants,
    package_destinations,
    package_hotels,
    package_days,
    package_inclusions,
    package_pricing,
    package_payment_schedule,
    package_policies,
    package_reviews,
  } = data

  const primaryColor = branding.color_primary || '#0D9488'
  const secondaryColor = branding.color_secondary || '#2DD4BF'
  const darkColor = branding.color_accent || '#1A1A2E'
  const textColor = branding.color_text || '#1C1917'

  const destinations = package_destinations
    ?.sort((a: any, b: any) => a.leg_order - b.leg_order)
    .map((d: any) => d.destinations?.name)
    .filter(Boolean)
    .join(' → ') || 'Multi-destination'

  const pricing = package_pricing?.[0]
  const policies = package_policies || []
  const tnc = policies.find((p: any) => p.type === 'terms_and_conditions')
  const cancellation = policies.find((p: any) => p.type === 'cancellation_policy')
  const reviews = package_reviews || []

  // Calculate totals
  const guestCount = adults + children + infants
  const baseTotal = pricing?.base_total || 0
  const gstTotal = pricing?.gst_total || 0
  const grandTotal = pricing?.grand_total || 0
  const advanceAmount = pricing?.advance_amount || 0
  const balanceDue = Math.max(0, grandTotal - advanceAmount)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} - ${package_code}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: ${textColor};
      line-height: 1.6;
      background: #fff;
    }

    .page {
      width: 210mm;
      height: 297mm;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      background: #fff;
      position: relative;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* ── COVER PAGE ── */
    .cover-page {
      background: linear-gradient(135deg, ${darkColor} 0%, ${primaryColor} 100%);
      color: #fff;
      padding: 60px 40px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    .cover-logo {
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      margin-bottom: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      font-weight: 700;
      color: ${secondaryColor};
    }

    .cover-title {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: -1px;
    }

    .cover-subtitle {
      font-size: 20px;
      font-weight: 400;
      margin-bottom: 8px;
      opacity: 0.9;
    }

    .cover-duration {
      font-size: 16px;
      margin-bottom: 40px;
      opacity: 0.8;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .cover-guests {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 50px;
      flex-wrap: wrap;
    }

    .cover-guest-item {
      text-align: center;
    }

    .cover-guest-number {
      font-size: 32px;
      font-weight: 700;
      color: ${secondaryColor};
    }

    .cover-guest-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
      opacity: 0.8;
    }

    .cover-footer {
      position: absolute;
      bottom: 40px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 12px;
      opacity: 0.7;
    }

    /* ── CONTENT PAGE ── */
    .content-page {
      padding: 40px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid ${secondaryColor};
    }

    .page-header-left h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 4px;
      color: ${darkColor};
    }

    .page-header-left p {
      font-size: 12px;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .page-header-right {
      text-align: right;
    }

    .package-code {
      font-size: 11px;
      color: #a8a29e;
      font-family: 'Courier New', monospace;
      margin-bottom: 8px;
    }

    .package-code span {
      color: ${primaryColor};
      font-weight: 600;
    }

    /* ── SECTION ── */
    .section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: ${darkColor};
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-left: 4px solid ${secondaryColor};
      padding-left: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-content {
      margin-left: 0;
    }

    /* ── DESTINATION CARD ── */
    .destination-card {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
    }

    .destination-card h3 {
      font-size: 14px;
      font-weight: 700;
      color: ${primaryColor};
      margin-bottom: 4px;
    }

    .destination-card p {
      font-size: 12px;
      color: #78716c;
      margin-bottom: 0;
    }

    /* ── HOTEL OPTION ── */
    .hotel-option {
      background: #fff;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      align-items: center;
    }

    .hotel-option-name {
      font-size: 13px;
      font-weight: 600;
      color: #1c1917;
    }

    .hotel-option-detail {
      font-size: 11px;
      color: #78716c;
      display: flex;
      gap: 8px;
    }

    .hotel-option-tier {
      display: inline-block;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      background: ${secondaryColor}20;
      color: ${primaryColor};
    }

    /* ── DAY ITINERARY ── */
    .day-card {
      background: #fafaf9;
      border-left: 4px solid ${primaryColor};
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 10px;
    }

    .day-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 6px;
    }

    .day-number {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: ${primaryColor};
      background: ${secondaryColor}20;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .day-title {
      font-size: 13px;
      font-weight: 600;
      color: #1c1917;
    }

    .day-activities {
      margin-top: 6px;
    }

    .activity-item {
      font-size: 11px;
      color: #78716c;
      margin-bottom: 3px;
      padding-left: 16px;
      position: relative;
    }

    .activity-item:before {
      content: '•';
      position: absolute;
      left: 6px;
      color: ${secondaryColor};
      font-weight: bold;
    }

    /* ── INCLUSIONS ── */
    .inclusions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .inclusion-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .inclusion-list h4 {
      font-size: 12px;
      font-weight: 700;
      color: ${darkColor};
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .inclusion-item {
      font-size: 11px;
      color: #44403c;
      padding-left: 16px;
      position: relative;
    }

    .inclusion-item.inclusion:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #16a34a;
      font-weight: bold;
    }

    .inclusion-item.exclusion:before {
      content: '✗';
      position: absolute;
      left: 0;
      color: #dc2626;
      font-weight: bold;
    }

    /* ── PRICING TABLE ── */
    .pricing-section {
      background: #fafaf9;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .pricing-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      border-bottom: 1px solid #e7e5e4;
    }

    .pricing-row:last-child {
      border-bottom: none;
    }

    .pricing-row.total {
      font-weight: 700;
      font-size: 14px;
      padding-top: 12px;
      border-top: 2px solid ${secondaryColor};
      color: ${darkColor};
    }

    .pricing-label {
      color: #78716c;
    }

    .pricing-value {
      color: #1c1917;
      font-weight: 500;
    }

    .pricing-row.total .pricing-value {
      color: ${primaryColor};
    }

    /* ── PAYMENT SCHEDULE ── */
    .payment-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 12px;
    }

    .payment-table th {
      background: ${primaryColor}20;
      color: ${primaryColor};
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid ${secondaryColor};
    }

    .payment-table td {
      padding: 8px;
      border-bottom: 1px solid #e7e5e4;
      color: #1c1917;
    }

    .payment-table tr:last-child td {
      border-bottom: none;
    }

    /* ── REVIEWS ── */
    .review-card {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
      align-items: flex-start;
    }

    .review-name {
      font-size: 12px;
      font-weight: 700;
      color: #1c1917;
    }

    .review-city {
      font-size: 11px;
      color: #78716c;
    }

    .review-rating {
      font-size: 12px;
      color: #f59e0b;
      letter-spacing: 1px;
    }

    .review-text {
      font-size: 11px;
      color: #44403c;
      line-height: 1.5;
      font-style: italic;
    }

    /* ── CONTACT PAGE ── */
    .contact-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 60px 40px;
    }

    .contact-company {
      font-size: 32px;
      font-weight: 700;
      color: ${darkColor};
      margin-bottom: 20px;
    }

    .contact-tagline {
      font-size: 14px;
      color: #78716c;
      max-width: 500px;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 50px;
      max-width: 600px;
    }

    .contact-item {
      text-align: left;
    }

    .contact-item-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #a8a29e;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .contact-item-value {
      font-size: 13px;
      font-weight: 500;
      color: #1c1917;
    }

    .contact-item-value a {
      color: ${primaryColor};
      text-decoration: none;
    }

    .contact-social {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 40px;
    }

    .contact-social-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .contact-social-label {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #a8a29e;
    }

    .contact-social-value {
      font-size: 11px;
      color: ${primaryColor};
      font-weight: 600;
    }

    .contact-footer {
      font-size: 11px;
      color: #a8a29e;
      line-height: 1.6;
    }

    /* ── FOOTER ── */
    .page-footer {
      font-size: 9px;
      color: #a8a29e;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e7e5e4;
      margin-top: auto;
    }

    /* ── POLICY PAGES ── */
    .policy-page {
      padding: 40px;
    }

    .policy-content {
      font-size: 11px;
      line-height: 1.8;
      color: #44403c;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .policy-content p {
      margin-bottom: 12px;
    }

    /* ── UTILITY ── */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .mt-20 { margin-top: 20px; }
    .mb-20 { margin-bottom: 20px; }

    /* ── PRINT ── */
    @media print {
      body { margin: 0; padding: 0; }
      .page { page-break-after: always; }
    }
  </style>
</head>
<body>

<!-- ── COVER PAGE ── -->
<div class="page cover-page">
  <div class="cover-logo">T</div>
  <h1 class="cover-title">${name}</h1>
  <p class="cover-subtitle">${destinations}</p>
  <p class="cover-duration">${total_nights} Nights / ${total_days} Days</p>
  <div class="cover-guests">
    <div class="cover-guest-item">
      <div class="cover-guest-number">${adults}</div>
      <div class="cover-guest-label">Adults</div>
    </div>
    ${children > 0 ? `
      <div class="cover-guest-item">
        <div class="cover-guest-number">${children}</div>
        <div class="cover-guest-label">Children</div>
      </div>
    ` : ''}
    ${infants > 0 ? `
      <div class="cover-guest-item">
        <div class="cover-guest-number">${infants}</div>
        <div class="cover-guest-label">Infants</div>
      </div>
    ` : ''}
  </div>
  <div class="cover-footer">
    ${branding.company_name} · ${branding.address}
  </div>
</div>

<!-- ── ITINERARY PAGE ── -->
<div class="page content-page">
  <div class="page-header">
    <div class="page-header-left">
      <h1>Itinerary</h1>
      <p>${total_nights} Nights / ${total_days} Days</p>
    </div>
    <div class="page-header-right">
      <div class="package-code">Package Code: <span>${package_code}</span></div>
    </div>
  </div>

  ${package_days && package_days.length > 0 ? `
    <div class="section">
      ${package_days
        .sort((a: any, b: any) => a.day_number - b.day_number)
        .map((day: any) => `
          <div class="day-card">
            <div class="day-header">
              <span class="day-number">Day ${day.day_number}</span>
              <span class="day-title">${day.title || ''}</span>
            </div>
            ${day.package_day_activities && day.package_day_activities.length > 0 ? `
              <div class="day-activities">
                ${day.package_day_activities
                  .sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((activity: any) => `
                    <div class="activity-item">
                      ${activity.time_slot ? activity.time_slot + ' · ' : ''}
                      ${activities.find((a: any) => a.id === activity.activity_id)?.name || activity.custom_name || 'Activity'}
                    </div>
                  `)
                  .join('')}
              </div>
            ` : ''}
          </div>
        `)
        .join('')}
    </div>
  ` : ''}

  <div class="page-footer">
    ${branding.company_name} · ${branding.phone_primary}
  </div>
</div>

<!-- ── DESTINATIONS & HOTELS PAGE ── -->
<div class="page content-page">
  <div class="page-header">
    <div class="page-header-left">
      <h1>Destinations & Hotels</h1>
      <p>Accommodation Options</p>
    </div>
  </div>

  ${package_destinations && package_destinations.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Destinations</h2>
      <div class="section-content">
        ${package_destinations
          .sort((a: any, b: any) => a.leg_order - b.leg_order)
          .map((dest: any) => `
            <div class="destination-card">
              <h3>Leg ${dest.leg_order}: ${dest.destinations?.name || 'Destination'}</h3>
              <p>${dest.destinations?.country || ''} · ${dest.nights} nights</p>
            </div>
          `)
          .join('')}
      </div>
    </div>
  ` : ''}

  ${package_hotels && package_hotels.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Hotel Options</h2>
      <div class="section-content">
        ${package_hotels
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((hotel: any) => `
            <div class="hotel-option">
              <div>
                <div class="hotel-option-name">${hotel.hotels?.name || 'Hotel'}</div>
                <div class="hotel-option-detail">
                  <span class="hotel-option-tier">${hotel.tier}</span>
                </div>
              </div>
              <div class="hotel-option-detail">
                ${hotel.room_types?.name || ''} · ${hotel.occupancy_type || 'double'}
              </div>
              <div class="hotel-option-detail">
                ${hotel.meal_plans?.code ? hotel.meal_plans.code + ' - ' + hotel.meal_plans.name : 'Meal plan TBD'}
              </div>
            </div>
          `)
          .join('')}
      </div>
    </div>
  ` : ''}

  <div class="page-footer">
    ${branding.company_name} · ${branding.website}
  </div>
</div>

<!-- ── INCLUSIONS PAGE ── -->
<div class="page content-page">
  <div class="page-header">
    <div class="page-header-left">
      <h1>Inclusions & Exclusions</h1>
      <p>What's Covered</p>
    </div>
  </div>

  <div class="section">
    <div class="inclusions-grid">
      <div class="inclusion-list">
        <h4>✓ Inclusions</h4>
        ${package_inclusions && package_inclusions.filter((i: any) => i.type === 'inclusion').length > 0
          ? package_inclusions
              .filter((i: any) => i.type === 'inclusion')
              .map((item: any) => `<div class="inclusion-item inclusion">${item.text}</div>`)
              .join('')
          : '<div class="inclusion-item" style="color: #a8a29e;">None specified</div>'}
      </div>
      <div class="inclusion-list">
        <h4>✗ Exclusions</h4>
        ${package_inclusions && package_inclusions.filter((i: any) => i.type === 'exclusion').length > 0
          ? package_inclusions
              .filter((i: any) => i.type === 'exclusion')
              .map((item: any) => `<div class="inclusion-item exclusion">${item.text}</div>`)
              .join('')
          : '<div class="inclusion-item" style="color: #a8a29e;">None specified</div>'}
      </div>
    </div>
  </div>

  <div class="page-footer">
    ${branding.company_name} · ${branding.email_primary}
  </div>
</div>

<!-- ── PRICING PAGE ── -->
<div class="page content-page">
  <div class="page-header">
    <div class="page-header-left">
      <h1>Pricing & Payment</h1>
      <p>Cost Breakdown</p>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Per Person Costs</h2>
    <div class="pricing-section">
      <div class="pricing-row">
        <span class="pricing-label">Cost per Adult (${adults} × ₹${pricing?.cost_per_adult || 0})</span>
        <span class="pricing-value">₹${((pricing?.cost_per_adult || 0) * adults).toLocaleString('en-IN')}</span>
      </div>
      ${children > 0 ? `
        <div class="pricing-row">
          <span class="pricing-label">Cost per Child (${children} × ₹${pricing?.cost_per_child || 0})</span>
          <span class="pricing-value">₹${((pricing?.cost_per_child || 0) * children).toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      ${infants > 0 ? `
        <div class="pricing-row">
          <span class="pricing-label">Cost per Infant (${infants} × ₹${pricing?.cost_per_infant || 0})</span>
          <span class="pricing-value">₹${((pricing?.cost_per_infant || 0) * infants).toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      <div class="pricing-row">
        <span class="pricing-label">Base Total</span>
        <span class="pricing-value">₹${baseTotal.toLocaleString('en-IN')}</span>
      </div>
      ${pricing?.discount_amount > 0 ? `
        <div class="pricing-row">
          <span class="pricing-label">Discount ${pricing?.discount_reason ? '(' + pricing.discount_reason + ')' : ''}</span>
          <span class="pricing-value">-₹${pricing.discount_amount.toLocaleString('en-IN')}</span>
        </div>
      ` : ''}
      <div class="pricing-row">
        <span class="pricing-label">GST (${pricing?.gst_percent || 5}%)</span>
        <span class="pricing-value">₹${gstTotal.toLocaleString('en-IN')}</span>
      </div>
      <div class="pricing-row total">
        <span class="pricing-label">Grand Total</span>
        <span class="pricing-value">₹${grandTotal.toLocaleString('en-IN')}</span>
      </div>
    </div>
  </div>

  ${package_payment_schedule && package_payment_schedule.length > 0 ? `
    <div class="section">
      <h2 class="section-title">Payment Schedule</h2>
      <table class="payment-table">
        <thead>
          <tr>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${package_payment_schedule
            .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .map((row: any) => `
              <tr>
                <td>${new Date(row.due_date).toLocaleDateString('en-IN')}</td>
                <td>₹${row.amount.toLocaleString('en-IN')}</td>
                <td>${row.description}</td>
              </tr>
            `)
            .join('')}
          <tr style="background: #fafaf9; font-weight: 600;">
            <td colspan="2">Balance Due</td>
            <td>₹${balanceDue.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  ` : ''}

  <div class="page-footer">
    ${branding.company_name} · ${branding.phone_primary}
  </div>
</div>

<!-- ── TERMS & CONDITIONS PAGE ── -->
${tnc ? `
  <div class="page policy-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1>Terms & Conditions</h1>
        <p>Important Information</p>
      </div>
    </div>
    <div class="policy-content">${tnc.content}</div>
    <div class="page-footer">
      ${branding.company_name}
    </div>
  </div>
` : ''}

<!-- ── CANCELLATION POLICY PAGE ── -->
${cancellation ? `
  <div class="page policy-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1>Cancellation Policy</h1>
        <p>Refund Terms</p>
      </div>
    </div>
    <div class="policy-content">${cancellation.content}</div>
    <div class="page-footer">
      ${branding.company_name}
    </div>
  </div>
` : ''}

<!-- ── REVIEWS PAGE ── -->
${reviews && reviews.length > 0 ? `
  <div class="page content-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1>Reviews</h1>
        <p>What Our Guests Say</p>
      </div>
    </div>

    <div class="section">
      ${reviews
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((review: any) => `
          <div class="review-card">
            <div class="review-header">
              <div>
                <div class="review-name">${review.reviewer_name}</div>
                ${review.reviewer_city ? `<div class="review-city">${review.reviewer_city}</div>` : ''}
              </div>
              <div class="review-rating">${'★'.repeat(review.rating)}</div>
            </div>
            <div class="review-text">"${review.review_text}"</div>
          </div>
        `)
        .join('')}
    </div>

    <div class="page-footer">
      ${branding.company_name} · tentwoodtrips.com
    </div>
  </div>
` : ''}

<!-- ── CONTACT PAGE ── -->
<div class="page contact-page">
  <div class="contact-company">${branding.company_name}</div>
  <div class="contact-tagline">
    ${branding.tagline || 'We don\'t just send you places — we create travel stories you\'ll cherish forever.'}
  </div>

  <div class="contact-grid">
    <div class="contact-item">
      <div class="contact-item-label">Phone</div>
      <div class="contact-item-value">${branding.phone_primary}</div>
    </div>
    <div class="contact-item">
      <div class="contact-item-label">WhatsApp</div>
      <div class="contact-item-value">${branding.whatsapp_number}</div>
    </div>
    <div class="contact-item">
      <div class="contact-item-label">Email</div>
      <div class="contact-item-value"><a href="mailto:${branding.email_primary}">${branding.email_primary}</a></div>
    </div>
    <div class="contact-item">
      <div class="contact-item-label">Website</div>
      <div class="contact-item-value"><a href="https://${branding.website}">${branding.website}</a></div>
    </div>
  </div>

  <div class="contact-social">
    <div class="contact-social-item">
      <div class="contact-social-label">Instagram</div>
      <div class="contact-social-value">${branding.instagram_url.replace('https://instagram.com/', '@')}</div>
    </div>
    <div class="contact-social-item">
      <div class="contact-social-label">UPI</div>
      <div class="contact-social-value">${branding.upi_id}</div>
    </div>
  </div>

  <div class="contact-footer">
    ${branding.address}<br>
    ${branding.company_name} · All rights reserved
  </div>
</div>

</body>
</html>
  `
}