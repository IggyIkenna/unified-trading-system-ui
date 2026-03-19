import ContactForm from "@/components/ContactForm";

const teamMembers = [
  {
    name: "Ikenna Igboaka",
    role: "CEO & Founder",
    bio: "Pricing specialist with 10+ years in derivatives and team leadership.",
    initials: "II",
  },
  {
    name: "Robert Osborne",
    role: "CFO & Board Member",
    bio: "Business adviser with 20+ years in government, accounting, and VC.",
    initials: "RO",
  },
  {
    name: "Shaun Lim",
    role: "Business Development Partner & Board Member",
    bio: "Strategic business development leader driving partnerships and commercial growth.",
    initials: "SL",
  },
  {
    name: "Julian John",
    role: "Project Manager",
    bio: "Project management specialist with 10+ years experience delivering complex programmes. Ex-Army.",
    initials: "JJ",
  },
  {
    name: "Femi Amoo",
    role: "Head of Platform Infra & Cloud Operations",
    bio: "Cloud infrastructure and platform operations leader with deep DevOps and systems expertise.",
    initials: "FA",
  },
  {
    name: "Harsh",
    role: "Head of Quantitative Research",
    bio: "Quantitative researcher with expertise in ML-driven trading strategies and options pricing.",
    initials: "H",
  },
];

const tractionStats = [
  { label: "Active strategy clients", value: "8" },
  { label: "Edge Capital fund-to-fund", value: "Live" },
  { label: "Indian options mandate", value: "Live March 2026" },
  { label: "Venues", value: "33" },
  { label: "Repos", value: "60+" },
];

