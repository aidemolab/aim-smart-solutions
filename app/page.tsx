const outcomes = [
  { number: "01", title: "Win more enquiries", body: "Acknowledge new leads quickly, capture the right information and make urgent opportunities easier to act on.", result: "Fewer valuable enquiries left waiting." },
  { number: "02", title: "Serve customers faster", body: "Remove avoidable delays from quotations, bookings, confirmations and routine customer communication.", result: "A smoother, more responsive customer journey." },
  { number: "03", title: "Release capacity for growth", body: "Automate repetitive administration and bring important information into a clear, usable view.", result: "More time for customers, delivery and growth." },
];

const offers = [
  { label: "Enquiries & follow-up", title: "Never Miss an Enquiry", body: "Capture, acknowledge and prioritise customer enquiries so opportunities do not sit unnoticed when your team is busy.", includes: ["Structured enquiry capture", "Immediate customer acknowledgement", "Optional urgent AI voice response", "Clear follow-up workflow"] },
  { label: "Quotes & appointments", title: "Faster Quote-to-Booking", body: "Collect complete requirements at the start, reduce back-and-forth and move suitable customers towards a confirmed appointment.", includes: ["Guided service requests", "Quotation-ready information", "Online appointment selection", "Confirmations and reminders"] },
  { label: "Operations & decisions", title: "Smarter Business Operations", body: "Remove repeated tasks and turn scattered business information into practical dashboards and workflows your team can use.", includes: ["Workflow review", "Focused automation", "Dashboards and reporting", "Adoption support"] },
];

const demonstrations = [
  { number: "01", title: "An urgent lead receives a faster response", problem: "A new enquiry arrives while the owner is busy.", solution: "The customer receives confirmation and can request an immediate AI voice response.", href: "/business-enquiry", cta: "Try the live enquiry" },
  { number: "02", title: "A service request arrives quotation-ready", problem: "Missing details cause repeated emails and slow down the quotation.", solution: "A guided request captures the relevant information for every selected service.", href: "/instant-quote", cta: "Try the service request" },
  { number: "03", title: "A meeting books without diary chasing", problem: "Finding a time and sending reminders consumes valuable administration.", solution: "The customer selects an available appointment and receives confirmation and reminders.", href: "/book-appointment", cta: "View live availability" },
];

