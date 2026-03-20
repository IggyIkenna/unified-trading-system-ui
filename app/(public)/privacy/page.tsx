"use client"


export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p><strong className="text-foreground">Last Updated:</strong> March 2026</p>
          
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly, including name, email, company details, and trading preferences when you create an account or contact us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">2. How We Use Information</h2>
            <p>We use collected information to provide our services, process transactions, communicate with you, and improve our platform. We do not sell personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Data Security</h2>
            <p>We implement industry-standard security measures including encryption, access controls, and regular security audits. As an FCA-authorised firm, we adhere to strict data protection requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">4. Data Retention</h2>
            <p>We retain data as required by regulatory obligations and for legitimate business purposes. Trading data is retained for a minimum of 5 years per MiFID II requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Your Rights</h2>
            <p>Under GDPR, you have rights to access, correct, delete, and port your data. Contact privacy@odum-research.com to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">6. Contact</h2>
            <p>For privacy inquiries: privacy@odum-research.co.uk</p>
            <p>Data Protection Officer: Odum Research Ltd, London, UK</p>
          </section>
        </div>
      </main>
    </div>
  )
}
