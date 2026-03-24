"use client";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p>
            <strong className="text-foreground">Last Updated:</strong> March
            2026
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              1. Services
            </h2>
            <p>
              Odum Research Ltd provides trading infrastructure services
              including data provision, backtesting, execution, and investment
              management. Services are available to Professional Clients only as
              defined by FCA rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              2. Eligibility
            </h2>
            <p>
              Our services are designed for professional and institutional
              participants. Client categorisation is determined during the
              onboarding process in accordance with FCA rules and MiFID II
              classifications. Access to certain services may be subject to
              eligibility assessment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              3. Risk Disclosure
            </h2>
            <p>
              Trading in financial instruments carries substantial risk. Past
              performance is not indicative of future results. You should only
              trade with capital you can afford to lose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              4. Fees
            </h2>
            <p>
              Fees are as disclosed in your service agreement. Investment
              management fees are charged on a performance basis with high-water
              mark provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              5. Intellectual Property
            </h2>
            <p>
              All platform content, algorithms, and data developed by Odum
              remain the property of Odum Research Ltd. Client strategies
              developed using our tools remain client property.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Odum Research Ltd shall
              not be liable for indirect, incidental, or consequential damages
              arising from use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">
              7. Governing Law
            </h2>
            <p>
              These terms are governed by the laws of England and Wales.
              Disputes shall be resolved in the courts of London.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