const faqs = [
  ["Do I need to know which technology I need?", "No. The conversation begins with the business problem, the cost of the current process and the outcome you want. AIM recommends technology only when it is useful."],
  ["Will this replace my existing systems?", "Not necessarily. Many improvements can connect or simplify the tools you already use. The smallest practical solution is considered first."],
  ["Is AI suitable for every problem?", "No. Sometimes a clearer process, a simple automation or a dashboard is the better answer. You will not be sold AI for its own sake."],
  ["Will the first call cost anything?", "No. The AI Opportunity Call is free and carries no obligation. You will leave with a clearer view of the first opportunity worth exploring."],
  ["Can you work with a small team?", "Yes. AIM is designed for small and growing service businesses that need practical support without employing an in-house data, automation or AI specialist."],
];

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AIM Smart Solutions home"><img src="/aim-smart-solutions-logo.png" alt="AIM Smart Solutions" /></a>
        <nav aria-label="Main navigation"><a href="#outcomes">Outcomes</a><a href="#solutions">Solutions</a><a href="#proof">Proof</a><a href="#fit">Is this for you?</a><a href="#about">Why AIM</a><a href="#faq">Questions</a></nav>
        <a className="nav-cta" href="/book-appointment">Book a free AI opportunity call</a>
      </header>

      <section className="funnel-hero">
        <div className="funnel-hero-copy">
          <p className="eyebrow"><span /> Practical AI &amp; automation for service businesses</p>
          <h1>Win more customers. Serve them faster. <em>Give your team hours back.</em></h1>
          <p className="hero-lede">When enquiries wait, follow-up slips and administration takes over, growth becomes harder. AIM Smart Solutions turns those costly bottlenecks into practical, automated customer journeys.</p>
          <div className="hero-actions"><a className="button primary" href="/book-appointment">Book your free AI opportunity call <span>→</span></a><a className="button secondary" href="#proof">See the solutions working <span>↓</span></a></div>
          <div className="risk-reversal"><span>✓ Free initial call</span><span>✓ No technical knowledge needed</span><span>✓ No obligation</span></div>
        </div>
        <aside className="opportunity-panel" aria-label="What you receive from the free call">
          <p className="panel-label">Your free AI Opportunity Call</p><h2>Find the first improvement worth making.</h2>
          <ol><li><span>01</span><div><strong>Expose the costly bottleneck</strong><p>Identify where leads, time or useful information are being lost.</p></div></li><li><span>02</span><div><strong>Estimate the business value</strong><p>Connect the problem to customer experience, capacity or revenue.</p></div></li><li><span>03</span><div><strong>Choose a practical next step</strong><p>Leave with one focused opportunity—not a list of unnecessary tools.</p></div></li></ol>
          <a href="/book-appointment">Choose a convenient time →</a>
        </aside>
      </section>

      <section className="authority-strip" aria-label="Reasons to trust AIM Smart Solutions"><span><b>Working solutions</b> you can test now</span><span><b>PhD-level analysis</b> without the jargon</span><span><b>Data, AI &amp; automation</b> in one practical service</span><span><b>Bolton-based</b> with UK-wide support</span></section>

      <section className="section outcomes" id="outcomes"><div className="section-intro"><div><p className="kicker">The commercial outcome</p><h2>AI should improve the business—not merely <em>impress it.</em></h2></div><p>Your customers do not care which tools you use. They notice how quickly you respond, how easy you are to deal with and whether your service feels organised.</p></div><div className="outcome-grid">{outcomes.map(item => <article key={item.number}><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p><strong>{item.result}</strong></article>)}</div></section>

      <section className="cost-section"><div><p className="kicker light">The cost of waiting</p><h2>Every slow response gives the customer another reason to look elsewhere.</h2></div><div className="cost-list"><p><span>01</span><strong>Missed revenue</strong> from enquiries that receive a faster answer elsewhere.</p><p><span>02</span><strong>Restricted capacity</strong> while skilled people repeat avoidable administration.</p><p><span>03</span><strong>Weaker decisions</strong> when important information remains scattered and unclear.</p></div></section>

      <section className="section solution-section" id="solutions"><div className="section-intro"><div><p className="kicker">Outcome-led solutions</p><h2>Start with what must improve. <em>Then choose the technology.</em></h2></div><p>You do not need to diagnose the software. Choose the business outcome that matters and AIM will shape the right practical response.</p></div><div className="offer-grid">{offers.map((offer, index) => <article className="offer-card" key={offer.title}><p className="card-tag">{offer.label}</p><span className="offer-number">0{index + 1}</span><h3>{offer.title}</h3><p>{offer.body}</p><ul>{offer.includes.map(item => <li key={item}>✓ {item}</li>)}</ul><a href="/book-appointment">Discuss this outcome →</a></article>)}</div><div className="specialist-line"><strong>Also available:</strong> Customer email automation · AI voice agents · business dashboards · reporting · workflow discovery · tailored process automation</div></section>

      <section className="proof-section" id="proof"><div className="section proof-inner"><div className="proof-heading"><div><p className="kicker light">Evidence before promises</p><h2>Do not imagine the solution. <em>Test it.</em></h2></div><p>These are working customer journeys—not illustrations. Use them to experience how faster response, better information and simpler booking can feel.</p></div><div className="proof-grid">{demonstrations.map(item => <article key={item.number}><div className="proof-card-top"><span>{item.number}</span><b>LIVE</b></div><h3>{item.title}</h3><dl><dt>Without improvement</dt><dd>{item.problem}</dd><dt>With AIM</dt><dd>{item.solution}</dd></dl><a href={item.href}>{item.cta} →</a></article>)}</div></div></section>

      <section className="section fit-section" id="fit"><div className="fit-copy"><p className="kicker">A strong fit?</p><h2>Built for service businesses where <em>follow-up matters.</em></h2><p>AIM initially works with small and growing service businesses—particularly training, education, professional and local services—that depend on enquiries, quotations, appointments and good communication.</p><a className="button primary" href="/book-appointment">Check whether AIM can help <span>→</span></a></div><div className="fit-checklist"><h3>This conversation is worth having if…</h3><p>✓ Leads sometimes wait or disappear into an inbox</p><p>✓ Your team repeats the same emails, booking steps or reports</p><p>✓ Quotations are delayed by missing customer information</p><p>✓ Important business information lives in separate files or systems</p><p>✓ You want to explore AI without hiring a technical team</p><p>✓ You value a practical result more than technology hype</p></div></section>

      <section className="about funnel-about" id="about"><div className="about-photo"><img src="/alaa-mostafa-about.png" alt="Alaa Mostafa, Founder of AIM Smart Solutions" /></div><div className="about-copy"><p className="kicker">Why work with AIM?</p><h2>Technical depth.<br /><em>Commercial clarity.</em></h2><p className="role">Alaa Mostafa · Founder &amp; Practical AI and Automation Consultant</p><p className="about-lead">You need someone who can understand the technology—and explain what it will actually change for your business.</p><p>Alaa combines experience in data analysis, business intelligence, dashboards, automation, AI and professional education. With a PhD in Semiconductor Physics and a career built around analytical problem-solving and teaching, he makes complex possibilities understandable and usable.</p><div className="founder-principles"><span>Understand the real problem</span><span>Build the smallest useful solution</span><span>Support people to use it confidently</span></div><a className="text-link" href="/book-appointment">Talk directly with Alaa →</a></div></section>

      <section className="section faq-section" id="faq"><div className="faq-intro"><p className="kicker">Before you book</p><h2>Clear answers. <em>No hard sell.</em></h2><p>The first conversation is designed to establish whether there is a useful opportunity—not to push technology your business does not need.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="final-cta"><p className="kicker light">One useful conversation</p><h2>Where is your business losing customers, time or clarity?</h2><p>Book a free AI Opportunity Call and identify the first practical improvement worth exploring.</p><a className="button primary" href="/book-appointment">Book your free call <span>→</span></a><small>Free initial conversation · No technical knowledge required · No obligation</small></section>

      <footer><a className="footer-brand" href="#top"><img src="/aim-smart-solutions-logo.png" alt="AIM Smart Solutions" /></a><p>Practical AI and automation that helps service businesses win more opportunities, serve customers faster and release capacity for growth.</p><nav aria-label="Footer navigation"><a href="#outcomes">Outcomes</a><a href="#solutions">Solutions</a><a href="#proof">Proof</a><a href="/instant-quote">Request a proposal</a><a href="/business-enquiry">Live enquiry demo</a></nav><small>© {new Date().getFullYear()} AIM Smart Solutions. All rights reserved.</small></footer>
    </main>
  );
}