export default function Home() {
  return (
    <div className="bg-white">
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <h1
              className="text-4xl font-semibold leading-tight md:text-6xl"
              style={{ color: "#ffffff" }}
            >
              Opportunities
              <br />
              <br />
              Drive
              <br />
              unprecedented
              <br />
              momentum
            </h1>
            <p className="max-w-2xl text-lg text-neutral-200">
              Odum Research builds highly tuned pricing, risk and execution
              strategies at low latency to capture financial market
              inefficiencies across derivatives and spot markets.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="rounded bg-white px-5 py-2 text-sm font-medium text-black"
              >
                Contact us
              </a>
              <a
                href="#overview"
                className="rounded border border-neutral-400 px-5 py-2 text-sm font-medium text-white"
              >
                Business overview
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-6 rounded border border-neutral-800 bg-neutral-900 p-6 text-sm text-neutral-300">
            <div className="flex items-center gap-4">
              <img
                src="https://static.wixstatic.com/media/75b7b3_c007ca3165df412b9835bb9f493850fc~mv2.png/v1/fill/w_158,h_160,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/download%20(2).png"
                alt="Odum Research logo"
                className="h-12 w-12 rounded-full border border-neutral-700 object-cover"
              />
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
                  About Odum
                </p>
                <p className="text-base font-semibold text-white">
                  Research-led trading systems
                </p>
              </div>
            </div>
            <p>
              Odum carries two meanings: the lion for strength and the tree for
              rooted innovation. We build diversified strategies from a common
              framework to capture market inefficiencies.
            </p>
            <img
              src="https://static.wixstatic.com/media/99e181_f01342356ad04a00a908b6127a8f5672~mv2.png/v1/fill/w_600,h_600,al_c,lg_1,q_85,enc_avif,quality_auto/Black%20Modern%20Future%20Webs%20Logo.png"
              alt="Odum hero illustration"
              className="h-40 w-full rounded border border-neutral-800 object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 px-4 py-6 sm:gap-10 sm:px-6">
          {tractionStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-semibold text-black">{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="services"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <h2 className="text-2xl font-semibold">Services</h2>
        <p className="mt-4 max-w-3xl text-neutral-700">
          We provide institutional-grade technology and research as a service —
          covering data, execution, backtesting, strategy, investment
          management, and regulatory compliance.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Data Provision",
              desc: "Multi-venue market data aggregation across 33 venues — CeFi, TradFi, and DeFi.",
            },
            {
              title: "Backtesting as a Service",
              desc: "High-fidelity historical replay with realistic fills, slippage, and latency simulation.",
            },
            {
              title: "Strategy White-Labelling",
              desc: "Deploy proven quantitative strategies under your own fund or mandate.",
            },
            {
              title: "Execution as a Service",
              desc: "Low-latency smart order routing with real-time risk controls and position management.",
            },
            {
              title: "Investment Management",
              desc: "Discretionary and systematic portfolio management powered by ML-driven alpha signals.",
            },
            {
              title: "Regulatory Umbrella",
              desc: "Operate under our compliance framework — MiFID/FCA reporting, audit trails, and best execution.",
            },
          ].map((service) => (
            <div
              key={service.title}
              className="rounded border border-neutral-200 bg-white p-5"
            >
              <h3 className="text-sm font-semibold">{service.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="overview"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold">Business overview</h2>
            <p className="mt-4 text-neutral-700">
              Our systems are fully automated and market neutral. We combine
              market making with predictive systems for both pure and
              statistical arbitrage, with our current focus in crypto markets
              and ambitions extending beyond.
            </p>
            <p className="mt-4 text-neutral-700">
              Revenue generated internally by the collaboration between seasoned
              traders and engineers supports continuous innovation and model
              refinement.
            </p>
          </div>
          <div className="rounded border border-neutral-200 bg-neutral-50 p-6">
            <h3 className="text-lg font-semibold">Approach highlights</h3>
            <p className="mt-3 text-sm text-neutral-700">
              A micro-service structure enables rapid deployment, 24/7 market
              access, and resilient simulations powered by a team seasoned in
              real-world market dynamics.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-neutral-700">
              <li>Low-latency execution and robust risk controls.</li>
              <li>Market-making blended with predictive systems.</li>
              <li>Continuous simulation and iteration.</li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="team"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <h2 className="text-2xl font-semibold">Meet the team</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="group flex flex-col rounded-lg border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
                <div className="shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-neutral-100 bg-neutral-200 text-2xl font-semibold text-neutral-500 ring-2 ring-neutral-50 group-hover:ring-neutral-100 transition-shadow">
                    {member.initials}
                  </div>
                </div>
                <div className="mt-4 sm:ml-5 sm:mt-0">
                  <h3 className="text-base font-semibold tracking-tight text-neutral-900">
                    {member.name}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-neutral-500">
                    {member.role}
                  </p>
                </div>
              </div>
              <p className="mt-4 border-t border-neutral-100 pt-4 text-sm leading-relaxed text-neutral-600">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="board" className="bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold">Meet the board</h2>
          <div className="mt-6 rounded border border-neutral-200 bg-white p-6">
            <img
              src="https://static.wixstatic.com/media/99e181_e8322753cc634eb1b5a523221141b241~mv2.png/v1/crop/x_105,y_105,w_273,h_273/fill/w_232,h_232,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Black%20Modern%20Future%20Webs%20Logo%20(3).png"
              alt="Taco Sieburgh Sjoerdsma headshot"
              className="h-24 w-24 rounded-full border border-neutral-200 object-cover"
            />
            <h3 className="text-lg font-semibold">Taco Sieburgh Sjoerdsma</h3>
            <p className="text-sm text-neutral-600">Board member</p>
            <p className="mt-3 text-sm text-neutral-700">
              Experienced CFO, COO, and compliance officer with a background in
              investment management and due diligence.
            </p>
          </div>
        </div>
      </section>

      <section id="approach" className="bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold">Our approach</h2>
          <p className="mt-4 max-w-3xl text-neutral-700">
            Our micro-service structure facilitates rapid and agile development
            of strategies using cutting edge technology. Our systems are built
            for 24/7 continuous market access even during upgrades. Our robust
            simulation is driven by a team who have seen it go well and have
            seen it go wrong.
          </p>
          <a
            className="mt-4 inline-block text-sm text-black underline"
            href="https://www.odum-research.com/disclaimer"
            target="_blank"
            rel="noreferrer"
          >
            Read the disclaimer
          </a>
        </div>
      </section>

      <section
        id="careers"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <h2 className="text-2xl font-semibold">Careers</h2>
        <p className="mt-4 text-neutral-700">
          Contact us to hear about upcoming opportunities and events at Odum
          Research.
        </p>
      </section>

      <section
        id="contact"
        className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <h2 className="text-2xl font-semibold">Contact us</h2>
        <p className="mt-4 text-neutral-700">
          Reach out to hear about upcoming opportunities or request access to
          client presentations.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded border border-neutral-200 p-5">
            <p className="text-sm text-neutral-600">Email</p>
            <p className="text-base">info@odum-research.com</p>
          </div>
          <div className="rounded border border-neutral-200 p-5">
            <p className="text-sm text-neutral-600">LinkedIn</p>
            <a
              className="text-base text-black underline"
              href="https://www.linkedin.com/company/odum-research"
              target="_blank"
              rel="noreferrer"
            >
              Follow Odum Research
            </a>
          </div>
          <div className="rounded border border-neutral-200 p-5 md:col-span-2">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
